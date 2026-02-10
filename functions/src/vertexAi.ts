import { VertexAI, SchemaType } from '@google-cloud/vertexai';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { buildCarePlanPrompt } from './prompts/careplanPrompt';

const PROJECT_ID = 'caremanager-ai-copilot';
const LOCATION = 'asia-northeast1';
const MODEL_ID = 'gemini-2.5-flash';

const vertexAi = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

const model = vertexAi.getGenerativeModel({
  model: MODEL_ID,
});

type HttpsErrorCode = 'unavailable' | 'internal' | 'resource-exhausted';

function classifyVertexError(error: unknown): { code: HttpsErrorCode; message: string } {
  const status = (error as { status?: number })?.status;
  const code = (error as { code?: string })?.code;
  const msg = error instanceof Error ? error.message : 'Unknown error';

  const isTransient =
    status === 429 ||
    status === 503 ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'RESOURCE_EXHAUSTED' ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('503') ||
    msg.includes('429');

  if (isTransient) {
    return {
      code: 'unavailable',
      message: '一時的に利用できません。しばらくしてから再試行してください。',
    };
  }

  return {
    code: 'internal',
    message: msg,
  };
}

// アセスメントデータのJSONスキーマ
const assessmentSchema = {
  type: SchemaType.OBJECT,
  properties: {
    serviceHistory: { type: SchemaType.STRING },
    healthStatus: { type: SchemaType.STRING },
    pastHistory: { type: SchemaType.STRING },
    skinCondition: { type: SchemaType.STRING },
    oralHygiene: { type: SchemaType.STRING },
    fluidIntake: { type: SchemaType.STRING },
    adlTransfer: { type: SchemaType.STRING },
    adlEating: { type: SchemaType.STRING },
    adlToileting: { type: SchemaType.STRING },
    adlBathing: { type: SchemaType.STRING },
    adlDressing: { type: SchemaType.STRING },
    iadlCooking: { type: SchemaType.STRING },
    iadlShopping: { type: SchemaType.STRING },
    iadlMoney: { type: SchemaType.STRING },
    medication: { type: SchemaType.STRING },
    cognition: { type: SchemaType.STRING },
    communication: { type: SchemaType.STRING },
    socialParticipation: { type: SchemaType.STRING },
    residence: { type: SchemaType.STRING },
    familySituation: { type: SchemaType.STRING },
    maltreatmentRisk: { type: SchemaType.STRING },
    environment: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
  },
  required: ['summary'],
};

interface AnalyzeAssessmentRequest {
  audioBase64: string;
  currentData: Record<string, string>;
  isFinal: boolean;
  currentSummary: string;
}

function buildPrompt(
  currentData: Record<string, string>,
  isFinal: boolean,
  currentSummary: string
): string {
  const basePrompt = `あなたは介護支援専門員（ケアマネージャー）のアセスメント記録を支援するAIです。
音声から会話内容を解析し、23項目アセスメントの各項目に該当する情報を抽出してください。

【現在のアセスメントデータ】
${JSON.stringify(currentData, null, 2)}

【現在の要約】
${currentSummary || 'なし'}

【指示】
1. 音声の内容を解析し、アセスメント23項目に該当する情報を抽出してください
2. 新しい情報は既存データに追記してください（上書きではなく）
3. summaryフィールドには会話の要点を簡潔にまとめてください
4. 情報が聞き取れなかった項目は空文字列のままにしてください

${isFinal ? '【最終分析】これが最後の音声です。総合的なまとめを作成してください。' : ''}`;

  return basePrompt;
}

export const analyzeAssessment = onCall<AnalyzeAssessmentRequest>(
  {
    region: LOCATION,
    memory: '1GiB',
    timeoutSeconds: 120,
    cors: true,
  },
  async (request) => {
    // 認証チェック
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }

    const { audioBase64, currentData, isFinal, currentSummary } = request.data;

    if (!audioBase64) {
      throw new HttpsError('invalid-argument', '音声データが必要です');
    }

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: audioBase64,
                },
              },
              {
                text: buildPrompt(currentData, isFinal, currentSummary),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: assessmentSchema,
        },
      });

      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new HttpsError('internal', 'AIからの応答がありません');
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('Vertex AI error:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const classified = classifyVertexError(error);
      throw new HttpsError(classified.code, `AI分析中にエラーが発生しました: ${classified.message}`);
    }
  }
);

// ========================================
// refineCareGoal: ケアゴールを自立支援視点で校正
// ========================================
interface RefineCareGoalRequest {
  currentGoal: string;
}

