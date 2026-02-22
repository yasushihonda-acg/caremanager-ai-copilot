import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  variant?: 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  showCancel = true,
  variant = 'info',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const Icon = isDanger ? AlertTriangle : Info;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${
                isDanger ? 'bg-red-100' : 'bg-blue-100'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isDanger ? 'text-red-600' : 'text-blue-600'}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-stone-800">{title}</h3>
              <p className="mt-1 text-sm text-stone-600 whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          {showCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors min-h-[44px]"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-lg transition-colors min-h-[44px] ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
