/**
 * geminiService FEサービス層ユニットテスト
 *
 * Cloud Functions (Vertex AI) の呼び出しをモックし、
 * FEのサービス関数が正しいリクエストを送り、レスポンスを正しく処理することを検証する。
 *
 * テスト対象:
 * - refineCareGoal
 * - generateCarePlanDraft
 * - generateCarePlanV2
 *
 * 検証内容:
 * - 正常系: 期待するフィールドがレスポンスに存在する
 * - 引数の転送: Cloud Functionに正しいリクエストが渡される
 * - 異常系: エラーが呼び出し元にスローされる
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================
// モック定義
// vi.hoisted() でファクトリ関数より前に初期化可能にする
// =============================================================
const mocks = vi.hoisted(() => ({
  refineCareGoalCall: vi.fn(),
  generateCarePlanDraftCall: vi.fn(),
  generateCarePlanV2Call: vi.fn(),
  analyzeAssessmentCall: vi.fn(),
}));

// services/firebase を完全モック（firebase/app, auth, firestore の直接モックが不要になる）
vi.mock('../../services/firebase', () => ({
  functions: {},
  analyzeAssessment: mocks.analyzeAssessmentCall,
  isEmulator: false,
  auth: {},
  db: {},
  FirestoreError: class FirestoreError extends Error {},
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  signInAsTestUser: vi.fn(),
}));

// firebase/functions: httpsCallable のみモック（geminiService.ts が直接使用）
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    const fnMap: Record<string, ReturnType<typeof vi.fn>> = {
      refineCareGoal: mocks.refineCareGoalCall,
      generateCarePlanDraft: mocks.generateCarePlanDraftCall,
      generateCarePlanV2: mocks.generateCarePlanV2Call,
      analyzeAssessment: mocks.analyzeAssessmentCall,
    };
    return fnMap[name] ?? vi.fn();
  }),
}));

// =============================================================
// テスト対象インポート（モック設定後に行う）
// =============================================================
import { refineCareGoal, generateCarePlanDraft, generateCarePlanV2 } from '../../services/geminiService';
import type { CarePlanV2Response } from '../../services/geminiService';
import type { AssessmentData } from '../../types';

// テスト用アセスメントデータ（最小構成）
const sampleAssessment: Pick<AssessmentData, 'healthStatus' | 'summary'> = {
  healthStatus: '高血圧（内服中）、2型糖尿病',
  summary: '在宅生活継続に向けた生活支援と医療管理が必要',
};

// =============================================================
// テスト
// =============================================================
describe('geminiService - FEサービス層ユニットテスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------
  // refineCareGoal
  // -------------------------------------------------------
  describe('refineCareGoal', () => {
    it('正常系: wasRefined=trueの場合、校正済み目標を返す', async () => {
      const expected = {
        refinedGoal: '在宅での自立した生活を維持する',
        wasRefined: true,
      };
      mocks.refineCareGoalCall.mockResolvedValueOnce({ data: expected });

      const result = await refineCareGoal('自宅で生活したい');

      expect(result.refinedGoal).toBe(expected.refinedGoal);
      expect(result.wasRefined).toBe(true);
    });

    it('正常系: wasRefined=falseの場合、入力値をそのまま返す', async () => {
      const input = '自宅で過ごしたい';
      mocks.refineCareGoalCall.mockResolvedValueOnce({
        data: { refinedGoal: input, wasRefined: false },
      });

      const result = await refineCareGoal(input);

      expect(result.refinedGoal).toBe(input);
      expect(result.wasRefined).toBe(false);
    });

    it('引数: currentGoalが正しくCloud Functionに渡される', async () => {
      mocks.refineCareGoalCall.mockResolvedValueOnce({
        data: { refinedGoal: 'refined', wasRefined: true },
      });
      const goal = '自宅でできる限り自立して生活したい';

      await refineCareGoal(goal);

      expect(mocks.refineCareGoalCall).toHaveBeenCalledWith({ currentGoal: goal });
      expect(mocks.refineCareGoalCall).toHaveBeenCalledTimes(1);
    });

    it('異常系: Cloud Functionがエラーを返した場合は例外をスロー', async () => {
      mocks.refineCareGoalCall.mockRejectedValueOnce(new Error('functions/unavailable'));

      await expect(refineCareGoal('目標テキスト')).rejects.toThrow('functions/unavailable');
    });
  });

  // -------------------------------------------------------
  // generateCarePlanDraft
  // -------------------------------------------------------
  describe('generateCarePlanDraft', () => {
    it('正常系: longTermGoalとshortTermGoalsを返す', async () => {
      const expected = {
        longTermGoal: '在宅での自立した生活を継続する',
        shortTermGoals: ['週3回デイサービスを利用する', '毎日服薬管理を行う'],
      };
      mocks.generateCarePlanDraftCall.mockResolvedValueOnce({ data: expected });

      const result = await generateCarePlanDraft(
        sampleAssessment as AssessmentData,
        '自立支援を重視して'
      );

      expect(result.longTermGoal).toBe(expected.longTermGoal);
      expect(result.shortTermGoals).toHaveLength(2);
      expect(result.shortTermGoals).toEqual(expected.shortTermGoals);
    });

    it('引数: assessmentとinstructionが正しく渡される', async () => {
      mocks.generateCarePlanDraftCall.mockResolvedValueOnce({
        data: { longTermGoal: '目標', shortTermGoals: [] },
      });
      const instruction = '自立支援を重視して作成する';

      await generateCarePlanDraft(sampleAssessment as AssessmentData, instruction);

      expect(mocks.generateCarePlanDraftCall).toHaveBeenCalledWith({
        assessment: sampleAssessment,
        instruction,
      });
    });

    it('異常系: Cloud Functionがエラーの場合は例外をスロー', async () => {
      mocks.generateCarePlanDraftCall.mockRejectedValueOnce(new Error('functions/internal'));

      await expect(
        generateCarePlanDraft(sampleAssessment as AssessmentData, '')
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------
  // generateCarePlanV2
  // -------------------------------------------------------
  describe('generateCarePlanV2', () => {
    const mockV2Response: CarePlanV2Response = {
      needs: [
        {
          content: '移動能力の低下により転倒リスクがある',
          longTermGoal: '安全に自宅内を移動できる',
          shortTermGoals: ['歩行訓練を週3回行う', '手すりを設置する'],
          services: [
            { content: '訪問リハビリ', type: '医療系', frequency: '週3回' },
            { content: '福祉用具貸与（手すり）', type: '福祉用具', frequency: '継続' },
          ],
        },
        {
          content: '服薬管理が困難で内服忘れがある',
          longTermGoal: '正しく服薬を継続できる',
          shortTermGoals: ['訪問介護による服薬確認を行う'],
          services: [
            { content: '訪問介護（服薬確認）', type: '介護保険', frequency: '毎日' },
          ],
        },
      ],
      totalDirectionPolicy: '自立支援を基本として安全な在宅生活を継続する',
      longTermGoal: '安全に自宅内を移動できる',
      shortTermGoals: ['歩行訓練を週3回行う'],
    };

    it('正常系: 複数ニーズを含むV2レスポンスを返す', async () => {
      mocks.generateCarePlanV2Call.mockResolvedValueOnce({ data: mockV2Response });

      const result = await generateCarePlanV2(sampleAssessment as AssessmentData, '');

      expect(result.needs).toHaveLength(2);
      expect(result.totalDirectionPolicy).toBeTruthy();
    });

    it('レスポンス構造: needsの各エントリに必須フィールドが全て存在する', async () => {
      mocks.generateCarePlanV2Call.mockResolvedValueOnce({ data: mockV2Response });

      const result = await generateCarePlanV2(sampleAssessment as AssessmentData, '');
      const firstNeed = result.needs[0];

      // content, longTermGoal, shortTermGoals, services が全て存在する
      expect(firstNeed.content).toBeTruthy();
      expect(firstNeed.longTermGoal).toBeTruthy();
      expect(Array.isArray(firstNeed.shortTermGoals)).toBe(true);
      expect(Array.isArray(firstNeed.services)).toBe(true);
    });

    it('レスポンス構造: servicesの各エントリにcontent/type/frequencyが存在する', async () => {
      mocks.generateCarePlanV2Call.mockResolvedValueOnce({ data: mockV2Response });

      const result = await generateCarePlanV2(sampleAssessment as AssessmentData, '');
      const service = result.needs[0].services[0];

      expect(typeof service.content).toBe('string');
      expect(typeof service.type).toBe('string');
      expect(typeof service.frequency).toBe('string');
    });

    it('後方互換性: トップレベルのlongTermGoalとshortTermGoalsが存在する', async () => {
      mocks.generateCarePlanV2Call.mockResolvedValueOnce({ data: mockV2Response });

      const result = await generateCarePlanV2(sampleAssessment as AssessmentData, '');

      // BEがneeds[0]の値をトップレベルにコピーした後方互換性フィールド
      expect(result.longTermGoal).toBeDefined();
      expect(Array.isArray(result.shortTermGoals)).toBe(true);
    });

    it('引数: assessmentとinstructionが正しく渡される', async () => {
      mocks.generateCarePlanV2Call.mockResolvedValueOnce({ data: mockV2Response });
      const instruction = '医療面を重視して作成する';

      await generateCarePlanV2(sampleAssessment as AssessmentData, instruction);

      expect(mocks.generateCarePlanV2Call).toHaveBeenCalledWith({
        assessment: sampleAssessment,
        instruction,
      });
    });

    it('異常系: Cloud Functionがエラーの場合は例外をスロー', async () => {
      mocks.generateCarePlanV2Call.mockRejectedValueOnce(
        new Error('functions/resource-exhausted')
      );

      await expect(
        generateCarePlanV2(sampleAssessment as AssessmentData, '')
      ).rejects.toThrow('functions/resource-exhausted');
    });
  });
});
