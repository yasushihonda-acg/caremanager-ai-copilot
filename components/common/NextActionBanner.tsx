import React from 'react';
import { ArrowRight, X } from 'lucide-react';

interface NextActionBannerProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
  variant?: 'success' | 'info';
}

export const NextActionBanner: React.FC<NextActionBannerProps> = ({
  message,
  actionLabel,
  onAction,
  onDismiss,
  variant = 'success',
}) => {
  const colors =
    variant === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : 'bg-blue-50 border-blue-200 text-blue-800';

  const btnColors =
    variant === 'success'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${colors}`}>
      <p className="text-sm font-medium flex-1">{message}</p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onAction}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-h-[44px] ${btnColors}`}
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded hover:bg-black/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="閉じる"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
