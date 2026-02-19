import React from 'react';
import { ChevronRight, Clock, Activity, FileText } from 'lucide-react';
import type { ClientDashboardItem } from '../../hooks/useDashboardData';
import { deadlineUrgencyStyles } from '../../utils/deadlineAlerts';

interface DashboardActionListProps {
  /** filterActionItems で事前にフィルタ・ソート済みの要対応リスト */
  items: ClientDashboardItem[];
  isLoading: boolean;
  onSelectClient: (clientId: string) => void;
}

const careLevelColors: Record<string, string> = {
  '要支援1': 'bg-green-100 text-green-800',
  '要支援2': 'bg-green-100 text-green-800',
  '要介護1': 'bg-yellow-100 text-yellow-800',
  '要介護2': 'bg-orange-100 text-orange-800',
  '要介護3': 'bg-orange-100 text-orange-800',
  '要介護4': 'bg-red-100 text-red-800',
  '要介護5': 'bg-red-100 text-red-800',
};

function ActionBadges({ item }: { item: ClientDashboardItem }) {
  const badges: React.ReactNode[] = [];
  const { urgency, label } = item.certificationStatus;

  if (urgency === 'expired' || urgency === 'critical' || urgency === 'warning') {
    const styles = deadlineUrgencyStyles[urgency];
    badges.push(
      <span
        key="cert"
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${styles.badge}`}
      >
        <Clock className="w-3 h-3" />
        {label}
      </span>,
    );
  }

  if (item.monitoringStatus !== null && !item.monitoringStatus.isCurrentMonthDone) {
    badges.push(
      <span
        key="monitoring"
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 border-blue-200"
      >
        <Activity className="w-3 h-3" />
        モニタリング未
      </span>,
    );
  }

  if (item.needsPlanRevision) {
    badges.push(
      <span
        key="plan"
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200"
      >
        <FileText className="w-3 h-3" />
        プラン要更新
      </span>,
    );
  }

  return <>{badges}</>;
}

export function DashboardActionList({ items, isLoading, onSelectClient }: DashboardActionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-stone-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        <div className="text-3xl mb-2">✓</div>
        <p className="text-sm font-medium text-stone-600">すべての対応が完了しています</p>
        <p className="text-xs mt-1">今月のモニタリング・認定期限の対応はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <button
          key={item.client.id}
          onClick={() => onSelectClient(item.client.id)}
          className="w-full flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 hover:border-stone-300 transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-stone-800 text-sm">{item.client.name}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  careLevelColors[item.client.careLevel] ?? 'bg-stone-100 text-stone-600'
                }`}
              >
                {item.client.careLevel}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              <ActionBadges item={item} />
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}
