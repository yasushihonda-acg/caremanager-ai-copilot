import React from 'react';
import type { GoalEvaluationStatus } from '../../types';

interface PreviousEvaluation {
  status: GoalEvaluationStatus;
  observation: string;
}

interface GoalEvaluationDiffProps {
  goalContent: string;
  status: GoalEvaluationStatus;
  observation: string;
  previousEvaluation?: PreviousEvaluation;
  onStatusChange: (status: GoalEvaluationStatus) => void;
  onObservationChange: (observation: string) => void;
  showDiff?: boolean;
}

const statusOptions: { value: GoalEvaluationStatus; label: string; color: string; order: number }[] = [
  { value: 'achieved', label: '達成', color: 'bg-green-100 text-green-800 border-green-300', order: 4 },
  { value: 'progressing', label: '改善傾向', color: 'bg-blue-100 text-blue-800 border-blue-300', order: 3 },
  { value: 'unchanged', label: '変化なし', color: 'bg-gray-100 text-gray-800 border-gray-300', order: 2 },
  { value: 'declined', label: '悪化傾向', color: 'bg-red-100 text-red-800 border-red-300', order: 1 },
  { value: 'not_evaluated', label: '未評価', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', order: 0 },
];

const getStatusOption = (status: GoalEvaluationStatus) =>
  statusOptions.find((o) => o.value === status) || statusOptions[4];

type StatusChange = 'improved' | 'declined' | 'unchanged' | 'new';

const getStatusChange = (
  current: GoalEvaluationStatus,
  previous?: GoalEvaluationStatus
): StatusChange => {
  if (!previous || previous === 'not_evaluated') return 'new';

  const currentOrder = getStatusOption(current).order;
  const previousOrder = getStatusOption(previous).order;

  if (currentOrder > previousOrder) return 'improved';
  if (currentOrder < previousOrder) return 'declined';
  return 'unchanged';
};

const statusChangeDisplay: Record<StatusChange, { icon: string; color: string; label: string }> = {
  improved: { icon: '↑', color: 'text-green-600 bg-green-50', label: '改善' },
  declined: { icon: '↓', color: 'text-red-600 bg-red-50', label: '悪化' },
  unchanged: { icon: '→', color: 'text-gray-500 bg-gray-50', label: '継続' },
  new: { icon: '✦', color: 'text-blue-600 bg-blue-50', label: '新規' },
};

export const GoalEvaluationDiff: React.FC<GoalEvaluationDiffProps> = ({
  goalContent,
  status,
  observation,
  previousEvaluation,
  onStatusChange,
  onObservationChange,
  showDiff = true,
}) => {
  const hasPrevious = previousEvaluation !== undefined;
  const statusChange = showDiff
    ? getStatusChange(status, previousEvaluation?.status)
    : 'new';
  const changeDisplay = statusChangeDisplay[statusChange];

  const handleCopyPreviousObservation = () => {
    if (previousEvaluation?.observation) {
      onObservationChange(previousEvaluation.observation);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* 目標内容とステータス変化表示 */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1">
          <span className="text-sm text-gray-500">目標:</span>
          <p className="text-gray-900 font-medium">{goalContent}</p>
        </div>
        {showDiff && hasPrevious && (
          <span
            className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${changeDisplay.color}`}
          >
            <span className="font-bold">{changeDisplay.icon}</span>
            {changeDisplay.label}
          </span>
        )}
      </div>

      {/* 評価ステータス選択 */}
      <div className="mb-3">
        <label className="block text-sm text-gray-500 mb-2">評価:</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={`px-3 py-1 rounded-full text-sm border transition-all ${
                status === option.value
                  ? `${option.color} ring-2 ring-offset-1 ring-blue-500`
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 前回ステータスの表示 */}
        {showDiff && hasPrevious && previousEvaluation.status !== 'not_evaluated' && (
          <div className="mt-2 text-xs text-gray-500">
            📋 前回評価: {getStatusOption(previousEvaluation.status).label}
          </div>
        )}
      </div>

      {/* 観察内容 */}
      <div>
        <label className="block text-sm text-gray-500 mb-1">観察内容・変化の詳細:</label>
        <textarea
          value={observation}
          onChange={(e) => onObservationChange(e.target.value)}
          placeholder="具体的な状態や変化を記録..."
          className={`w-full px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            showDiff && hasPrevious && observation !== previousEvaluation?.observation
              ? 'border-amber-400 bg-amber-50'
              : 'border-gray-300'
          }`}
          rows={2}
        />

        {/* 前回観察内容の表示 */}
        {showDiff && hasPrevious && previousEvaluation.observation && (
          <div className="mt-2 flex items-start gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
            <span className="flex-shrink-0 text-gray-500 text-xs mt-0.5">📋 前回:</span>
            <p className="flex-1 text-sm text-gray-600 whitespace-pre-wrap break-words">
              {previousEvaluation.observation}
            </p>
            <button
              type="button"
              onClick={handleCopyPreviousObservation}
              className="flex-shrink-0 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              コピー
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalEvaluationDiff;
