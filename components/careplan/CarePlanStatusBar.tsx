import React from 'react';
import { ChevronRight } from 'lucide-react';

type PlanStatus = 'draft' | 'review' | 'consented' | 'active';

interface Props {
  status: PlanStatus;
  onAdvance: (newStatus: PlanStatus) => void;
}

const STEPS: { key: PlanStatus; label: string; description: string }[] = [
  { key: 'draft',     label: '下書き',   description: 'プラン作成中' },
  { key: 'review',    label: '確認中',   description: '内容確認・修正' },
  { key: 'consented', label: '同意済',   description: '利用者同意取得' },
  { key: 'active',    label: '運用中',   description: '実施・モニタリング中' },
];

const NEXT: Partial<Record<PlanStatus, PlanStatus>> = {
  draft: 'review',
  review: 'consented',
  consented: 'active',
};

const STEP_COLOR: Record<PlanStatus, string> = {
  draft:     'bg-stone-500 text-white',
  review:    'bg-yellow-500 text-white',
  consented: 'bg-blue-500 text-white',
  active:    'bg-green-600 text-white',
};

export const CarePlanStatusBar: React.FC<Props> = ({ status, onAdvance }) => {
  const currentIdx = STEPS.findIndex(s => s.key === status);
  const nextStatus = NEXT[status];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STEPS.map((step, idx) => {
        const isPast    = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture  = idx > currentIdx;
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
            )}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                isCurrent
                  ? STEP_COLOR[step.key]
                  : isPast
                  ? 'bg-stone-200 text-stone-500'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              <span>{isFuture ? '○' : isPast ? '✓' : '●'}</span>
              <span>{step.label}</span>
            </div>
          </React.Fragment>
        );
      })}

      {nextStatus && (
        <button
          onClick={() => onAdvance(nextStatus)}
          className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded-full hover:bg-blue-50 transition-colors"
        >
          → {STEPS.find(s => s.key === nextStatus)?.label} に進める
        </button>
      )}
    </div>
  );
};
