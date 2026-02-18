/**
 * アセスメント抽出結果の評価ユーティリティ
 */

import type { AssessmentData } from '../../types';
import type { AssessmentTestCase, ExpectedExtraction } from './testCases';

export interface ExtractionEvaluationResult {
  field: keyof AssessmentData;
  passed: boolean;
  actualValue: string;
  expectedConditions: string[];
  failureReasons: string[];
}

export interface TestCaseEvaluationResult {
  testCaseId: string;
  testCaseName: string;
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  fieldResults: ExtractionEvaluationResult[];
  accuracy: number;  // 0-100%
}

/**
 * 単一フィールドの抽出結果を評価
 */
export function evaluateFieldExtraction(
  actualData: Partial<AssessmentData>,
  expected: ExpectedExtraction
): ExtractionEvaluationResult {
  const actualValue = actualData[expected.field] || '';
  const failureReasons: string[] = [];
  const expectedConditions: string[] = [];

  // shouldContainチェック
  if (expected.shouldContain) {
    expectedConditions.push(`含むべき: [${expected.shouldContain.join(', ')}]`);
    for (const keyword of expected.shouldContain) {
      if (!actualValue.toLowerCase().includes(keyword.toLowerCase())) {
        failureReasons.push(`「${keyword}」が含まれていません`);
      }
    }
  }

  // shouldNotContainチェック
  if (expected.shouldNotContain) {
    expectedConditions.push(`含むべきでない: [${expected.shouldNotContain.join(', ')}]`);
    for (const keyword of expected.shouldNotContain) {
      if (actualValue.includes(keyword)) {
        failureReasons.push(`「${keyword}」が含まれています（含むべきでない）`);
      }
    }
  }

  // shouldNotBeEmptyチェック
  if (expected.shouldNotBeEmpty) {
    expectedConditions.push('空でないこと');
    if (!actualValue || actualValue.trim() === '') {
      failureReasons.push('値が空です');
    }
  }

  return {
    field: expected.field,
    passed: failureReasons.length === 0,
    actualValue,
    expectedConditions,
    failureReasons,
  };
}

/**
 * テストケース全体を評価
 */
export function evaluateTestCase(
  testCase: AssessmentTestCase,
  actualData: Partial<AssessmentData>
): TestCaseEvaluationResult {
  const fieldResults = testCase.expectedExtractions.map(expected =>
    evaluateFieldExtraction(actualData, expected)
  );

  const passedChecks = fieldResults.filter(r => r.passed).length;
  const totalChecks = fieldResults.length;
  const accuracy = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  return {
    testCaseId: testCase.id,
    testCaseName: testCase.name,
    passed: passedChecks === totalChecks,
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    fieldResults,
    accuracy,
  };
}

/**
 * 複数テストケースの評価結果をサマリー
 */
export interface EvaluationSummary {
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  overallAccuracy: number;
  fieldAccuracy: Record<string, { passed: number; total: number; rate: number }>;
  weakFields: string[];  // 精度が低いフィールド
}

export function summarizeEvaluations(
  results: TestCaseEvaluationResult[]
): EvaluationSummary {
  const fieldStats: Record<string, { passed: number; total: number }> = {};

  for (const result of results) {
    for (const fieldResult of result.fieldResults) {
      const field = fieldResult.field;
      if (!fieldStats[field]) {
        fieldStats[field] = { passed: 0, total: 0 };
      }
      fieldStats[field].total++;
      if (fieldResult.passed) {
        fieldStats[field].passed++;
      }
    }
  }

  const fieldAccuracy: Record<string, { passed: number; total: number; rate: number }> = {};
  const weakFields: string[] = [];

  for (const [field, stats] of Object.entries(fieldStats)) {
    const rate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
    fieldAccuracy[field] = { ...stats, rate };
    if (rate < 70) {
      weakFields.push(field);
    }
  }

  const totalChecks = results.reduce((sum, r) => sum + r.totalChecks, 0);
  const passedChecks = results.reduce((sum, r) => sum + r.passedChecks, 0);

  return {
    totalTestCases: results.length,
    passedTestCases: results.filter(r => r.passed).length,
    failedTestCases: results.filter(r => !r.passed).length,
    overallAccuracy: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0,
    fieldAccuracy,
    weakFields,
  };
}

/**
 * 評価結果をフォーマットして表示用文字列に変換
 */
export function formatEvaluationResult(result: TestCaseEvaluationResult): string {
  const lines: string[] = [];

  lines.push(`\n=== ${result.testCaseId}: ${result.testCaseName} ===`);
  lines.push(`結果: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
  lines.push(`精度: ${result.accuracy}% (${result.passedChecks}/${result.totalChecks})`);

  if (result.failedChecks > 0) {
    lines.push('\n失敗した項目:');
    for (const fieldResult of result.fieldResults) {
      if (!fieldResult.passed) {
        lines.push(`  - ${fieldResult.field}:`);
        lines.push(`    実際の値: "${fieldResult.actualValue.substring(0, 100)}..."`);
        for (const reason of fieldResult.failureReasons) {
          lines.push(`    ⚠️ ${reason}`);
        }
      }
    }
  }

  return lines.join('\n');
}

/**
 * サマリーをフォーマット
 */
export function formatSummary(summary: EvaluationSummary): string {
  const lines: string[] = [];

  lines.push('\n========================================');
  lines.push('       評価サマリー');
  lines.push('========================================');
  lines.push(`テストケース: ${summary.passedTestCases}/${summary.totalTestCases} 合格`);
  lines.push(`全体精度: ${summary.overallAccuracy}%`);

  lines.push('\n--- フィールド別精度 ---');
  const sortedFields = Object.entries(summary.fieldAccuracy)
    .sort((a, b) => a[1].rate - b[1].rate);

  for (const [field, stats] of sortedFields) {
    const icon = stats.rate >= 90 ? '✅' : stats.rate >= 70 ? '⚠️' : '❌';
    lines.push(`${icon} ${field}: ${stats.rate}% (${stats.passed}/${stats.total})`);
  }

  if (summary.weakFields.length > 0) {
    lines.push('\n⚠️ 改善が必要なフィールド:');
    for (const field of summary.weakFields) {
      lines.push(`  - ${field}`);
    }
  }

  return lines.join('\n');
}
