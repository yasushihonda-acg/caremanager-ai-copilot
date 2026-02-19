import { describe, it, expect } from 'vitest';
import {
  getCertificationDeadlineStatus,
  getMonitoringStatus,
  deadlineUrgencyStyles,
} from '../../utils/deadlineAlerts';

// 基準日: 2024-06-15（テスト用固定値）
const TODAY = new Date('2024-06-15T00:00:00');

/**
 * YYYY-MM-DD形式で N日後の日付文字列を返す（ローカルタイムゾーンで計算）
 * NOTE: .toISOString() は UTC 変換するため、JST 環境では日付がずれる。
 *       getFullYear/getMonth/getDate で直接フォーマットすること。
 */
function daysFromToday(days: number): string {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('getCertificationDeadlineStatus', () => {
  describe('正常系', () => {
    it('90日後 → safe', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(90), TODAY);
      expect(status.urgency).toBe('safe');
      expect(status.daysRemaining).toBe(90);
    });

    it('61日後 → safe', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(61), TODAY);
      expect(status.urgency).toBe('safe');
    });

    it('60日後 → warning', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(60), TODAY);
      expect(status.urgency).toBe('warning');
      expect(status.label).toBe('残り60日');
    });

    it('45日後 → warning', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(45), TODAY);
      expect(status.urgency).toBe('warning');
      expect(status.label).toBe('残り45日');
    });

    it('31日後 → warning', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(31), TODAY);
      expect(status.urgency).toBe('warning');
    });

    it('30日後 → critical', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(30), TODAY);
      expect(status.urgency).toBe('critical');
      expect(status.label).toBe('残り30日');
    });

    it('15日後 → critical', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(15), TODAY);
      expect(status.urgency).toBe('critical');
      expect(status.label).toBe('残り15日');
    });

    it('0日後（当日が期限） → critical', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(0), TODAY);
      expect(status.urgency).toBe('critical');
      expect(status.daysRemaining).toBe(0);
    });

    it('-1日（昨日が期限） → expired', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(-1), TODAY);
      expect(status.urgency).toBe('expired');
      expect(status.label).toBe('期限切れ');
    });

    it('大幅に期限切れ → expired', () => {
      const status = getCertificationDeadlineStatus('2020-01-01', TODAY);
      expect(status.urgency).toBe('expired');
      expect(status.label).toBe('期限切れ');
    });
  });

  describe('境界値', () => {
    it('62日後 → safe', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(62), TODAY);
      expect(status.urgency).toBe('safe');
    });

    it('61日後 → safe（境界）', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(61), TODAY);
      expect(status.urgency).toBe('safe');
    });

    it('60日後 → warning（境界）', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(60), TODAY);
      expect(status.urgency).toBe('warning');
    });

    it('31日後 → warning（境界）', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(31), TODAY);
      expect(status.urgency).toBe('warning');
    });

    it('30日後 → critical（境界）', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(30), TODAY);
      expect(status.urgency).toBe('critical');
    });

    it('1日後 → critical', () => {
      const status = getCertificationDeadlineStatus(daysFromToday(1), TODAY);
      expect(status.urgency).toBe('critical');
    });
  });

  describe('異常系', () => {
    it('null → unknown', () => {
      const status = getCertificationDeadlineStatus(null, TODAY);
      expect(status.urgency).toBe('unknown');
      expect(status.daysRemaining).toBeNull();
      expect(status.label).toBe('');
    });

    it('空文字 → unknown', () => {
      const status = getCertificationDeadlineStatus('', TODAY);
      expect(status.urgency).toBe('unknown');
      expect(status.daysRemaining).toBeNull();
    });

    it('スペースのみ → unknown', () => {
      const status = getCertificationDeadlineStatus('   ', TODAY);
      expect(status.urgency).toBe('unknown');
    });

    it('不正な日付文字列 → unknown', () => {
      const status = getCertificationDeadlineStatus('not-a-date', TODAY);
      expect(status.urgency).toBe('unknown');
      expect(status.daysRemaining).toBeNull();
    });
  });

  describe('today省略時', () => {
    it('today省略時でもエラーが出ない', () => {
      // 遠い将来日付は常に safe になるはず
      expect(() => getCertificationDeadlineStatus('2099-12-31')).not.toThrow();
    });
  });
});

describe('getMonitoringStatus', () => {
  describe('正常系', () => {
    it('当月に訪問日がある → isCurrentMonthDone: true', () => {
      const today = new Date('2024-06-15T00:00:00');
      const status = getMonitoringStatus(['2024-06-10', '2024-05-12'], today);
      expect(status.isCurrentMonthDone).toBe(true);
      expect(status.lastVisitDate).toBe('2024-06-10');
    });

    it('最新日が先頭に来る（降順）', () => {
      const today = new Date('2024-06-15T00:00:00');
      const status = getMonitoringStatus(['2024-04-05', '2024-06-10', '2024-05-12'], today);
      expect(status.lastVisitDate).toBe('2024-06-10');
    });

    it('当月に訪問日がない → isCurrentMonthDone: false', () => {
      const today = new Date('2024-06-15T00:00:00');
      const status = getMonitoringStatus(['2024-05-20'], today);
      expect(status.isCurrentMonthDone).toBe(false);
      expect(status.lastVisitDate).toBe('2024-05-20');
    });

    it('先月末（5/31）は当月外 → isCurrentMonthDone: false', () => {
      const today = new Date('2024-06-15T00:00:00');
      const status = getMonitoringStatus(['2024-05-31'], today);
      expect(status.isCurrentMonthDone).toBe(false);
      expect(status.lastVisitDate).toBe('2024-05-31');
    });

    it('daysSinceLastVisit が正しく計算される', () => {
      const today = new Date('2024-06-15T00:00:00');
      const status = getMonitoringStatus(['2024-05-31'], today);
      expect(status.daysSinceLastVisit).toBe(15);
    });

    it('当日訪問 → daysSinceLastVisit: 0', () => {
      const today = new Date('2024-06-15T00:00:00');
      const status = getMonitoringStatus(['2024-06-15'], today);
      expect(status.isCurrentMonthDone).toBe(true);
      expect(status.daysSinceLastVisit).toBe(0);
    });
  });

  describe('異常系', () => {
    it('空配列 → 全て null / false', () => {
      const today = new Date('2024-06-15T00:00:00');
      const status = getMonitoringStatus([], today);
      expect(status.isCurrentMonthDone).toBe(false);
      expect(status.lastVisitDate).toBeNull();
      expect(status.daysSinceLastVisit).toBeNull();
    });

    it('今日省略でもエラーが出ない', () => {
      expect(() => getMonitoringStatus(['2024-01-01'])).not.toThrow();
    });
  });
});

describe('deadlineUrgencyStyles', () => {
  it('全urgencyのスタイルが定義されている', () => {
    const urgencies = ['expired', 'critical', 'warning', 'safe', 'unknown'] as const;
    for (const u of urgencies) {
      expect(deadlineUrgencyStyles[u]).toBeDefined();
      expect(deadlineUrgencyStyles[u].badge).toBeDefined();
      expect(deadlineUrgencyStyles[u].text).toBeDefined();
    }
  });

  it('expired と critical は同じ赤系スタイル', () => {
    expect(deadlineUrgencyStyles.expired.badge).toBe(deadlineUrgencyStyles.critical.badge);
  });

  it('unknown は空文字（非表示）', () => {
    expect(deadlineUrgencyStyles.unknown.badge).toBe('');
    expect(deadlineUrgencyStyles.unknown.text).toBe('');
  });
});
