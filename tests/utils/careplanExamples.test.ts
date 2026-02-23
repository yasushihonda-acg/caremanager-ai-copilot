import { describe, it, expect } from 'vitest';
import {
  careplanExampleDatabase,
  type DiseaseCategory,
  type CarePlanExample,
} from '../../utils/careplanExamples';

// ========================================
// 基本構造テスト
// ========================================

describe('careplanExampleDatabase', () => {
  it('10カテゴリが定義されている', () => {
    expect(careplanExampleDatabase).toHaveLength(10);
  });

  it('各カテゴリに5件以上の文例がある', () => {
    for (const category of careplanExampleDatabase) {
      expect(category.examples.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('カテゴリIDに重複がない', () => {
    const ids = careplanExampleDatabase.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('全文例数が50件以上である', () => {
    const total = careplanExampleDatabase.reduce((sum, c) => sum + c.examples.length, 0);
    expect(total).toBeGreaterThanOrEqual(50);
  });
});

// ========================================
// 既存カテゴリの存在確認
// ========================================

describe('既存カテゴリ（6件）', () => {
  const existingIds = ['dementia', 'stroke', 'orthopedic', 'cardiac', 'disuse', 'adl_general'];

  for (const id of existingIds) {
    it(`カテゴリ "${id}" が存在する`, () => {
      const category = careplanExampleDatabase.find((c) => c.id === id);
      expect(category).toBeDefined();
      expect(category!.examples.length).toBeGreaterThan(0);
    });
  }
});

// ========================================
// 新規カテゴリのテスト
// ========================================

describe('パーキンソン病カテゴリ', () => {
  let category: DiseaseCategory | undefined;

  it('カテゴリが存在する', () => {
    category = careplanExampleDatabase.find((c) => c.id === 'parkinsons');
    expect(category).toBeDefined();
  });

  it('5件の文例がある', () => {
    category = careplanExampleDatabase.find((c) => c.id === 'parkinsons')!;
    expect(category.examples).toHaveLength(5);
  });

  it('振戦・固縮に関する文例が含まれる', () => {
    category = careplanExampleDatabase.find((c) => c.id === 'parkinsons')!;
    const hasVibration = category.examples.some(
      (ex) => ex.needs.includes('振戦') || ex.needs.includes('固縮')
    );
    expect(hasVibration).toBe(true);
  });

  it('すくみ足・転倒に関する文例が含まれる', () => {
    category = careplanExampleDatabase.find((c) => c.id === 'parkinsons')!;
    const hasFreezing = category.examples.some((ex) => ex.needs.includes('すくみ足'));
    expect(hasFreezing).toBe(true);
  });

  it('各文例にニーズ・長期目標・短期目標が設定されている', () => {
    category = careplanExampleDatabase.find((c) => c.id === 'parkinsons')!;
    for (const ex of category.examples) {
      expect(ex.needs).toBeTruthy();
      expect(ex.longTermGoal).toBeTruthy();
      expect(ex.shortTermGoals.length).toBeGreaterThan(0);
    }
  });
});

describe('糖尿病カテゴリ', () => {
  it('カテゴリが存在し5件の文例がある', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'diabetes');
    expect(category).toBeDefined();
    expect(category!.examples).toHaveLength(5);
  });

  it('フットケアに関する文例が含まれる', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'diabetes')!;
    const hasFootcare = category.examples.some(
      (ex) => ex.needs.includes('足') || ex.longTermGoal.includes('足病変')
    );
    expect(hasFootcare).toBe(true);
  });

  it('血糖管理に関する文例が含まれる', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'diabetes')!;
    const hasBloodSugar = category.examples.some(
      (ex) => ex.needs.includes('血糖') || ex.longTermGoal.includes('血糖')
    );
    expect(hasBloodSugar).toBe(true);
  });

  it('低血糖対応に関する文例が含まれる', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'diabetes')!;
    const hasHypoglycemia = category.examples.some((ex) => ex.needs.includes('低血糖'));
    expect(hasHypoglycemia).toBe(true);
  });
});

describe('COPDカテゴリ', () => {
  it('カテゴリが存在し5件の文例がある', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'copd');
    expect(category).toBeDefined();
    expect(category!.examples).toHaveLength(5);
  });

  it('息切れに関する文例が含まれる', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'copd')!;
    const hasDyspnea = category.examples.some((ex) => ex.needs.includes('息切れ'));
    expect(hasDyspnea).toBe(true);
  });

  it('在宅酸素療法に関する文例が含まれる', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'copd')!;
    const hasOxygen = category.examples.some((ex) => ex.needs.includes('在宅酸素'));
    expect(hasOxygen).toBe(true);
  });

  it('急性増悪予防に関する文例が含まれる', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'copd')!;
    const hasExacerbation = category.examples.some((ex) => ex.needs.includes('急性増悪') || ex.needs.includes('入院'));
    expect(hasExacerbation).toBe(true);
  });
});

describe('がん末期・緩和ケアカテゴリ', () => {
  it('カテゴリが存在し5件の文例がある', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'cancer');
    expect(category).toBeDefined();
    expect(category!.examples).toHaveLength(5);
  });

  it('疼痛管理に関する文例が含まれる', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'cancer')!;
    const hasPain = category.examples.some((ex) => ex.needs.includes('疼痛') || ex.needs.includes('痛み'));
    expect(hasPain).toBe(true);
  });

  it('在宅看取りに関する文例が含まれる', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'cancer')!;
    const hasHomeEnd = category.examples.some(
      (ex) => ex.needs.includes('最期') || ex.longTermGoal.includes('最期')
    );
    expect(hasHomeEnd).toBe(true);
  });

  it('家族支援に関する文例が含まれる', () => {
    const category = careplanExampleDatabase.find((c) => c.id === 'cancer')!;
    const hasFamily = category.examples.some((ex) => ex.needs.includes('家族'));
    expect(hasFamily).toBe(true);
  });
});

// ========================================
// データ品質テスト
// ========================================

describe('文例データ品質', () => {
  it('すべての文例でニーズが空でない', () => {
    for (const category of careplanExampleDatabase) {
      for (const ex of category.examples) {
        expect(ex.needs.trim()).not.toBe('');
      }
    }
  });

  it('すべての文例で短期目標が1件以上ある', () => {
    for (const category of careplanExampleDatabase) {
      for (const ex of category.examples) {
        expect(ex.shortTermGoals.length).toBeGreaterThan(0);
      }
    }
  });

  it('ニーズの重複がない（同一文例なし）', () => {
    const allNeeds = careplanExampleDatabase.flatMap((c) => c.examples.map((ex) => ex.needs));
    const uniqueNeeds = new Set(allNeeds);
    expect(uniqueNeeds.size).toBe(allNeeds.length);
  });
});
