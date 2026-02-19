import React from 'react';
import { Activity, Clock, FileText } from 'lucide-react';
import type { DashboardSummary } from '../../hooks/useDashboardData';

interface DashboardSummaryCardsProps {
  summary: DashboardSummary;
  isLoading: boolean;
}

export function DashboardSummaryCards({ summary, isLoading }: DashboardSummaryCardsProps) {
  const { totalClients, monitoringDone, monitoringRemaining, certificationAlerts, planRevisionNeeded } =
    summary;
  const monitoringComplete = monitoringRemaining === 0 && totalClients > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* モニタリング進捗 */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${monitoringComplete ? 'bg-green-100' : 'bg-blue-100'}`}>
            <Activity
              className={`w-4 h-4 ${monitoringComplete ? 'text-green-600' : 'text-blue-600'}`}
            />
          </div>
          <span className="text-xs font-bold text-stone-500 uppercase">モニタリング進捗</span>
        </div>
        {isLoading ? (
          <div className="h-8 bg-stone-100 animate-pulse rounded" />
        ) : (
          <p className={`text-2xl font-bold ${monitoringComplete ? 'text-green-700' : 'text-blue-700'}`}>
            {monitoringDone}
            <span className="text-sm text-stone-400 font-normal">/{totalClients}件</span>
          </p>
        )}
        <p className="text-xs text-stone-400 mt-1">当月完了</p>
      </div>

      {/* 認定期限アラート */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`p-1.5 rounded-lg ${certificationAlerts > 0 ? 'bg-red-100' : 'bg-green-100'}`}
          >
            <Clock
              className={`w-4 h-4 ${certificationAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}
            />
          </div>
          <span className="text-xs font-bold text-stone-500 uppercase">認定期限アラート</span>
        </div>
        {isLoading ? (
          <div className="h-8 bg-stone-100 animate-pulse rounded" />
        ) : (
          <p
            className={`text-2xl font-bold ${certificationAlerts > 0 ? 'text-red-700' : 'text-green-700'}`}
          >
            {certificationAlerts}
            <span className="text-sm text-stone-400 font-normal">件</span>
          </p>
        )}
        <p className="text-xs text-stone-400 mt-1">60日以内の期限</p>
      </div>

      {/* ケアプラン要更新 */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`p-1.5 rounded-lg ${planRevisionNeeded > 0 ? 'bg-amber-100' : 'bg-green-100'}`}
          >
            <FileText
              className={`w-4 h-4 ${planRevisionNeeded > 0 ? 'text-amber-600' : 'text-green-600'}`}
            />
          </div>
          <span className="text-xs font-bold text-stone-500 uppercase">ケアプラン要更新</span>
        </div>
        {isLoading ? (
          <div className="h-8 bg-stone-100 animate-pulse rounded" />
        ) : (
          <p
            className={`text-2xl font-bold ${planRevisionNeeded > 0 ? 'text-amber-700' : 'text-green-700'}`}
          >
            {planRevisionNeeded}
            <span className="text-sm text-stone-400 font-normal">件</span>
          </p>
        )}
        <p className="text-xs text-stone-400 mt-1">プラン見直し必要</p>
      </div>
    </div>
  );
}
