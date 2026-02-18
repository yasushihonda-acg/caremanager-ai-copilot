/**
 * テスト用 Vertex AI 直接呼び出しクライアント
 *
 * Cloud Function を経由せず、ADC (Application Default Credentials) を使って
 * Vertex AI (Gemini 2.5 Flash) を直接呼び出す。
 *
 * インターフェースは変えず extraction.live.test.ts / runEvaluation.ts からそのまま利用可能。
 *
 * 前提: gcloud auth application-default login が完了していること
 */

import { execSync } from 'child_process';
import type { AssessmentData } from '../../types';

// ============================================================
// 定数
// ============================================================

const PROJECT_ID = 'caremanager-ai-copilot-486212';
const REGION = 'asia-northeast1';
const MODEL_ID = 'gemini-2.5-flash';
const VERTEX_AI_ENDPOINT = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${MODEL_ID}:generateContent`;

// ============================================================
// ADCトークン取得
// ============================================================

/**
 * ADC アクセストークンを取得する。
 * extraction.live.test.ts との互換性のため getTestIdToken の名前を維持。
 */
export async function getTestIdToken(): Promise<string> {
  const token = execSync('gcloud auth application-default print-access-token', {
    encoding: 'utf-8',
  }).trim();
  if (!token) {
    throw new Error(
      'ADCトークン取得に失敗しました。\n' +
      'gcloud auth application-default login --project caremanager-ai-copilot-486212 を実行してください。'
    );
  }
  return token;
}

// ============================================================
// プロンプト構築
// ============================================================

function buildTextPrompt(
  textInput: string,
  currentData: Record<string, string>,
  isFinal: boolean,
  currentSummary: string
): string {
  const hasCurrentData = Object.keys(currentData).some(k => currentData[k]);

  return `あなたは介護支援専門員（ケアマネージャー）のアセスメント記録を支援するAIです。
以下の会話テキストを解析し、23項目アセスメントの各項目に該当する情報を抽出してください。

${hasCurrentData ? `【現在のアセスメントデータ】\n${JSON.stringify(currentData, null, 2)}\n` : ''}
${currentSummary ? `【現在の要約】\n${currentSummary}\n` : ''}
【会話テキスト】
${textInput}

【抽出対象の23項目】
- serviceHistory: 現在の利用サービス・支援経過
- healthStatus: 健康状態・主疾患（現在の診断名・症状・バイタル・現在治療中の疾患）。過去に治癒した疾患はpastHistoryへ
- pastHistory: 既往歴（過去に治癒・中断した疾患、手術歴、入院歴）。現在治療中の疾患はhealthStatusへ
- skinCondition: 皮膚の状態（褥瘡・発赤・乾燥等）
- oralHygiene: 口腔・嚥下（入れ歯・歯の状態・口腔乾燥・むせ・嚥下機能・舌の状態）
- fluidIntake: 水分・栄養摂取（水分量・とろみ・胃ろう・経管栄養等の摂取方法）。食事動作はadlEatingへ
- adlTransfer: 移動・移乗（歩行・車椅子・杖・寝返り等）
- adlEating: 食事のADL（食事動作の自立度・食形態・食具・食事介助）。嚥下機能はoralHygieneへ、栄養摂取方法はfluidIntakeへ
- adlToileting: 排泄のADL（自立度・失禁・頻度等）
- adlBathing: 入浴のADL（自立度・介助方法・福祉用具等）
- adlDressing: 更衣のADL（自立度・介助方法等）
- iadlCooking: 調理のIADL（料理の可否・内容・危険性等）
- iadlShopping: 買い物のIADL（可否・方法・頻度等）
- iadlMoney: 金銭管理のIADL（可否・管理者等）
- medication: 薬剤管理（薬品名・服薬状況・管理者等）
- cognition: 認知機能（見当識・記憶・判断力等）
- communication: コミュニケーション（会話・意思疎通・手段等）
- socialParticipation: 社会参加・余暇（外出・趣味・閉じこもり等）
- residence: 住環境・住宅構造（住宅種別・バリアフリー・改修状況等）。虐待文脈の環境問題はmaltreatmentRiskへ
- familySituation: 家族・介護者の状況（同居・主介護者・負担等）
- maltreatmentRisk: 虐待リスク（経済的虐待・介護放棄・身体的虐待の兆候。虐待文脈での環境問題も含む）
- environment: 生活環境・安全（住居の衛生状態・整理状況・危険箇所）。虐待文脈はmaltreatmentRiskへ、住宅構造はresidenceへ
- summary: 全体的な要約と支援の方向性

【分類ガイドライン】
- healthStatus vs pastHistory: 現在治療中・通院中→healthStatus、過去に治癒/中断した疾患→pastHistory
- adlEating vs fluidIntake: 食事動作の自立度・食形態→adlEating、栄養摂取方法（胃ろう等）→fluidIntake
- adlEating vs oralHygiene: 食事動作→adlEating、嚥下機能（むせ等）→oralHygiene
- maltreatmentRisk vs environment: 虐待文脈での環境→maltreatmentRisk、虐待と無関係な環境→environment

【指示】
1. 会話内容を解析し、各項目に該当する情報を日本語で具体的に記述してください
2. 情報が含まれていない項目は空文字列にしてください
3. 既存データがある場合は追記してください（上書きではなく）
${isFinal ? '4. 【最終分析】これが最後のテキストです。総合的なまとめを summary に記載してください。' : ''}`;
}

// ============================================================
// Vertex AI 直接呼び出し
// ============================================================

interface CallOptions {
  currentData?: Record<string, string>;
  isFinal?: boolean;
  currentSummary?: string;
}

/**
 * テキストをアセスメント23項目に抽出する（Vertex AI 直接呼び出し）。
 * extraction.live.test.ts との互換性のため callAnalyzeAssessmentWithText の名前を維持。
 */
export async function callAnalyzeAssessmentWithText(
  textInput: string,
  adcToken: string,
  options: CallOptions = {}
): Promise<Partial<AssessmentData>> {
  const {
    currentData = {},
    isFinal = true,
    currentSummary = '',
  } = options;

  const res = await fetch(VERTEX_AI_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adcToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: buildTextPrompt(textInput, currentData, isFinal, currentSummary) }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vertex AI API エラー ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error('Vertex AI からの応答が空です');
  }

  return JSON.parse(responseText) as Partial<AssessmentData>;
}
