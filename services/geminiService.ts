
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentData, CareGoal } from '../types';

// Initialize Gemini API
// NOTE: In a real production app, this should be a backend call to hide the API KEY.
// For this demo/prototype, we use the client-side SDK with a process.env variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the response schema for structured output
// FIX (Doc 26): Removed empty strings "" from enums to prevent HTTP 400 Invalid Argument errors.
const schema = {
  type: Type.OBJECT,
  properties: {
    structuredData: {
      type: Type.OBJECT,
      description: "Assessment fields to be updated based on the conversation.",
      properties: {
        serviceHistory: { type: Type.STRING, enum: ["利用なし", "介護保険のみ利用中", "医療・障害併用", "自費サービス利用"] },
        healthStatus: { type: Type.STRING, enum: ["安定している", "定期的な通院が必要", "体調変動が大きい", "終末期・重篤"] },
        pastHistory: { type: Type.STRING, enum: ["特になし", "脳血管疾患", "心疾患", "骨折", "認知症"] },
        skinCondition: { type: Type.STRING, enum: ["問題なし", "乾燥・痒みあり", "褥瘡・発赤あり", "医療処置中"] },
        oralHygiene: { type: Type.STRING, enum: ["問題なし", "歯科受診が必要", "義歯不適合", "咀嚼・嚥下困難"] },
        fluidIntake: { type: Type.STRING, enum: ["十分摂取", "意識して摂取中", "不足気味", "制限あり(医師指示)"] },
        adlTransfer: { type: Type.STRING, enum: ["自立", "見守りが必要", "一部介助", "全介助"] },
        adlEating: { type: Type.STRING, enum: ["自立", "見守り・セッティング", "一部介助", "全介助"] },
        adlToileting: { type: Type.STRING, enum: ["自立", "ポータブルトイレ使用", "オムツ使用(介助)", "全介助"] },
        adlBathing: { type: Type.STRING, enum: ["自立", "見守り", "一部介助", "全介助・清拭"] },
        adlDressing: { type: Type.STRING, enum: ["自立", "ボタン等一部介助", "着脱全介助", "季節に合わない"] },
        iadlCooking: { type: Type.STRING, enum: ["自立", "一部困難", "全般的に困難", "実施していない"] },
        iadlShopping: { type: Type.STRING, enum: ["自立", "付き添いが必要", "代行が必要", "困難"] },
        iadlMoney: { type: Type.STRING, enum: ["自立", "家族が支援", "後見人等が管理", "困難"] },
        medication: { type: Type.STRING, enum: ["自立", "カレンダー等で自立", "声掛けが必要", "管理困難"] },
        cognition: { type: Type.STRING, enum: ["自立", "年齢相応の物忘れ", "認知症の疑い", "認知症(診断済)"] },
        communication: { type: Type.STRING, enum: ["良好", "聞き返しが必要", "意思伝達困難", "反応なし"] },
        socialParticipation: { type: Type.STRING, enum: ["積極的", "週1回程度", "閉じこもりがち", "交流拒否"] },
        residence: { type: Type.STRING, enum: ["問題なし", "段差あり(改修済)", "段差等の課題あり", "著しく不衛生"] },
        familySituation: { type: Type.STRING, enum: ["同居家族が主介護", "独居・近隣に支援者", "独居・支援者なし", "老老介護"] },
        maltreatmentRisk: { type: Type.STRING, enum: ["兆候なし", "介護疲れの兆候", "経済的虐待の懸念", "身体的虐待の懸念"] }
      }
    },
    summary: {
      type: Type.STRING,
      description: "A comprehensive summary of the entire conversation in JAPANESE (日本語)."
    },
    missingInfoAdvice: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Advice to the Care Manager in JAPANESE (日本語) about what important topics have NOT been discussed yet."
    }
  }
};

/**
 * refineCareGoal
 * Refines a long-term goal to be more "Self-Reliance" focused.
 */
export const refineCareGoal = async (currentGoal: string): Promise<string> => {
  try {
    const prompt = `
      あなたは日本のベテランケアマネジャーです。
      以下のケアプランの長期目標を、「自立支援」の視点に基づき、より具体的で前向きな日本語の文章に校正してください。
      50文字以内で簡潔にまとめてください。
      入力: "${currentGoal}"
    `;
    
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return result.text || currentGoal;
  } catch (e) {
    console.error("AI Goal Refinement Error:", e);
    return currentGoal; // Fallback
  }
};

/**
 * analyzeAssessmentConversation
 * Analyzes audio blob + current context to perform differential updates and summary.
 * @param isFinal If true, generates a comprehensive text summary. If false, only updates structured data.
 * @param currentSummary The existing summary text to be appended/refined (for Resume mode).
 */
