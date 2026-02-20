import { VertexAI, SchemaType, type Content } from '@google-cloud/vertexai';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { buildCarePlanPrompt } from './prompts/careplanPrompt';

const PROJECT_ID = 'caremanager-ai-copilot-486212';
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
    serviceHistory: { type: SchemaType.STRING, description: '現在利用中のサービス・支援経過' },
    healthStatus: {
      type: SchemaType.STRING,
      description: '健康状態・主疾患（現在の診断名・症状・バイタル・現在治療中の疾患）。過去に治癒した疾患はpastHistoryへ',
    },
    pastHistory: {
      type: SchemaType.STRING,
      description: '既往歴（過去に治癒・中断した疾患、手術歴、入院歴）。現在治療中の疾患はhealthStatusへ',
    },
    skinCondition: { type: SchemaType.STRING, description: '皮膚の状態（褥瘡・発赤・乾燥・スキンケア等）' },
    oralHygiene: {
      type: SchemaType.STRING,
      description: '口腔・嚥下（入れ歯・歯の状態・口腔乾燥・むせ・嚥下機能・舌の状態）',
    },
    fluidIntake: {
      type: SchemaType.STRING,
      description: '水分・栄養摂取（水分量・とろみ・胃ろう・経管栄養等の摂取方法）。食事動作はadlEatingへ',
    },
    adlTransfer: { type: SchemaType.STRING, description: '移動・移乗（歩行・車椅子・杖・寝返り・起き上がり等）' },
    adlEating: {
      type: SchemaType.STRING,
      description: '食事のADL（食事動作の自立度・食形態・食具・食事介助）。嚥下機能はoralHygieneへ、栄養摂取方法はfluidIntakeへ',
    },
    adlToileting: { type: SchemaType.STRING, description: '排泄のADL（自立度・失禁・頻度・用具等）' },
    adlBathing: { type: SchemaType.STRING, description: '入浴のADL（自立度・介助方法・福祉用具等）' },
    adlDressing: { type: SchemaType.STRING, description: '更衣のADL（自立度・介助方法等）' },
    iadlCooking: { type: SchemaType.STRING, description: '調理のIADL（料理の可否・内容・危険性等）' },
    iadlShopping: { type: SchemaType.STRING, description: '買い物のIADL（可否・方法・頻度等）' },
    iadlMoney: { type: SchemaType.STRING, description: '金銭管理のIADL（可否・管理者等）' },
    medication: { type: SchemaType.STRING, description: '薬剤管理（薬品名・服薬状況・管理者等）' },
    cognition: { type: SchemaType.STRING, description: '認知機能（見当識・記憶・判断力等）' },
    communication: { type: SchemaType.STRING, description: 'コミュニケーション（会話・意思疎通・手段等）' },
    socialParticipation: { type: SchemaType.STRING, description: '社会参加・余暇（外出・趣味・閉じこもり等）' },
    residence: { type: SchemaType.STRING, description: '住環境・住宅構造（住宅種別・バリアフリー・改修状況等）。虐待文脈の環境問題はmaltreatmentRiskへ' },
    familySituation: { type: SchemaType.STRING, description: '家族・介護者の状況（同居・主介護者・負担等）' },
    maltreatmentRisk: {
      type: SchemaType.STRING,
      description: '虐待リスク（経済的虐待・介護放棄・身体的虐待の兆候。虐待文脈での環境問題も含む）',
    },
    environment: {
      type: SchemaType.STRING,
      description: '生活環境・安全（住居の衛生状態・整理状況・危険箇所）。虐待文脈はmaltreatmentRiskへ、住宅構造はresidenceへ',
    },
    summary: { type: SchemaType.STRING, description: '全体的な要約と支援の方向性' },
    missingInfoAdvice: {
      type: SchemaType.ARRAY,
      description: '現在のアセスメントで不足・未確認の情報のアドバイス（最大3件。情報が十分な場合は空配列）',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          field: { type: SchemaType.STRING, description: 'アセスメント項目のフィールド名（例: medication, cognition, familySituation）' },
          advice: { type: SchemaType.STRING, description: '確認すべき内容の具体的なアドバイス文' },
        },
        required: ['field', 'advice'],
      },
    },
  },
  required: ['summary'],
};

interface AnalyzeAssessmentRequest {
  audioBase64?: string;
  textInput?: string;
  currentData: Record<string, string>;
  isFinal: boolean;
  currentSummary: string;
}

