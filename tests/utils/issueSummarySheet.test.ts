import { describe, it, expect } from 'vitest';
import {
  inferAdlStatus,
  inferHealthStatus,
  inferImprovementPotential,
  extractBarrierFactor,
  generateIssueSummarySheet,
} from '../../utils/issueSummarySheet';
import type { AssessmentData } from '../../types';

// ========================================
// inferAdlStatus テスト
// ========================================

describe('inferAdlStatus', () => {
  it('全介助を含む場合 "全介助" を返す', () => {
    expect(inferAdlStatus('全介助が必要')).toBe('全介助');
  });

  it('一部介助を含む場合 "一部介助" を返す', () => {
    expect(inferAdlStatus('一部介助で実施')).toBe('一部介助');
    expect(inferAdlStatus('部分介助が必要')).toBe('一部介助');
    expect(inferAdlStatus('介助が必要な場面あり')).toBe('一部介助');
  });

  it('見守りを含む場合 "見守り" を返す', () => {
    expect(inferAdlStatus('見守りで可能')).toBe('見守り');
    expect(inferAdlStatus('声かけが必要')).toBe('見守り');
  });

  it('自立を含む場合 "自立" を返す', () => {
    expect(inferAdlStatus('自立して行える')).toBe('自立');
    expect(inferAdlStatus('問題なし')).toBe('自立');
    expect(inferAdlStatus('自分でできている')).toBe('自立');
  });

  it('空文字の場合 空文字 を返す', () => {
    expect(inferAdlStatus('')).toBe('');
    expect(inferAdlStatus('   ')).toBe('');
  });

  it('全介助が最優先（一部介助・全介助両方含む場合）', () => {
    expect(inferAdlStatus('全介助（一部介助では不可）')).toBe('全介助');
  });
});

// ========================================
// inferHealthStatus テスト
// ========================================

describe('inferHealthStatus', () => {
  it('問題なしを含む場合 "支障なし" を返す', () => {
    expect(inferHealthStatus('問題なし')).toBe('支障なし');
    expect(inferHealthStatus('良好')).toBe('支障なし');
    expect(inferHealthStatus('安定している')).toBe('支障なし');
    expect(inferHealthStatus('特になし')).toBe('支障なし');
  });

  it('テキストがある場合（問題なし以外） "支障あり" を返す', () => {
    expect(inferHealthStatus('高血圧あり')).toBe('支障あり');
    expect(inferHealthStatus('認知症の診断')).toBe('支障あり');
  });

  it('空文字の場合 空文字 を返す', () => {
    expect(inferHealthStatus('')).toBe('');
  });
});

// ========================================
// inferImprovementPotential テスト
// ========================================

describe('inferImprovementPotential', () => {
  it('改善キーワードがある場合 "改善" を返す', () => {
    expect(inferImprovementPotential('リハビリで改善の見込み')).toBe('改善');
    expect(inferImprovementPotential('訓練により向上可能')).toBe('改善');
    expect(inferImprovementPotential('回復が期待できる')).toBe('改善');
  });

  it('悪化キーワードがある場合 "悪化" を返す', () => {
    expect(inferImprovementPotential('進行性の疾患で悪化の可能性')).toBe('悪化');
    expect(inferImprovementPotential('筋力低下が進行している')).toBe('悪化');
    expect(inferImprovementPotential('困難な状況')).toBe('悪化');
  });

  it('テキストがある（キーワードなし）場合 "維持" を返す', () => {
    expect(inferImprovementPotential('現状維持を目標')).toBe('維持');
    expect(inferImprovementPotential('食事は自分でできている')).toBe('維持');
  });

  it('空文字の場合 空文字 を返す', () => {
    expect(inferImprovementPotential('')).toBe('');
  });
});

// ========================================
// extractBarrierFactor テスト
// ========================================

