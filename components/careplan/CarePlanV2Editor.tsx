import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { CarePlan, CarePlanNeed } from '../../types';
import { NeedEditor } from './NeedEditor';

interface Props {
  plan: CarePlan;
  onUpdatePlan: (updates: Partial<CarePlan>) => void;
}

export const CarePlanV2Editor: React.FC<Props> = ({ plan, onUpdatePlan }) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const needs = plan.needs ?? [];

  const updateNeeds = (newNeeds: CarePlanNeed[]) => {
    // V1フィールドも同期（後方互換）
    const v1LongTerm = newNeeds.length > 0 ? newNeeds[0].longTermGoal : '';
    const v1ShortTerms = newNeeds.flatMap(n => n.shortTermGoals);
    onUpdatePlan({
      needs: newNeeds,
      longTermGoal: v1LongTerm,
      shortTermGoals: v1ShortTerms,
    });
  };

  const handleChangeNeed = (idx: number, updated: CarePlanNeed) => {
    const newNeeds = needs.map((n, i) => (i === idx ? updated : n));
    updateNeeds(newNeeds);
  };

  const handleDeleteNeed = (idx: number) => {
    const newNeeds = needs.filter((_, i) => i !== idx);
    updateNeeds(newNeeds);
    setExpandedIdx(prev => {
      if (prev === null) return null;
      if (prev === idx) return null;
      if (prev > idx) return prev - 1;
      return prev;
    });
  };

  const handleAddNeed = () => {
    const newNeed: CarePlanNeed = {
      id: crypto.randomUUID(),
      content: '',
      longTermGoal: '',
      shortTermGoals: [],
      services: [],
    };
    const newNeeds = [...needs, newNeed];
    updateNeeds(newNeeds);
    setExpandedIdx(newNeeds.length - 1);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* 総合的な援助の方針 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <label className="text-xs font-bold text-blue-700 block mb-1">
          総合的な援助の方針
        </label>
        <textarea
          className="w-full p-2 text-sm bg-white border border-blue-200 rounded-lg text-blue-900 min-h-[64px] focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          value={plan.totalDirectionPolicy ?? ''}
          onChange={e => onUpdatePlan({ totalDirectionPolicy: e.target.value })}
          placeholder="総合的な援助の方針を入力..."
        />
      </div>

      {/* ニーズ別アコーディオン */}
      {needs.map((need, idx) => (
        <NeedEditor
          key={need.id}
          need={need}
          index={idx}
          isExpanded={expandedIdx === idx}
          onToggleExpand={() => setExpandedIdx(prev => prev === idx ? null : idx)}
          onChange={updated => handleChangeNeed(idx, updated)}
          onDelete={() => handleDeleteNeed(idx)}
        />
      ))}

      {/* ニーズ追加ボタン */}
      <button
        onClick={handleAddNeed}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
        ニーズを追加
      </button>
    </div>
  );
};
