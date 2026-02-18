/**
 * geminiService.ts
 * Cloud Functions経由でVertex AI Geminiを呼び出すサービス
 *
 * 移行前: Google AI Studio (クライアント直接アクセス)
 * 移行後: Cloud Functions for Firebase → Vertex AI (asia-northeast1)
 */

import { AssessmentData } from '../types';
import { analyzeAssessment as callAnalyzeAssessment, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

// Cloud Functions の呼び出し設定
const refineCareGoalFn = httpsCallable<{ currentGoal: string }, { refinedGoal: string; wasRefined: boolean }>(
  functions,
  'refineCareGoal'
);

const generateCarePlanDraftFn = httpsCallable<
  { assessment: AssessmentData; instruction: string },
  { longTermGoal: string; shortTermGoals: string[] }
>(functions, 'generateCarePlanDraft');

// V2版：第2表完全対応（AIレスポンス用。id なし・shortTermGoals は string[]）
interface CarePlanV2NeedResponse {
  content: string;
  longTermGoal: string;
  shortTermGoals: string[];
  services: {
    content: string;
    type: string;
    frequency: string;
  }[];
}

interface CarePlanV2Response {
  needs: CarePlanV2NeedResponse[];
  totalDirectionPolicy: string;
  // 後方互換性
  longTermGoal: string;
  shortTermGoals: string[];
}

const generateCarePlanV2Fn = httpsCallable<
  { assessment: AssessmentData; instruction: string },
  CarePlanV2Response
>(functions, 'generateCarePlanV2');

/**
 * BlobをBase64に変換するユーティリティ
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * refineCareGoal
 * 長期目標を「自立支援」視点で校正する
 */
export const refineCareGoal = async (currentGoal: string): Promise<{ refinedGoal: string; wasRefined: boolean }> => {
  try {
    const result = await refineCareGoalFn({ currentGoal });
    return result.data;
  } catch (error) {
    console.error('AI Goal Refinement Error:', error);
    throw error;
  }
};

/**
 * analyzeAssessmentConversation
 * 音声を解析してアセスメント情報を抽出する
 *
 * @param audioBlob - 音声データ（WebM形式）
 * @param currentData - 現在のアセスメントデータ
 * @param isFinal - 最終分析かどうか（trueの場合は要約を生成）
 * @param currentSummary - 既存の要約（追記モード用）
 */
export const analyzeAssessmentConversation = async (
  audioBlob: Blob,
  currentData: AssessmentData,
  isFinal: boolean = false,
  currentSummary: string = ''
): Promise<{
  structuredData?: Partial<AssessmentData>;
  summary?: string;
  missingInfoAdvice?: string[];
}> => {
  try {
    const audioBase64 = await blobToBase64(audioBlob);

    const result = await callAnalyzeAssessment({
      audioBase64,
      currentData: currentData as unknown as Record<string, string>,
      isFinal,
      currentSummary,
    });

    // Cloud Functions からの応答を整形
    const data = result.data;
    return {
      structuredData: {
        serviceHistory: data.serviceHistory,
        healthStatus: data.healthStatus,
        pastHistory: data.pastHistory,
        skinCondition: data.skinCondition,
        oralHygiene: data.oralHygiene,
        fluidIntake: data.fluidIntake,
        adlTransfer: data.adlTransfer,
        adlEating: data.adlEating,
        adlToileting: data.adlToileting,
        adlBathing: data.adlBathing,
        adlDressing: data.adlDressing,
        iadlCooking: data.iadlCooking,
        iadlShopping: data.iadlShopping,
        iadlMoney: data.iadlMoney,
        medication: data.medication,
        cognition: data.cognition,
        communication: data.communication,
        socialParticipation: data.socialParticipation,
        residence: data.residence,
        familySituation: data.familySituation,
        maltreatmentRisk: data.maltreatmentRisk,
        environment: data.environment,
      },
      summary: data.summary,
      missingInfoAdvice: [], // Cloud Functions側で実装予定
    };
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    throw error;
  }
};

/**
 * generateCarePlanDraft
 * アセスメント情報からケアプランのドラフトを生成する（旧バージョン）
 */
export const generateCarePlanDraft = async (
  assessment: AssessmentData,
  instruction: string
): Promise<{ longTermGoal: string; shortTermGoals: string[] }> => {
  try {
    const result = await generateCarePlanDraftFn({ assessment, instruction });
    return result.data;
  } catch (error) {
    console.error('Plan Draft Generation Error:', error);
    throw error;
  }
};

/**
 * generateCarePlanV2
 * アセスメント情報から第2表完全対応のケアプランを生成する
 *
 * - 複数のニーズに対応
 * - 各ニーズに長期目標・短期目標・サービス内容を含む
 * - 総合的な援助の方針（第1表用）も生成
 * - 文例データベースを参照した高品質な生成
 */
export const generateCarePlanV2 = async (
  assessment: AssessmentData,
  instruction: string
): Promise<CarePlanV2Response> => {
  try {
    const result = await generateCarePlanV2Fn({ assessment, instruction });
    return result.data;
  } catch (error) {
    console.error('Plan V2 Generation Error:', error);
    throw error;
  }
};

// 型のエクスポート
export type { CarePlanV2NeedResponse, CarePlanV2Response };