export const refineCareGoal = onCall<RefineCareGoalRequest>(
  {
    region: LOCATION,
    memory: '512MiB',
    timeoutSeconds: 60,
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }

    const { currentGoal } = request.data;

    if (!currentGoal) {
      throw new HttpsError('invalid-argument', '目標テキストが必要です');
    }

    try {
      const prompt = `
        あなたは日本のベテランケアマネジャーです。
        以下のケアプランの長期目標を、「自立支援」の視点に基づき、より具体的で前向きな日本語の文章に校正してください。
        50文字以内で簡潔にまとめてください。
        入力: "${currentGoal}"
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      return { refinedGoal: responseText || currentGoal, wasRefined: !!responseText };
    } catch (error) {
      console.error('Vertex AI error:', error);

      const classified = classifyVertexError(error);
      if (classified.code === 'unavailable') {
        throw new HttpsError(classified.code, `目標校正中にエラーが発生しました: ${classified.message}`);
      }

      return { refinedGoal: currentGoal, wasRefined: false };
    }
  }
);

// ========================================
// generateCarePlanDraft: ケアプランドラフト生成
// ========================================
interface AssessmentData {
  serviceHistory?: string;
  healthStatus?: string;
  pastHistory?: string;
  skinCondition?: string;
  oralHygiene?: string;
  fluidIntake?: string;
  adlTransfer?: string;
  adlEating?: string;
  adlToileting?: string;
  adlBathing?: string;
  adlDressing?: string;
  iadlCooking?: string;
  iadlShopping?: string;
  iadlMoney?: string;
  medication?: string;
  cognition?: string;
  communication?: string;
  socialParticipation?: string;
  residence?: string;
  familySituation?: string;
  maltreatmentRisk?: string;
  environment?: string;
}

interface GenerateCarePlanDraftRequest {
  assessment: AssessmentData;
  instruction: string;
}

// 拡張版ケアプランスキーマ（複数ニーズ対応）
const carePlanSchemaV2 = {
  type: SchemaType.OBJECT,
  properties: {
    needs: {
      type: SchemaType.ARRAY,
      description: '特定されたニーズとそれに対応する目標・サービス',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          content: {
            type: SchemaType.STRING,
            description: 'ニーズ（生活全般の解決すべき課題）',
          },
          longTermGoal: {
            type: SchemaType.STRING,
            description: '長期目標（6ヶ月〜1年）',
          },
          shortTermGoals: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: '短期目標（3ヶ月程度、2-3個）',
          },
          services: {
            type: SchemaType.ARRAY,
            description: '推奨サービス',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                content: { type: SchemaType.STRING, description: 'サービス内容' },
                type: { type: SchemaType.STRING, description: 'サービス種別' },
                frequency: { type: SchemaType.STRING, description: '頻度' },
              },
              required: ['content', 'type', 'frequency'],
            },
          },
        },
        required: ['content', 'longTermGoal', 'shortTermGoals', 'services'],
      },
    },
    totalDirectionPolicy: {
      type: SchemaType.STRING,
      description: '総合的な援助の方針（第1表用）',
    },
  },
  required: ['needs', 'totalDirectionPolicy'],
};

// 後方互換性のための旧スキーマ
const carePlanSchema = {
  type: SchemaType.OBJECT,
  properties: {
    longTermGoal: {
      type: SchemaType.STRING,
      description: '包括的な長期目標（自立支援の視点）',
    },
    shortTermGoals: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '具体的な短期目標（2-4個）',
    },
  },
  required: ['longTermGoal', 'shortTermGoals'],
};

// 旧バージョン（後方互換性のため維持）
export const generateCarePlanDraft = onCall<GenerateCarePlanDraftRequest>(
  {
    region: LOCATION,
    memory: '1GiB',
    timeoutSeconds: 120,
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }

    const { assessment, instruction } = request.data;

    if (!assessment) {
      throw new HttpsError('invalid-argument', 'アセスメントデータが必要です');
    }

    try {
      const prompt = `
        あなたは2025年時点の日本の介護保険制度に精通した熟練ケアマネジャーです。
        「適切なケアマネジメント手法」に基づき、以下の【アセスメント情報】と【ケアマネジャーの意図】から、
        居宅サービス計画書（第2表）の「長期目標」と「短期目標」のドラフトを作成してください。

        【アセスメント情報 (23項目)】
        ${JSON.stringify(assessment, null, 2)}

        【ケアマネジャーの意図・方針】
        ${instruction || '自立支援・重度化防止を重視'}

        【作成ルール】
        1. **ゴールデンスレッドの厳守**: アセスメントで特定された「解決すべき課題（Needs）」に対応する目標であること。
        2. **自立支援・重度化防止**: 「本人が〜できるようになる」「〜の状態を維持し、悪化を防ぐ」といった前向きな表現を用いること。
        3. **具体性 (SMART)**: 短期目標は、「週◯回〜する」「〜を使って〜ができる」など、評価可能な具体的行動目標にすること。
        4. **日本語品質**: ケアプランとしてそのまま使用できる、専門的かつ利用者にも分かりやすい日本語で記述すること。
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: carePlanSchema,
        },
      });

      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new HttpsError('internal', 'AIからの応答がありません');
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('Vertex AI error:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const classified = classifyVertexError(error);
      throw new HttpsError(classified.code, `ケアプラン生成中にエラーが発生しました: ${classified.message}`);
    }
  }
);

// ========================================
// generateCarePlanV2: 拡張版ケアプラン生成（第2表完全対応）
// ========================================
export const generateCarePlanV2 = onCall<GenerateCarePlanDraftRequest>(
  {
    region: LOCATION,
    memory: '1GiB',
    timeoutSeconds: 180, // より複雑な生成のため延長
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }

    const { assessment, instruction } = request.data;

    if (!assessment) {
      throw new HttpsError('invalid-argument', 'アセスメントデータが必要です');
    }

    try {
      // 文例データベースを参照した改善版プロンプトを使用
      const prompt = buildCarePlanPrompt(assessment, instruction);

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: carePlanSchemaV2,
        },
      });

      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new HttpsError('internal', 'AIからの応答がありません');
      }

      const parsed = JSON.parse(responseText);

      // 後方互換性のため、旧形式のフィールドも追加
      if (parsed.needs && parsed.needs.length > 0) {
        parsed.longTermGoal = parsed.needs[0].longTermGoal;
        parsed.shortTermGoals = parsed.needs[0].shortTermGoals;
      }

      return parsed;
    } catch (error) {
      console.error('Vertex AI error:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const classified = classifyVertexError(error);
      throw new HttpsError(classified.code, `ケアプラン生成中にエラーが発生しました: ${classified.message}`);
    }
  }
);
