/**
 * アセスメント抽出精度テスト
 *
 * このテストはGemini AIの抽出精度を評価するためのものです。
 * 実際のAI呼び出しはモック化し、抽出ロジックの評価に焦点を当てます。
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { AssessmentData } from '../../types';
import {
  allTestCases,
  testCase001_DementiaInitial,
  testCase002_StrokeRehab,
  testCase003_LivingAlone,
  getTestCasesByTag,
} from './testCases';
import {
  evaluateFieldExtraction,
  evaluateTestCase,
  summarizeEvaluations,
  formatSummary,
} from './evaluator';

describe('テストケース構造の検証', () => {
  it('全テストケースが必須フィールドを持つ', () => {
    for (const testCase of allTestCases) {
      expect(testCase.id).toBeTruthy();
      expect(testCase.name).toBeTruthy();
      expect(testCase.inputText).toBeTruthy();
      expect(testCase.expectedExtractions.length).toBeGreaterThan(0);
      expect(testCase.tags.length).toBeGreaterThan(0);
    }
  });

  it('テストケースIDが一意である', () => {
    const ids = allTestCases.map(tc => tc.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('タグでフィルタリングできる', () => {
    const dementiaTests = getTestCasesByTag('認知症');
    expect(dementiaTests.length).toBeGreaterThan(0);
    expect(dementiaTests.every(tc => tc.tags.includes('認知症'))).toBe(true);
  });
});

describe('評価ロジックの検証', () => {
  it('shouldContain: キーワードを含む場合にパス', () => {
    const result = evaluateFieldExtraction(
      { healthStatus: 'アルツハイマー型認知症と診断' },
      { field: 'healthStatus', shouldContain: ['アルツハイマー', '認知症'] }
    );
    expect(result.passed).toBe(true);
    expect(result.failureReasons).toHaveLength(0);
  });

  it('shouldContain: キーワードがない場合に失敗', () => {
    const result = evaluateFieldExtraction(
      { healthStatus: '高血圧があります' },
      { field: 'healthStatus', shouldContain: ['認知症'] }
    );
    expect(result.passed).toBe(false);
    expect(result.failureReasons.length).toBeGreaterThan(0);
  });

  it('shouldNotBeEmpty: 空の場合に失敗', () => {
    const result = evaluateFieldExtraction(
      { healthStatus: '' },
      { field: 'healthStatus', shouldNotBeEmpty: true }
    );
    expect(result.passed).toBe(false);
  });

  it('shouldNotBeEmpty: 値がある場合にパス', () => {
    const result = evaluateFieldExtraction(
      { healthStatus: '何かの情報' },
      { field: 'healthStatus', shouldNotBeEmpty: true }
    );
    expect(result.passed).toBe(true);
  });
});

describe('テストケース評価', () => {
  it('完璧な抽出結果で全項目パス', () => {
    // TC001の期待値を完全に満たすモックデータ
    const perfectExtraction: Partial<AssessmentData> = {
      healthStatus: 'アルツハイマー型認知症と診断されています',
      pastHistory: '高血圧の既往があります',
      medication: 'アリセプトを服用中',
      cognition: '日時の見当識が曖昧で物忘れがあります',
      adlEating: '自分で食べられます',
      adlToileting: '夜間は失禁することがあります',
      adlBathing: '介助が必要です',
      iadlShopping: '買い物はできなくなりました',
      iadlCooking: '火の消し忘れがあります',
      iadlMoney: 'お金の計算ができません',
      familySituation: '長男夫婦と同居、お嫁さんが主介護者',
      residence: '持ち家の2階建てで1階で生活',
    };

    const result = evaluateTestCase(testCase001_DementiaInitial, perfectExtraction);
    expect(result.accuracy).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('一部の抽出が欠けている場合に部分的に失敗', () => {
    const partialExtraction: Partial<AssessmentData> = {
      healthStatus: 'アルツハイマー型認知症と診断されています',
      pastHistory: '高血圧の既往',
      // medication は欠落
      cognition: '見当識障害、物忘れあり',
      adlEating: '自分で食べられる',
      // 他のフィールドも欠落
    };

    const result = evaluateTestCase(testCase001_DementiaInitial, partialExtraction);
    expect(result.passed).toBe(false);
    expect(result.passedChecks).toBeGreaterThan(0);
    expect(result.failedChecks).toBeGreaterThan(0);
  });
});

describe('サマリー生成', () => {
  it('複数テストケースのサマリーを生成できる', () => {
    const mockResults = [
      {
        testCaseId: 'TC001',
        testCaseName: 'テスト1',
        passed: true,
        totalChecks: 10,
        passedChecks: 10,
        failedChecks: 0,
        fieldResults: [],
        accuracy: 100,
      },
      {
        testCaseId: 'TC002',
        testCaseName: 'テスト2',
        passed: false,
        totalChecks: 10,
        passedChecks: 7,
        failedChecks: 3,
        fieldResults: [],
        accuracy: 70,
      },
    ];

    const summary = summarizeEvaluations(mockResults);
    expect(summary.totalTestCases).toBe(2);
    expect(summary.passedTestCases).toBe(1);
    expect(summary.failedTestCases).toBe(1);
  });
});

/**
 * 実際のAI抽出をテストする場合のスケルトン
 * （CI/CDでは実行しない。ローカルで手動実行用）
 */
describe.skip('実際のAI抽出テスト（手動実行用）', () => {
  it('TC001: 認知症ケースの抽出精度', async () => {
    // 実際のCloud Functions呼び出しが必要
    // const result = await callAnalyzeAssessment(testCase001_DementiaInitial.inputText);
    // const evaluation = evaluateTestCase(testCase001_DementiaInitial, result);
    // expect(evaluation.accuracy).toBeGreaterThanOrEqual(70);
  });
});
