import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X, RefreshCw } from 'lucide-react';
import type { CarePlanReviewResult, CarePlanReviewItem, ReviewSeverity } from '../../types';

interface CarePlanReviewPanelProps {
  result: CarePlanReviewResult;
  isLoading: boolean;
  onReview: () => void;
  onClose: () => void;
}

const SEVERITY_CONFIG: Record<ReviewSeverity, {
  icon: React.ReactNode;
  label: string;
  rowClass: string;
  badgeClass: string;
}> = {
  ok: {
    icon: <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />,
    label: 'OK',
    rowClass: 'border-green-100 bg-green-50',
    badgeClass: 'bg-green-100 text-green-700',
  },
  info: {
    icon: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
    label: '参考',
    rowClass: 'border-blue-100 bg-blue-50',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    label: '要確認',
    rowClass: 'border-amber-100 bg-amber-50',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  error: {
    icon: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    label: '修正推奨',
    rowClass: 'border-red-100 bg-red-50',
    badgeClass: 'bg-red-100 text-red-700',
  },
};

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 90 ? 'text-green-600' :
    score >= 75 ? 'text-blue-600' :
    score >= 60 ? 'text-amber-600' :
    'text-red-600';

  const barColor =
    score >= 90 ? 'bg-green-500' :
    score >= 75 ? 'bg-blue-500' :
    score >= 60 ? 'bg-amber-500' :
    'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <div className="flex-1">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-700`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">/ 100点</p>
      </div>
    </div>
  );
}

function ReviewItemCard({ item }: { item: CarePlanReviewItem }) {
  const config = SEVERITY_CONFIG[item.severity];
  return (
    <div className={`border rounded-lg p-3 ${config.rowClass}`}>
      <div className="flex items-start gap-2">
        {config.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${config.badgeClass}`}>
              {config.label}
            </span>
            <span className="text-xs font-medium text-gray-500">{item.category}</span>
            <span className="text-xs text-gray-400">｜ {item.target}</span>
          </div>
          <p className="text-sm text-gray-800">{item.message}</p>
          {item.suggestion && (
            <p className="text-xs text-gray-600 mt-1 pl-2 border-l-2 border-gray-300">
              💡 {item.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export const CarePlanReviewPanel: React.FC<CarePlanReviewPanelProps> = ({
  result,
  isLoading,
  onReview,
  onClose,
}) => {
  const errorCount = result.items.filter((i) => i.severity === 'error').length;
  const warningCount = result.items.filter((i) => i.severity === 'warning').length;

  return (
    <div className="bg-white border border-violet-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100 bg-violet-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-violet-900">AI点検結果</span>
          <span className="text-xs text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
            {new Date(result.checkedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 点検
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReview}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 disabled:opacity-50 px-2 py-1 hover:bg-violet-100 rounded"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            再点検
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-violet-100 rounded text-violet-500 hover:text-violet-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* スコア + サマリー */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="min-w-[120px]">
            <p className="text-xs text-gray-500 mb-1">総合スコア</p>
            <ScoreGauge score={result.overallScore} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">総合評価</p>
            <p className="text-sm text-gray-800">{result.overallComment}</p>
            {(errorCount > 0 || warningCount > 0) && (
              <div className="flex gap-2 mt-2">
                {errorCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    修正推奨 {errorCount}件
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    要確認 {warningCount}件
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 個別指摘 */}
      <div className="px-4 py-3 space-y-2 max-h-80 overflow-y-auto">
        {result.items.map((item, idx) => (
          <ReviewItemCard key={idx} item={item} />
        ))}
      </div>
    </div>
  );
};
