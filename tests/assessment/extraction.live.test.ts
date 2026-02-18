/**
 * アセスメント抽出精度ライブテスト
 *
 * 実際の Cloud Function (Gemini 2.5 Flash) を呼び出してAI抽出精度を測定する。
 *
 * 実行方法:
 *   npm run test:live
 *
 * 前提条件:
 *   - ADC認証が有効 (gcloud auth application-default login)
 *   - Cloud Functions がデプロイ済み (textInput 対応版)
 *
 * 環境変数:
 *   SKIP_LIVE_TESTS=1  → テストをスキップ
 *   FUNCTIONS_URL       → Cloud Functions のベースURL（オプション）
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { allTestCases } from './testCases';
import { evaluateTestCase, summarizeEvaluations, formatEvaluationResult, formatSummary } from './evaluator';
import { getTestIdToken, callAnalyzeAssessmentWithText } from './cloudFunctionClient';
import type { TestCaseEvaluationResult } from './evaluator';

// ============================================================
// 環境変数によるスキップ制御
// ============================================================

const SKIP_LIVE_TESTS = !!process.env.SKIP_LIVE_TESTS;
const ACCURACY_THRESHOLD = 70; // ベースライン閾値（%）

// ============================================================
// テストスイート
// ============================================================

describe.skipIf(SKIP_LIVE_TESTS)('AI抽出精度ライブテスト', () => {
  let idToken: string;
  const results: TestCaseEvaluationResult[] = [];

  beforeAll(async () => {
    try {
      idToken = await getTestIdToken();
    } catch (error) {
      console.error(
        '\n❌ IDトークン取得に失敗しました。\n' +
        'ADC認証が有効か確認してください:\n' +
        '  gcloud auth application-default login\n',
        error
      );
      throw error;
    }
  }, 30_000);

  // 各テストケースを順次実行
  for (const testCase of allTestCases) {
    it(
      `${testCase.id}: ${testCase.name} (閾値${ACCURACY_THRESHOLD}%)`,
      async () => {
        const extracted = await callAnalyzeAssessmentWithText(
          testCase.inputText,
          idToken,
          {
            currentData: {},
            isFinal: true,
            currentSummary: '',
          }
        );

        const result = evaluateTestCase(testCase, extracted);
        results.push(result);

        // 結果を即時表示
        console.log(formatEvaluationResult(result));

        expect(
          result.accuracy,
          `${testCase.id}の精度が閾値(${ACCURACY_THRESHOLD}%)未満: ${result.accuracy}%`
        ).toBeGreaterThanOrEqual(ACCURACY_THRESHOLD);
      },
      180_000 // 各テストケース最大3分
    );
  }

  // 全テスト完了後にサマリー表示
  it('全体サマリー', () => {
    if (results.length === 0) {
      console.log('⚠️ 評価結果がありません（前のテストがスキップまたは失敗）');
      return;
    }

    const summary = summarizeEvaluations(results);
    console.log(formatSummary(summary));

    // 全体精度も閾値以上であること
    expect(
      summary.overallAccuracy,
      `全体精度が閾値(${ACCURACY_THRESHOLD}%)未満: ${summary.overallAccuracy}%`
    ).toBeGreaterThanOrEqual(ACCURACY_THRESHOLD);
  });
});