function buildPrompt(
  currentData: Record<string, string>,
  isFinal: boolean,
  currentSummary: string,
  mode: 'audio' | 'text' = 'audio'
): string {
  const sourceDescription = mode === 'audio'
    ? '音声から会話内容を解析し'
    : '以下のテキストの会話内容を解析し';

  const instructionPrefix = mode === 'audio'
    ? '音声の内容を解析し、'
    : 'テキストの内容を解析し、';

  const emptyFieldNote = mode === 'audio'
    ? '情報が聞き取れなかった項目は空文字列のままにしてください'
    : '情報が読み取れなかった項目は空文字列のままにしてください';

  const basePrompt = `あなたは介護支援専門員（ケアマネージャー）のアセスメント記録を支援するAIです。
${sourceDescription}、23項目アセスメントの各項目に該当する情報を抽出してください。

【現在のアセスメントデータ】
${JSON.stringify(currentData, null, 2)}

【現在の要約】
${currentSummary || 'なし'}

【分類ガイドライン】
- healthStatus vs pastHistory: 現在治療中・通院中→healthStatus、過去に治癒/中断した疾患→pastHistory
- adlEating vs fluidIntake: 食事動作の自立度・食形態→adlEating、栄養摂取方法（胃ろう等）→fluidIntake
- adlEating vs oralHygiene: 食事動作→adlEating、嚥下機能（むせ等）→oralHygiene
- maltreatmentRisk vs environment: 虐待文脈での環境→maltreatmentRisk、虐待と無関係な環境→environment

【指示】
1. ${instructionPrefix}アセスメント23項目に該当する情報を抽出してください
2. 新しい情報は既存データに追記してください（上書きではなく）
3. summaryフィールドには会話の要点を簡潔にまとめてください
4. ${emptyFieldNote}
5. 現在のアセスメントデータを分析し、不足・未確認の重要情報があればmissingInfoAdviceに最大3件のアドバイスを返してください
   - 23項目で未入力または情報が不十分な重要項目を優先
   - 既往歴から連動確認すべき項目（例: 脳梗塞→嚥下oralHygiene・麻痺adlTransfer、糖尿病→足の状態skinCondition）
   - 独居・認知症・医療ニーズ高等のリスク因子から確認すべき追加事項
   - 情報が十分な場合はmissingInfoAdviceを空配列にしてください

${isFinal ? '【最終分析】これが最後の入力です。総合的なまとめを作成してください。' : ''}`;

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
    logger.info('analyzeAssessment: start', { uid: request.auth?.uid });

    // 認証チェック
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }

    const { audioBase64, textInput, currentData, isFinal, currentSummary } = request.data;

    if (!audioBase64 && !textInput) {
      throw new HttpsError('invalid-argument', '音声データまたはテキストデータが必要です');
    }

    try {
      const isTextMode = !!textInput;
      const prompt = buildPrompt(currentData, isFinal, currentSummary, isTextMode ? 'text' : 'audio');

      let contents: Content[];
      if (isTextMode) {
        contents = [
          {
            role: 'user',
            parts: [{ text: textInput + '\n\n' + prompt }],
          },
        ];
      } else {
        contents = [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: audioBase64!,
                },
              },
              { text: prompt },
            ],
          },
        ];
      }

      const result = await model.generateContent({
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: assessmentSchema,
        },
      });

      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new HttpsError('internal', 'AIからの応答がありません');
      }

      logger.info('analyzeAssessment: completed');
      return JSON.parse(responseText);
    } catch (error) {
      logger.error('Vertex AI error:', error);

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
    logger.info('refineCareGoal: start', { uid: request.auth?.uid });

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

      logger.info('refineCareGoal: completed');
      return { refinedGoal: responseText || currentGoal, wasRefined: !!responseText };
    } catch (error) {
      logger.error('Vertex AI error:', error);

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
    logger.info('generateCarePlanDraft: start', { uid: request.auth?.uid });

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

      logger.info('generateCarePlanDraft: completed');
      return JSON.parse(responseText);
    } catch (error) {
      logger.error('Vertex AI error:', error);

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
    logger.info('generateCarePlanV2: start', { uid: request.auth?.uid });

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

      logger.info('generateCarePlanV2: completed');
      return parsed;
    } catch (error) {
      logger.error('Vertex AI error:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const classified = classifyVertexError(error);
      throw new HttpsError(classified.code, `ケアプラン生成中にエラーが発生しました: ${classified.message}`);
    }
  }
);