describe('extractBarrierFactor', () => {
  it('阻害要因キーワードを抽出する', () => {
    const result = extractBarrierFactor('筋力低下により移乗困難');
    expect(result).toContain('筋力低下');
  });

  it('複数の阻害要因を抽出する（最大3件）', () => {
    const result = extractBarrierFactor('認知症・筋力低下・段差のある住環境');
    const factors = result.split('、');
    expect(factors.length).toBeLessThanOrEqual(3);
  });

  it('キーワードが見つからない場合、テキストの先頭30文字を返す', () => {
    const longText = 'abc'.repeat(20); // 60文字
    const result = extractBarrierFactor(longText);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(33); // 30文字 + '…'
  });

  it('空文字の場合 空文字 を返す', () => {
    expect(extractBarrierFactor('')).toBe('');
  });
});

// ========================================
// generateIssueSummarySheet テスト
// ========================================

const mockAssessment: AssessmentData = {
  serviceHistory: 'デイサービス週3回利用中',
  healthStatus: '高血圧・糖尿病あり',
  pastHistory: '脳梗塞（2020年）',
  skinCondition: '問題なし',
  oralHygiene: '義歯使用、自分でケアできている',
  fluidIntake: '1日1L摂取',
  adlTransfer: '一部介助で可能',
  adlEating: '自立',
  adlToileting: '見守りが必要',
  adlBathing: '全介助',
  adlDressing: '一部介助',
  iadlCooking: '全介助',
  iadlShopping: '全介助',
  iadlMoney: '家族が管理',
  medication: '自己管理困難、家族管理',
  cognition: '認知症の診断あり、HDS-R 15点',
  communication: '意思疎通は概ね可能',
  socialParticipation: 'デイサービスで交流あり',
  residence: '段差あり、手すりなし',
  familySituation: '娘が同居、介護力あり',
  maltreatmentRisk: '',
  environment: '要介護3、在宅生活継続希望',
};

describe('generateIssueSummarySheet', () => {
  const sheet = generateIssueSummarySheet(
    mockAssessment,
    { name: '田中 花子', kana: 'タナカ ハナコ', careLevel: '要介護3' },
    { name: '山田 ケアマネ', office: 'ケアサポートセンター' }
  );

  it('シートが生成される', () => {
    expect(sheet).toBeDefined();
  });

  it('基本情報が正しく設定される', () => {
    expect(sheet.userName).toBe('田中 花子');
    expect(sheet.userKana).toBe('タナカ ハナコ');
    expect(sheet.careLevel).toBe('要介護3');
    expect(sheet.careManagerName).toBe('山田 ケアマネ');
    expect(sheet.careManagerOffice).toBe('ケアサポートセンター');
  });

  it('作成日が今日の日付で設定される', () => {
    expect(sheet.createdDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('行数が20行である（AssessmentDataの全フィールドに対応）', () => {
    expect(sheet.rows).toHaveLength(20);
  });

  it('全行にidとitemが設定されている', () => {
    for (const row of sheet.rows) {
      expect(row.id).toBeTruthy();
      expect(row.item).toBeTruthy();
    }
  });

  it('全行にcategoryが設定されている', () => {
    for (const row of sheet.rows) {
      expect(row.category).toBeTruthy();
    }
  });

  it('ADLの全介助が正しく推定される（入浴）', () => {
    const bathRow = sheet.rows.find((r) => r.id === 'adlBathing');
    expect(bathRow?.currentStatus).toBe('全介助');
  });

  it('健康状態が支障ありに分類される', () => {
    const healthRow = sheet.rows.find((r) => r.id === 'healthStatus');
    expect(healthRow?.currentStatus).toBe('支障あり');
  });

  it('皮膚状態が問題なし → 支障なしに分類される', () => {
    const skinRow = sheet.rows.find((r) => r.id === 'skinCondition');
    expect(skinRow?.currentStatus).toBe('支障なし');
  });

  it('状況の事実にアセスメントテキストが入る', () => {
    const transferRow = sheet.rows.find((r) => r.id === 'adlTransfer');
    expect(transferRow?.situationFact).toBe('一部介助で可能');
  });

  it('虐待リスクが空の場合はcurrentStatusが空', () => {
    const malRow = sheet.rows.find((r) => r.id === 'maltreatmentRisk');
    expect(malRow?.currentStatus).toBe('');
  });
});
