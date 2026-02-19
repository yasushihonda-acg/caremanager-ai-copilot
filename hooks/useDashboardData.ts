import { useState, useEffect } from 'react';
import type { Client } from '../types';
import {
  getCertificationDeadlineStatus,
  getMonitoringStatus,
} from '../utils/deadlineAlerts';
import type { CertificationDeadlineStatus, MonitoringStatus } from '../utils/deadlineAlerts';
import { listMonitoringRecords } from '../services/firebase';

export interface ClientDashboardItem {
  client: Client;
  certificationStatus: CertificationDeadlineStatus;
  monitoringStatus: MonitoringStatus | null;
  needsPlanRevision: boolean;
}

export interface DashboardSummary {
  totalClients: number;
  monitoringDone: number;
  monitoringRemaining: number;
  certificationAlerts: number; // expired + critical + warning
  planRevisionNeeded: number;
}

export interface DashboardData {
  items: ClientDashboardItem[];
  isLoading: boolean;
  error: string | null;
  summary: DashboardSummary;
}

/**
 * 利用者の要対応緊急度を数値で返す（小さいほど優先度高）
 * 0: expired, 1: critical, 2: モニタリング未完了, 3: warning, 4: プラン要更新, 99: 対応不要
 */
export function getUrgencyPriority(item: ClientDashboardItem): number {
  const { urgency } = item.certificationStatus;
  if (urgency === 'expired') return 0;
  if (urgency === 'critical') return 1;
  if (item.monitoringStatus !== null && !item.monitoringStatus.isCurrentMonthDone) return 2;
  if (urgency === 'warning') return 3;
  if (item.needsPlanRevision) return 4;
  return 99;
}

/**
 * 要対応利用者（priority < 99）をフィルタして優先度順にソート
 */
export function filterActionItems(items: ClientDashboardItem[]): ClientDashboardItem[] {
  return items
    .filter((item) => getUrgencyPriority(item) < 99)
    .sort((a, b) => getUrgencyPriority(a) - getUrgencyPriority(b));
}

/**
 * DashboardSummary を集計する
 */
export function computeSummary(items: ClientDashboardItem[]): DashboardSummary {
  const totalClients = items.length;
  const monitoringDone = items.filter(
    (item) => item.monitoringStatus?.isCurrentMonthDone === true,
  ).length;
  const certificationAlerts = items.filter(
    (item) =>
      item.certificationStatus.urgency === 'expired' ||
      item.certificationStatus.urgency === 'critical' ||
      item.certificationStatus.urgency === 'warning',
  ).length;
  const planRevisionNeeded = items.filter((item) => item.needsPlanRevision).length;

  return {
    totalClients,
    monitoringDone,
    monitoringRemaining: totalClients - monitoringDone,
    certificationAlerts,
    planRevisionNeeded,
  };
}

/**
 * Firestore Timestamp を YYYY-MM-DD 文字列に変換する
 */
function timestampToDateString(timestamp: unknown): string {
  if (timestamp && typeof (timestamp as { toDate?: unknown }).toDate === 'function') {
    const date = (timestamp as { toDate: () => Date }).toDate();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof timestamp === 'string') return timestamp.slice(0, 10);
  return '';
}

/**
 * ダッシュボード表示用データを集約するフック
 */
export function useDashboardData(userId: string | null, clients: Client[]): DashboardData {
  const [items, setItems] = useState<ClientDashboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    if (clients.length === 0) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const fetchAll = async () => {
      const results = await Promise.allSettled(
        clients.map(async (client): Promise<ClientDashboardItem> => {
          const certificationStatus = getCertificationDeadlineStatus(client.certificationExpiry);
          let monitoringStatus: MonitoringStatus | null = null;
          let needsPlanRevision = false;

          try {
            const records = await listMonitoringRecords(userId, client.id, 5);
            if (records.length > 0) {
              const visitDates = records
                .map((r) => timestampToDateString(r.visitDate))
                .filter(Boolean);
              monitoringStatus = getMonitoringStatus(visitDates);
              needsPlanRevision = records[0].needsPlanRevision ?? false;
            } else {
              monitoringStatus = {
                isCurrentMonthDone: false,
                lastVisitDate: null,
                daysSinceLastVisit: null,
              };
            }
          } catch {
            // 個別エラーは無視して進める
            monitoringStatus = null;
          }

          return { client, certificationStatus, monitoringStatus, needsPlanRevision };
        }),
      );

      if (cancelled) return;

      const dashboardItems: ClientDashboardItem[] = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      );

      setItems(dashboardItems);
      setIsLoading(false);
    };

    fetchAll().catch((err) => {
      if (!cancelled) {
        console.error('Dashboard data fetch error:', err);
        setError('データの読み込みに失敗しました');
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId, clients]);

  const summary = computeSummary(items);

  return { items, isLoading, error, summary };
}
