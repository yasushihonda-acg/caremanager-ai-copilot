import { describe, it, expect } from 'vitest';
import {
  getUrgencyPriority,
  filterActionItems,
  computeSummary,
} from '../../hooks/useDashboardData';
import type { ClientDashboardItem } from '../../hooks/useDashboardData';
import type { CertificationDeadlineStatus, MonitoringStatus } from '../../utils/deadlineAlerts';
import type { Client } from '../../types';

// テスト用ヘルパー: ClientDashboardItem を最小構成で生成
function makeItem(
  certUrgency: CertificationDeadlineStatus['urgency'],
  monitoringDone: boolean | null,
  needsPlanRevision: boolean = false,
): ClientDashboardItem {
  const daysMap: Record<CertificationDeadlineStatus['urgency'], number | null> = {
    expired: -5,
    critical: 15,
    warning: 45,
    safe: 90,
    unknown: null,
  };

  const certificationStatus: CertificationDeadlineStatus = {
    urgency: certUrgency,
    daysRemaining: daysMap[certUrgency],
    label:
      certUrgency === 'expired'
        ? '期限切れ'
        : daysMap[certUrgency] !== null
          ? `残り${daysMap[certUrgency]}日`
          : '',
  };

  const monitoringStatus: MonitoringStatus | null =
    monitoringDone === null
      ? null
      : {
          isCurrentMonthDone: monitoringDone,
          lastVisitDate: monitoringDone ? '2026-02-10' : '2026-01-10',
          daysSinceLastVisit: monitoringDone ? 10 : 40,
        };

  const client = {
    id: `client-${Math.random().toString(36).slice(2)}`,
    name: 'テスト利用者',
    kana: 'てすとりようしゃ',
    careLevel: '要介護2',
    certificationExpiry: null,
    medicalAlerts: [],
    isActive: true,
  } as unknown as Client;

  return { client, certificationStatus, monitoringStatus, needsPlanRevision };
}

// ---------------------------------------------------------------
// getUrgencyPriority
// ---------------------------------------------------------------
describe('getUrgencyPriority', () => {
  it('expired → 0（最高優先度）', () => {
    expect(getUrgencyPriority(makeItem('expired', true))).toBe(0);
  });

  it('critical → 1', () => {
    expect(getUrgencyPriority(makeItem('critical', true))).toBe(1);
  });

  it('safe + モニタリング未完了 → 2', () => {
    expect(getUrgencyPriority(makeItem('safe', false))).toBe(2);
  });

  it('warning + モニタリング完了 → 3', () => {
    expect(getUrgencyPriority(makeItem('warning', true))).toBe(3);
  });

  it('safe + プラン要更新 → 4', () => {
    expect(getUrgencyPriority(makeItem('safe', true, true))).toBe(4);
  });

  it('safe + モニタリング完了 + プラン更新不要 → 99（対応不要）', () => {
    expect(getUrgencyPriority(makeItem('safe', true, false))).toBe(99);
  });

  it('unknown + モニタリング完了 → 99', () => {
    expect(getUrgencyPriority(makeItem('unknown', true, false))).toBe(99);
  });

  it('monitoringStatus が null の場合はモニタリング未完了条件をスキップする', () => {
    expect(getUrgencyPriority(makeItem('safe', null, false))).toBe(99);
  });

  it('expired は critical より優先度が高い', () => {
    const expired = makeItem('expired', true);
    const critical = makeItem('critical', true);
    expect(getUrgencyPriority(expired)).toBeLessThan(getUrgencyPriority(critical));
  });

  it('critical はモニタリング未完了より優先度が高い', () => {
    const critical = makeItem('critical', false);
    const monitoringOnly = makeItem('safe', false);
    expect(getUrgencyPriority(critical)).toBeLessThan(getUrgencyPriority(monitoringOnly));
  });
});

// ---------------------------------------------------------------
// filterActionItems
// ---------------------------------------------------------------
describe('filterActionItems', () => {
  it('priority < 99 の項目のみ返す', () => {
    const items = [
      makeItem('safe', true),    // 99
      makeItem('expired', true), // 0
      makeItem('safe', false),   // 2
    ];
    const result = filterActionItems(items);
    expect(result).toHaveLength(2);
  });

  it('優先度の昇順でソートされる', () => {
    const items = [
      makeItem('warning', true),  // 3
      makeItem('expired', true),  // 0
      makeItem('safe', false),    // 2
    ];
    const result = filterActionItems(items);
    expect(getUrgencyPriority(result[0])).toBe(0);
    expect(getUrgencyPriority(result[1])).toBe(2);
    expect(getUrgencyPriority(result[2])).toBe(3);
  });

  it('空配列を渡すと空配列を返す', () => {
    expect(filterActionItems([])).toEqual([]);
  });

  it('全員対応済みの場合は空配列を返す', () => {
    const items = [makeItem('safe', true), makeItem('unknown', true)];
    expect(filterActionItems(items)).toEqual([]);
  });

  it('元の配列を変更しない（イミュータブル）', () => {
    const items = [makeItem('warning', true), makeItem('expired', true)];
    const original = [...items];
    filterActionItems(items);
    expect(items[0].certificationStatus.urgency).toBe(original[0].certificationStatus.urgency);
  });
});

// ---------------------------------------------------------------
// computeSummary
// ---------------------------------------------------------------
describe('computeSummary', () => {
  it('空の場合は全て0', () => {
    expect(computeSummary([])).toEqual({
      totalClients: 0,
      monitoringDone: 0,
      monitoringRemaining: 0,
      certificationAlerts: 0,
      planRevisionNeeded: 0,
    });
  });

  it('totalClients は items.length に等しい', () => {
    const items = [makeItem('safe', true), makeItem('expired', false)];
    expect(computeSummary(items).totalClients).toBe(2);
  });

  it('monitoringDone / monitoringRemaining を正しく集計する', () => {
    const items = [
      makeItem('safe', true),
      makeItem('safe', true),
      makeItem('safe', false),
    ];
    const summary = computeSummary(items);
    expect(summary.monitoringDone).toBe(2);
    expect(summary.monitoringRemaining).toBe(1);
  });

  it('monitoringDone + monitoringRemaining === totalClients', () => {
    const items = [makeItem('safe', true), makeItem('safe', false), makeItem('safe', null)];
    const summary = computeSummary(items);
    expect(summary.monitoringDone + summary.monitoringRemaining).toBe(summary.totalClients);
  });

  it('certificationAlerts は expired + critical + warning の合計（safe と unknown は含まない）', () => {
    const items = [
      makeItem('expired', true),
      makeItem('critical', true),
      makeItem('warning', true),
      makeItem('safe', true),
      makeItem('unknown', true),
    ];
    expect(computeSummary(items).certificationAlerts).toBe(3);
  });

  it('planRevisionNeeded を正しく集計する', () => {
    const items = [
      makeItem('safe', true, true),
      makeItem('safe', true, false),
      makeItem('safe', true, true),
    ];
    expect(computeSummary(items).planRevisionNeeded).toBe(2);
  });

  it('monitoringStatus が null の場合 monitoringDone にカウントしない', () => {
    const items = [makeItem('safe', null)];
    const summary = computeSummary(items);
    expect(summary.monitoringDone).toBe(0);
    expect(summary.monitoringRemaining).toBe(1);
  });

  it('全員モニタリング完了の場合 monitoringRemaining は 0', () => {
    const items = [makeItem('safe', true), makeItem('expired', true)];
    expect(computeSummary(items).monitoringRemaining).toBe(0);
  });
});
