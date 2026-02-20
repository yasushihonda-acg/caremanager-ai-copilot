import React from 'react';
import type { GoalEvaluationStatus } from '../../types';

interface GoalEvaluationProps {
  goalId: string;
  goalContent: string;
  status: GoalEvaluationStatus;
  observation: string;
  onStatusChange: (status: GoalEvaluationStatus) => void;
  onObservationChange: (observation: string) => void;
}

const statusOptions: { value: GoalEvaluationStatus; label: string; color: string }[] = [
  { value: 'achieved', label: '達成', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'progressing', label: '改善傾向', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'unchanged', label: '変化なし', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { value: 'declined', label: '悪化傾向', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'not_evaluated', label: '未評価', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
];

export const GoalEvaluation: React.FC<GoalEvaluationProps> = ({
  goalContent,
  status,
  observation,
  onStatusChange,
  onObservationChange,
}) => {
  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* 目標内容 */}
      <div className="mb-3">
        <span className="text-sm text-gray-500">目標:</span>
        <p className="text-gray-900 font-medium">{goalContent}</p>
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
              className={`px-3 py-2 rounded-full text-sm border transition-all ${
                status === option.value
                  ? `${option.color} ring-2 ring-offset-1 ring-blue-500`
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 観察内容 */}
      <div>
        <label className="block text-sm text-gray-500 mb-1">観察内容・変化の詳細:</label>
        <textarea
          value={observation}
          onChange={(e) => onObservationChange(e.target.value)}
          placeholder="具体的な状態や変化を記録..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
    </div>
  );
};

export default GoalEvaluation;
