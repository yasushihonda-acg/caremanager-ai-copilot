import { describe, it, expect } from 'vitest';
import {
  exportTable2AsCsv,
  exportTable3AsCsv,
  buildCsvFilename,
  DAY_LABELS,
  GOAL_STATUS_LABELS,
} from '../../utils/carePlanExport';
import type { CarePlan } from '../../types';

// テスト用の最小限ケアプランデータ
const basePlan: CarePlan = {
  id: 'plan-1',
  userId: 'user-1',
  status: 'active',
  assessmentDate: '2026-01-01',
  draftDate: '2026-01-10',
  meetingDate: '2026-01-15',
  consentDate: '2026-01-20',
  deliveryDate: '2026-01-20',
  longTermGoal: '',
  shortTermGoals: [],
};

// --- 第2表 CSV テスト ---

describe('exportTable2AsCsv', () => {
  describe('V2ニーズ構造（正常系）', () => {
    it('1ニーズ・1サービスで2行（ヘッダー+データ）を出力する', () => {
      const plan: CarePlan = {
        ...basePlan,
        needs: [
          {
            id: 'n1',
            content: '食事の自立支援',
            longTermGoal: '自分で食事ができる',
            longTermGoalStartDate: '2026-01-01',
            longTermGoalEndDate: '2026-06-30',
            shortTermGoals: [
              {
                id: 'g1',
                content: '箸を使って食べる',
                status: 'in_progress',
                startDate: '2026-01-01',
                endDate: '2026-03-31',
              },
            ],
            services: [
              {
                id: 's1',
                content: '食事の声かけ・見守り',
                type: '訪問介護',
                frequency: '週3回',
              },
            ],
          },
        ],
      };

      const csv = exportTable2AsCsv(plan, '山田太郎');
      const lines = csv.split('\r\n');

      expect(lines).toHaveLength(2); // ヘッダー + 1データ行
      expect(lines[0]).toContain('利用者名');
      expect(lines[0]).toContain('ニーズ（生活全般の課題）');
      expect(lines[0]).toContain('サービス種別');
      expect(lines[1]).toContain('山田太郎');
      expect(lines[1]).toContain('食事の自立支援');
      expect(lines[1]).toContain('訪問介護');
      expect(lines[1]).toContain('食事の声かけ・見守り');
      expect(lines[1]).toContain('週3回');
    });

    it('複数サービスがある場合、サービスごとに行が展開される', () => {
      const plan: CarePlan = {
        ...basePlan,
        needs: [
          {
            id: 'n1',
            content: 'ニーズ1',
            longTermGoal: '長期目標1',
            shortTermGoals: [],
            services: [
              { id: 's1', content: 'サービスA', type: '訪問介護', frequency: '週2回' },
              { id: 's2', content: 'サービスB', type: '通所介護', frequency: '週1回' },
            ],
          },
        ],
      };

      const csv = exportTable2AsCsv(plan, '鈴木花子');
      const lines = csv.split('\r\n');

      expect(lines).toHaveLength(3); // ヘッダー + 2サービス行
      expect(lines[1]).toContain('サービスA');
      expect(lines[2]).toContain('サービスB');
    });

    it('複数の短期目標は「・」で結合される', () => {
      const plan: CarePlan = {
        ...basePlan,
        needs: [
          {
            id: 'n1',
            content: 'ニーズ',
            longTermGoal: '長期目標',
            shortTermGoals: [
              { id: 'g1', content: '短期目標A', status: 'in_progress' },
              { id: 'g2', content: '短期目標B', status: 'not_started' },
            ],
            services: [{ id: 's1', content: 'サービス', type: '訪問介護', frequency: '週1回' }],
          },
        ],
      };

      const csv = exportTable2AsCsv(plan, 'テスト太郎');
      expect(csv).toContain('短期目標A');
      expect(csv).toContain('短期目標B');
      expect(csv).toContain('・');
    });

    it('サービスなしのニーズは1行のみ出力される', () => {
      const plan: CarePlan = {
        ...basePlan,
        needs: [
          {
            id: 'n1',
            content: 'ニーズのみ',
            longTermGoal: '長期目標',
            shortTermGoals: [],
            services: [],
          },
        ],
      };

      const csv = exportTable2AsCsv(plan, 'テスト');
      const lines = csv.split('\r\n');
      expect(lines).toHaveLength(2); // ヘッダー + 1行
      expect(lines[1]).toContain('ニーズのみ');
    });

    it('複数ニーズがある場合、各ニーズのサービスが展開される', () => {
      const plan: CarePlan = {
        ...basePlan,
        needs: [
          {
            id: 'n1',
            content: 'ニーズ1',
            longTermGoal: '長期目標1',
            shortTermGoals: [],
            services: [{ id: 's1', content: 'サービス1', type: '訪問介護', frequency: '週3回' }],
          },
          {
            id: 'n2',
            content: 'ニーズ2',
            longTermGoal: '長期目標2',
            shortTermGoals: [],
            services: [
              { id: 's2', content: 'サービス2', type: '通所介護', frequency: '週2回' },
              { id: 's3', content: 'サービス3', type: '訪問看護', frequency: '月2回' },
            ],
          },
        ],
      };

      const csv = exportTable2AsCsv(plan, 'テスト');
      const lines = csv.split('\r\n');
      expect(lines).toHaveLength(4); // ヘッダー + 3サービス行
    });
  });

  describe('V1フォールバック（needsなし）', () => {
    it('shortTermGoalsを行として出力する', () => {
      const plan: CarePlan = {
        ...basePlan,
        longTermGoal: 'V1長期目標',
        longTermGoalStartDate: '2026-01-01',
        longTermGoalEndDate: '2026-12-31',
        shortTermGoals: [
          { id: 'g1', content: 'V1短期目標A', status: 'in_progress' },
          { id: 'g2', content: 'V1短期目標B', status: 'achieved' },
        ],
      };

      const csv = exportTable2AsCsv(plan, 'テスト');
      const lines = csv.split('\r\n');
      expect(lines).toHaveLength(3); // ヘッダー + 2目標行
      expect(lines[1]).toContain('V1長期目標');
      expect(lines[1]).toContain('V1短期目標A');
      expect(lines[1]).toContain('実施中');
      expect(lines[2]).toContain('V1短期目標B');
      expect(lines[2]).toContain('達成');
    });

    it('shortTermGoalsもない場合、1行のみ出力する', () => {
      const plan: CarePlan = {
        ...basePlan,
        longTermGoal: '目標のみ',
        shortTermGoals: [],
      };

      const csv = exportTable2AsCsv(plan, 'テスト');
      const lines = csv.split('\r\n');
      expect(lines).toHaveLength(2); // ヘッダー + 1行
    });
  });

  describe('CSVエスケープ', () => {
    it('カンマを含む値はダブルクォートで囲まれる', () => {
      const plan: CarePlan = {
        ...basePlan,
        needs: [
          {
            id: 'n1',
            content: '食事,入浴の支援',  // 半角カンマを含む
            longTermGoal: '目標A,目標B',  // 半角カンマを含む
            shortTermGoals: [],
            services: [{ id: 's1', content: 'サービス', type: '訪問介護', frequency: '週1回' }],
          },
        ],
      };

      const csv = exportTable2AsCsv(plan, 'テスト');
      expect(csv).toContain('"食事,入浴の支援"');
      expect(csv).toContain('"目標A,目標B"');
    });

    it('ダブルクォートを含む値はエスケープされる', () => {
      const plan: CarePlan = {
        ...basePlan,
        needs: [
          {
            id: 'n1',
            content: '「自分で」できる',
            longTermGoal: '目標',
            shortTermGoals: [],
            services: [{ id: 's1', content: '"特殊"サービス', type: '訪問介護', frequency: '週1回' }],
          },
        ],
      };

      const csv = exportTable2AsCsv(plan, 'テスト');
      expect(csv).toContain('""特殊""');
    });
  });
});

