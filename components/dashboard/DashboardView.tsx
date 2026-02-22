import React from 'react';
import { Users, LayoutDashboard, UserPlus, ClipboardList, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useClient } from '../../contexts/ClientContext';
import { useDashboardData, filterActionItems } from '../../hooks/useDashboardData';
import { DashboardSummaryCards } from './DashboardSummaryCards';
import { DashboardActionList } from './DashboardActionList';

interface DashboardViewProps {
  onSelectClient: (clientId: string) => void;
  onViewAllClients: () => void;
  onRegisterNewClient?: () => void;
}

export function DashboardView({ onSelectClient, onViewAllClients, onRegisterNewClient }: DashboardViewProps) {
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

      {/* クイックスタート（利用者0件時） */}
      {!loading && clients.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            まずここから始めましょう
          </h3>
          <ol className="space-y-2 mb-4 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
              利用者を登録する
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
              アセスメント（課題分析）を入力する
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
              AIでケアプランを自動生成する
            </li>
          </ol>
          {onRegisterNewClient && (
            <button
              onClick={onRegisterNewClient}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              最初の利用者を登録する
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
          )}
        </div>
      )}

      {/* クイックアクション（利用者がいる場合） */}
      {!loading && clients.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onViewAllClients}
            className="flex flex-col items-start gap-1 p-3 bg-white border border-stone-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left min-h-[44px]"
          >
            <div className="flex items-center gap-1.5 text-blue-600">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">利用者を選ぶ</span>
            </div>
            <p className="text-xs text-stone-400">アセスメント・プラン作成</p>
          </button>
          {onRegisterNewClient && (
            <button
              onClick={onRegisterNewClient}
              className="flex flex-col items-start gap-1 p-3 bg-white border border-stone-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left min-h-[44px]"
            >
              <div className="flex items-center gap-1.5 text-emerald-600">
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium">利用者を登録</span>
              </div>
              <p className="text-xs text-stone-400">新規利用者の追加</p>
            </button>
          )}
        </div>
      )}

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
