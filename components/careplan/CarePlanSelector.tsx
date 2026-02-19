import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import type { CarePlanSummary } from '../../hooks/useCarePlan';

interface Props {
  planList: CarePlanSummary[];
  currentPlanId: string;
  isLoading: boolean;
  onSelect: (planId: string) => void;
  onCreateNew: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: '下書き',
  review: '確認中',
  consented: '同意済',
  active: '運用中',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600',
  review: 'bg-yellow-100 text-yellow-700',
  consented: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
};

function formatUpdatedAt(ts: { toDate: () => Date } | undefined): string {
  if (!ts) return '';
  try {
    return ts.toDate().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  } catch {
    return '';
  }
}

export const CarePlanSelector: React.FC<Props> = ({
  planList,
  currentPlanId,
  isLoading,
  onSelect,
  onCreateNew,
}) => {
  if (isLoading) {
    return <div className="text-xs text-stone-400 px-1">読み込み中...</div>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 履歴ドロップダウン */}
      {planList.length > 0 && (
        <div className="relative inline-block">
          <select
            className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentPlanId || ''}
            onChange={e => onSelect(e.target.value)}
          >
            {!currentPlanId && (
              <option value="" disabled>
                プランを選択
              </option>
            )}
            {planList.map(p => (
              <option key={p.id} value={p.id}>
                [{STATUS_LABEL[p.status] ?? p.status}]
                {' '}
                {p.longTermGoal ? p.longTermGoal.slice(0, 15) + (p.longTermGoal.length > 15 ? '…' : '') : '（目標未設定）'}
                {' '}
                {formatUpdatedAt(p.updatedAt)}更新
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        </div>
      )}

      {/* 現在のプランのステータスバッジ */}
      {currentPlanId && planList.length > 0 && (() => {
        const current = planList.find(p => p.id === currentPlanId);
        if (!current) return null;
        return (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[current.status] ?? 'bg-stone-100 text-stone-600'}`}>
            {STATUS_LABEL[current.status] ?? current.status}
          </span>
        );
      })()}

      {/* 新規作成ボタン */}
      <button
        onClick={onCreateNew}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        新規作成
      </button>
    </div>
  );
};