// --- 第3表 CSV テスト ---

describe('exportTable3AsCsv', () => {
  it('週間スケジュールエントリを1行で出力する', () => {
    const plan: CarePlan = {
      ...basePlan,
      weeklySchedule: {
        entries: [
          {
            id: 'e1',
            serviceType: '訪問介護',
            provider: 'テストヘルパーステーション',
            content: '生活援助',
            days: ['mon', 'wed', 'fri'],
            startTime: '09:00',
            endTime: '10:00',
            frequency: '週3回',
            notes: '備考テキスト',
          },
        ],
        mainActivities: '散歩・体操',
        weeklyNote: '月1回通院',
      },
    };

    const csv = exportTable3AsCsv(plan, '山田太郎');
    const lines = csv.split('\r\n');

    expect(lines).toHaveLength(2); // ヘッダー + 1エントリ
    expect(lines[0]).toContain('月');
    expect(lines[0]).toContain('開始時間');
    expect(lines[1]).toContain('山田太郎');
    expect(lines[1]).toContain('訪問介護');
    expect(lines[1]).toContain('テストヘルパーステーション');
    expect(lines[1]).toContain('09:00');
    expect(lines[1]).toContain('10:00');
    expect(lines[1]).toContain('備考テキスト');
  });

  it('実施曜日に○、未実施日は空白を出力する', () => {
    const plan: CarePlan = {
      ...basePlan,
      weeklySchedule: {
        entries: [
          {
            id: 'e1',
            serviceType: '訪問介護',
            provider: '事業所',
            content: 'サービス',
            days: ['mon', 'fri'], // 月・金のみ
            startTime: '10:00',
            endTime: '11:00',
            frequency: '週2回',
            notes: '',
          },
        ],
        mainActivities: '',
        weeklyNote: '',
      },
    };

    const csv = exportTable3AsCsv(plan, 'テスト');
    const lines = csv.split('\r\n');
    // 月(○),火( ),水( ),木( ),金(○),土( ),日( )
    const dataLine = lines[1];
    const cells = dataLine.split(',');
    // 月は index 4 (0:利用者名,1:種別,2:事業所,3:内容,4:月,5:火,...)
    expect(cells[4]).toBe('○'); // 月
    expect(cells[5]).toBe('');  // 火
    expect(cells[6]).toBe('');  // 水
    expect(cells[7]).toBe('');  // 木
    expect(cells[8]).toBe('○'); // 金
    expect(cells[9]).toBe('');  // 土
    expect(cells[10]).toBe(''); // 日
  });

  it('weeklyScheduleがnullの場合、ヘッダーのみ出力する', () => {
    const csv = exportTable3AsCsv(basePlan, 'テスト');
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(1); // ヘッダーのみ
  });

  it('エントリが空の場合、ヘッダーのみ出力する', () => {
    const plan: CarePlan = {
      ...basePlan,
      weeklySchedule: { entries: [], mainActivities: '', weeklyNote: '' },
    };
    const csv = exportTable3AsCsv(plan, 'テスト');
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(1);
  });

  it('複数エントリはそれぞれ1行で出力される', () => {
    const plan: CarePlan = {
      ...basePlan,
      weeklySchedule: {
        entries: [
          { id: 'e1', serviceType: '訪問介護', provider: '事業所A', content: 'サービスA', days: ['mon'], startTime: '09:00', endTime: '10:00', frequency: '週1回', notes: '' },
          { id: 'e2', serviceType: '通所介護', provider: '事業所B', content: 'サービスB', days: ['wed', 'fri'], startTime: '10:00', endTime: '16:00', frequency: '週2回', notes: '' },
        ],
        mainActivities: '',
        weeklyNote: '',
      },
    };

    const csv = exportTable3AsCsv(plan, 'テスト');
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3); // ヘッダー + 2エントリ
  });
});

// --- ファイル名生成テスト ---

describe('buildCsvFilename', () => {
  it('利用者名・表番号・日付を含むファイル名を生成する', () => {
    const filename = buildCsvFilename('山田太郎', '第2表');
    expect(filename).toMatch(/^山田太郎_第2表_\d{8}\.csv$/);
  });

  it('ファイル名に使用できない文字は_に置換される', () => {
    const filename = buildCsvFilename('山田/太郎', '第2表');
    expect(filename).toContain('山田_太郎');
    expect(filename).not.toContain('/');
  });
});

// --- 定数テスト ---

describe('定数', () => {
  it('DAY_LABELSに全曜日が定義されている', () => {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    for (const day of days) {
      expect(DAY_LABELS[day]).toBeDefined();
    }
  });

  it('GOAL_STATUS_LABELSに全ステータスが定義されている', () => {
    const statuses = ['not_started', 'in_progress', 'achieved', 'discontinued'];
    for (const status of statuses) {
      expect(GOAL_STATUS_LABELS[status]).toBeDefined();
    }
  });
});
