/**
 * geminiService.ts
 * Cloud Functions経由でVertex AI Geminiを呼び出すサービス
 *
 * 移行前: Google AI Studio (クライアント直接アクセス)
 * 移行後: Cloud Functions for Firebase → Vertex AI (asia-northeast1)
 */

import { AssessmentData } from '../types';
import { analyzeAssessment as callAnalyzeAssessment } from './firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp, getApps } from 'firebase/app';

// Firebase設定（firebase.tsと共有）
const firebaseConfig = {
  apiKey: 'AIzaSyCIYASXY_ALRX-VSwR4oZVjN4Ntit7lPi4',
  authDomain: 'caremanager-ai-copilot.firebaseapp.com',
  projectId: 'caremanager-ai-copilot',
  storageBucket: 'caremanager-ai-copilot.firebasestorage.app',
  messagingSenderId: '624222634250',
  appId: '1:624222634250:web:2b2d8d89fc466864417af3',
};

// Firebase初期化（まだ初期化されていない場合のみ）
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const functions = getFunctions(app, 'asia-northeast1');

// Cloud Functions の呼び出し設定
const refineCareGoalFn = httpsCallable<{ currentGoal: string }, { refinedGoal: string }>(
  functions,
  'refineCareGoal'
);

const generateCarePlanDraftFn = httpsCallable<
  { assessment: AssessmentData; instruction: string },
  { longTermGoal: string; shortTermGoals: string[] }
>(functions, 'generateCarePlanDraft');

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
export const refineCareGoal = async (currentGoal: string): Promise<string> => {
  try {
    const result = await refineCareGoalFn({ currentGoal });
    return result.data.refinedGoal;
  } catch (error) {
    console.error('AI Goal Refinement Error:', error);
    return currentGoal; // フォールバック
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
 * アセスメント情報からケアプランのドラフトを生成する
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
