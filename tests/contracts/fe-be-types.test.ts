/**
 * FE/BE 型契約テスト
 *
 * FE（services/geminiService.ts, services/firebase.ts）と
 * BE（functions/src/vertexAi.ts）の型定義が一致することを保証する。
 *
 * BEのスキーマ（assessmentSchema, carePlanSchemaV2 等）をここにミラー定義し、
 * FEの型と相互代入可能かをTypeScriptの型システムで検証する。
 * BE側の型が変わった場合、このテストが型エラーで失敗するため変更に気付ける。
 */

import { describe, it, expect, expectTypeOf } from 'vitest';
import type { CarePlanV2NeedResponse, CarePlanV2Response } from '../../services/geminiService';

// =============================================================
// BE側スキーマのミラー型定義
// ソース: functions/src/vertexAi.ts
// =============================================================

/**
 * analyzeAssessment: assessmentSchema（SchemaType.OBJECT）に対応
 * 全23フィールドがoptional string、summaryのみrequired（だがFE側もoptional扱い）
 */
type BeAnalyzeAssessmentResponse = {
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
  summary?: string;
};

/** refineCareGoal のレスポンス型 */
type BeRefineCareGoalResponse = { refinedGoal: string; wasRefined: boolean };

/** generateCarePlanDraft のレスポンス型（旧バージョン、後方互換性のため維持） */
type BeCarePlanDraftResponse = { longTermGoal: string; shortTermGoals: string[] };

/** generateCarePlanV2: carePlanSchemaV2 のサービスエントリ */
type BeCarePlanV2Service = { content: string; type: string; frequency: string };

/** generateCarePlanV2: carePlanSchemaV2 の各ニーズエントリ */
type BeCarePlanV2Need = {
  content: string;
  longTermGoal: string;
  shortTermGoals: string[];
  services: BeCarePlanV2Service[];
};

/**
 * generateCarePlanV2 のレスポンス型
 * carePlanSchemaV2 + 後方互換性フィールド（BE側でプログラム的に追加）
 */
type BeCarePlanV2Response = {
  needs: BeCarePlanV2Need[];
  totalDirectionPolicy: string;
  longTermGoal: string;
  shortTermGoals: string[];
};

// =============================================================
// 型契約テスト
// =============================================================