export const analyzeAssessmentConversation = async (
  audioBlob: Blob, 
  currentData: AssessmentData,
  isFinal: boolean = false,
  currentSummary: string = ""
): Promise<any> => {
  // Convert Blob to Base64
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      try {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Phase 5 Prompt: Context-Aware Differential Update & Summary Rewrite (Japanese)
        // v1.2.1 Update: Logic branch for isFinal (Summary generation)
        // Phase 6 Update: Resume capability with currentSummary context
        const prompt = `
          あなたは日本のケアマネジャーのアシスタントAIです。
          クライアント（利用者）との面談録音を分析し、アセスメント情報を整理してください。
          
          【タスク】
          1. 提供された音声データを分析する。これは${currentSummary ? '「追加の会話」' : '「会話の全体（または一部）」'}です。
          2. 会話内容に基づいて、アセスメントの構造化データ（structuredData）を更新する。
          ${isFinal ? '3. 会話全体の「要約（summary）」を作成する。**必ず日本語で記述すること。**' : '3. 今回は中間解析のため、要約（summary）は作成しないこと。'}
          4. まだ確認できていない項目について、次に聞くべき質問のアドバイス（missingInfoAdvice）を作成する。**必ず日本語で記述すること。**

          【コンテキスト - 現在の入力状況】
          ${JSON.stringify(currentData)}

          ${currentSummary ? `
          【コンテキスト - 既存の要約】
          ${currentSummary}
          ` : ''}

          【構造化データのルール (差分更新)】
          - 音声内容と「現在の入力状況」を比較する。
          - 新しい情報や変更点がある場合のみ、該当する値をセットする。
          - 音声で言及がない項目は、JSONにキーを含めないこと（nullや空文字も不可）。

          ${isFinal ? `
          【要約のルール (統合・追記)】
          - ${currentSummary ? '「既存の要約」の内容を保持しつつ、今回の音声から得られた新しい情報を統合して、全体として矛盾のない自然な文章に書き直してください。' : '音声の内容を要約してください。'}
          - 「特記事項」として適切な、専門的な日本語の文章（常体または丁寧語の統一された文体）で作成する。
          ` : `
          【要約のルール】
          - **今回は summary フィールドを返さない、または空文字にすること。**
          `}

          【アドバイスのルール】
          - スキーマ内でまだ「未確認」または情報不足の重要項目を特定する。
          - 次に聞くべき簡潔な質問を1〜3つ提案する。**必ず日本語で記述すること。**
        `;

        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            parts: [
              { inlineData: { mimeType: "audio/webm", data: base64Audio } },
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          }
        });

        const jsonText = result.text;
        if (!jsonText) throw new Error("No text returned from Gemini");
        return resolve(JSON.parse(jsonText));

      } catch (error) {
        console.error("Gemini Analysis Error:", error);
        reject(error);
      }
    };
    reader.readAsDataURL(audioBlob);
  });
};

/**
 * generateCarePlanDraft
 * Creates a draft of Long-term and Short-term goals based on Assessment Data.
 */
export const generateCarePlanDraft = async (
  assessment: AssessmentData, 
  instruction: string
): Promise<{ longTermGoal: string, shortTermGoals: string[] }> => {
  try {
    const planSchema = {
      type: Type.OBJECT,
      properties: {
        longTermGoal: { 
          type: Type.STRING,
          description: "A comprehensive long-term goal focusing on user's life quality."
        },
        shortTermGoals: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of 2-4 concrete short-term goals."
        }
      }
    };

    const prompt = `
      あなたは2025年時点の日本の介護保険制度に精通した熟練ケアマネジャーです。
      「適切なケアマネジメント手法」に基づき、以下の【アセスメント情報】と【ケアマネジャーの意図】から、
      居宅サービス計画書（第2表）の「長期目標」と「短期目標」のドラフトを作成してください。

      【アセスメント情報 (23項目)】
      ${JSON.stringify(assessment)}

      【ケアマネジャーの意図・方針】
      ${instruction}

      【作成ルール】
      1. **ゴールデンスレッドの厳守**: アセスメントで特定された「解決すべき課題（Needs）」に対応する目標であること。矛盾があってはならない。
      2. **自立支援・重度化防止**: 単なる「お世話」や「維持」ではなく、「本人が〜できるようになる」「〜の状態を維持し、悪化を防ぐ」といった前向きな表現を用いること。
      3. **具体性 (SMART)**: 短期目標は、「週◯回〜する」「〜を使って〜ができる」など、評価可能な具体的行動目標にすること。
      4. **日本語品質**: ケアプランとしてそのまま使用できる、専門的かつ利用者にも分かりやすい日本語で記述すること。
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: planSchema
      }
    });

    const jsonText = result.text;
    if (!jsonText) throw new Error("No text returned for Plan Draft");
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Plan Draft Generation Error:", error);
    throw error;
  }
};
