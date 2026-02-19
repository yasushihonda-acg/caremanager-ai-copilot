import React from 'react';
import { Users, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useClient } from '../../contexts/ClientContext';
import { useDashboardData, filterActionItems } from '../../hooks/useDashboardData';
import { DashboardSummaryCards } from './DashboardSummaryCards';
import { DashboardActionList } from './DashboardActionList';

interface DashboardViewProps {
  onSelectClient: (clientId: string) => void;
  onViewAllClients: () => void;
}

export function DashboardView({ onSelectClient, onViewAllClients }: DashboardViewProps) {
  const { user } = useAuth();
  const { clients, loadingClients } = useClient();
  const { items, isLoading, error, summary } = useDashboardData(user?.uid ?? null, clients);

  const yearMonth = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  const actionItems = filterActionItems(items);
  const loading = isLoading || loadingClients;

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-stone-800">{yearMonth} 業務概況</h2>
            {!loadingClients && (
              <p className="text-xs text-stone-500">担当利用者 {clients.length}名</p>
            )}
          </div>
        </div>
        <button
          onClick={onViewAllClients}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
        >
          <Users className="w-4 h-4" />
          利用者一覧
        </button>
      </div>

      {/* エラー */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* サマリーカード */}
      <DashboardSummaryCards summary={summary} isLoading={loading} />

      {/* 要対応リスト */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-stone-700 mb-3">
          要対応リスト
          {!loading && actionItems.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">
              {actionItems.length}件
            </span>
          )}
        </h3>
        <DashboardActionList
          items={actionItems}
          isLoading={loading}
          onSelectClient={onSelectClient}
        />
      </div>
    </div>
  );
}