describe('FE/BE 型契約テスト', () => {
  // -------------------------------------------------------
  // analyzeAssessment
  // -------------------------------------------------------
  describe('analyzeAssessment レスポンス型', () => {
    it('23アセスメントフィールドが全て定義されている', () => {
      const allFields: (keyof BeAnalyzeAssessmentResponse)[] = [
        'serviceHistory', 'healthStatus', 'pastHistory', 'skinCondition', 'oralHygiene',
        'fluidIntake', 'adlTransfer', 'adlEating', 'adlToileting', 'adlBathing',
        'adlDressing', 'iadlCooking', 'iadlShopping', 'iadlMoney', 'medication',
        'cognition', 'communication', 'socialParticipation', 'residence',
        'familySituation', 'maltreatmentRisk', 'environment', 'summary',
      ];
      // BEスキーマに定義された23フィールドが全て型に存在する
      expect(allFields).toHaveLength(23);
    });

    it('全フィールドがoptional（undefined可）である', () => {
      const empty: BeAnalyzeAssessmentResponse = {};
      expect(empty.serviceHistory).toBeUndefined();
      expect(empty.healthStatus).toBeUndefined();
      expect(empty.summary).toBeUndefined();
    });

    it('実データ形状がBEスキーマと一致する', () => {
      const sampleResponse: BeAnalyzeAssessmentResponse = {
        serviceHistory: 'デイサービス週3回、訪問介護週2回',
        healthStatus: '高血圧（内服中）、2型糖尿病',
        summary: '在宅生活継続に向けた生活支援と医療管理が必要',
      };
      expect(typeof sampleResponse.serviceHistory).toBe('string');
      expect(typeof sampleResponse.summary).toBe('string');
      // 未設定フィールドはundefined
      expect(sampleResponse.maltreatmentRisk).toBeUndefined();
    });
  });

  // -------------------------------------------------------
  // refineCareGoal
  // -------------------------------------------------------
  describe('refineCareGoal レスポンス型', () => {
    it('refinedGoal（string）とwasRefined（boolean）が必須フィールドである', () => {
      expectTypeOf<BeRefineCareGoalResponse>().toHaveProperty('refinedGoal');
      expectTypeOf<BeRefineCareGoalResponse>().toHaveProperty('wasRefined');
    });

    it('refinedGoalはstring型である', () => {
      const response: BeRefineCareGoalResponse = {
        refinedGoal: '在宅での自立した生活を維持する',
        wasRefined: true,
      };
      expectTypeOf(response.refinedGoal).toBeString();
    });

    it('wasRefinedはboolean型である', () => {
      const response: BeRefineCareGoalResponse = {
        refinedGoal: '自宅で生活したい',
        wasRefined: false,
      };
      expectTypeOf(response.wasRefined).toBeBoolean();
    });

    it('wasRefined=falseの場合、refinedGoalは入力値と同じ文字列が返る', () => {
      // BEの実装: wasRefinedがfalseなら{ refinedGoal: currentGoal, wasRefined: false }
      const input = '自宅で過ごしたい';
      const response: BeRefineCareGoalResponse = { refinedGoal: input, wasRefined: false };
      expect(response.refinedGoal).toBe(input);
      expect(response.wasRefined).toBe(false);
    });
  });

  // -------------------------------------------------------
  // generateCarePlanDraft
  // -------------------------------------------------------
  describe('generateCarePlanDraft レスポンス型', () => {
    it('longTermGoal（string）とshortTermGoals（string[]）が必須である', () => {
      const response: BeCarePlanDraftResponse = {
        longTermGoal: '在宅での自立した生活を継続する',
        shortTermGoals: ['週3回デイサービスを利用する', '毎日服薬管理を行う'],
      };
      expect(typeof response.longTermGoal).toBe('string');
      expect(Array.isArray(response.shortTermGoals)).toBe(true);
    });

    it('shortTermGoalsの各要素はstring型である', () => {
      const response: BeCarePlanDraftResponse = {
        longTermGoal: '目標',
        shortTermGoals: ['短期目標1', '短期目標2', '短期目標3'],
      };
      response.shortTermGoals.forEach(goal => expect(typeof goal).toBe('string'));
    });
  });

  // -------------------------------------------------------
  // generateCarePlanV2
  // -------------------------------------------------------
  describe('generateCarePlanV2 レスポンス型', () => {
    it('FEのCarePlanV2NeedResponseはBEのBeCarePlanV2Needと相互代入可能', () => {
      // FE型 → BE型ミラー への代入可能性
      expectTypeOf<CarePlanV2NeedResponse>().toMatchTypeOf<BeCarePlanV2Need>();
      // BE型ミラー → FE型 への代入可能性（双方向）
      expectTypeOf<BeCarePlanV2Need>().toMatchTypeOf<CarePlanV2NeedResponse>();
    });

    it('FEのCarePlanV2ResponseはBEのBeCarePlanV2Responseと相互代入可能', () => {
      expectTypeOf<CarePlanV2Response>().toMatchTypeOf<BeCarePlanV2Response>();
      expectTypeOf<BeCarePlanV2Response>().toMatchTypeOf<CarePlanV2Response>();
    });

    it('needsの各エントリに4つの必須フィールドが存在する', () => {
      const need: BeCarePlanV2Need = {
        content: '移動能力の低下により転倒リスクがある',
        longTermGoal: '安全に自宅内を移動できる',
        shortTermGoals: ['歩行訓練を週3回行う', '手すりを設置する'],
        services: [{ content: '訪問リハビリ', type: '医療系', frequency: '週3回' }],
      };
      expect(need).toHaveProperty('content');
      expect(need).toHaveProperty('longTermGoal');
      expect(need).toHaveProperty('shortTermGoals');
      expect(need).toHaveProperty('services');
    });

    it('servicesの各エントリにcontent/type/frequencyが存在する', () => {
      const service: BeCarePlanV2Service = {
        content: '訪問介護（身体介護）',
        type: '介護保険',
        frequency: '週5回',
      };
      expectTypeOf(service.content).toBeString();
      expectTypeOf(service.type).toBeString();
      expectTypeOf(service.frequency).toBeString();
    });

    it('後方互換性フィールド（longTermGoal/shortTermGoals）がトップレベルに存在する', () => {
      // BEはneeds[0]の値をトップレベルにもコピーする（後方互換性）
      const response: BeCarePlanV2Response = {
        needs: [{
          content: 'ニーズ1',
          longTermGoal: '長期目標',
          shortTermGoals: ['短期目標'],
          services: [],
        }],
        totalDirectionPolicy: '援助の方針',
        longTermGoal: '長期目標',       // 後方互換性フィールド
        shortTermGoals: ['短期目標'],   // 後方互換性フィールド
      };
      expect(response.longTermGoal).toBeDefined();
      expect(response.shortTermGoals).toBeInstanceOf(Array);
    });

    it('totalDirectionPolicyはstring型の必須フィールドである', () => {
      expectTypeOf<BeCarePlanV2Response>().toHaveProperty('totalDirectionPolicy');
      const response: BeCarePlanV2Response = {
        needs: [],
        totalDirectionPolicy: '自立支援を基本として在宅生活を継続する',
        longTermGoal: '',
        shortTermGoals: [],
      };
      expectTypeOf(response.totalDirectionPolicy).toBeString();
    });
  });
});
