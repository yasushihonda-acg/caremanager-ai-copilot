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
      {/* 第1表記載事項 */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-3">
        <div className="text-xs font-bold text-stone-600 border-b border-stone-200 pb-1">
          第1表記載事項
        </div>

        {/* 計画作成日 / 初回計画作成日 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-1">
              居宅サービス計画作成（変更）日
            </label>
            <input
              type="date"
              className="w-full p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900"
              value={plan.planCreationDate ?? ''}
              onChange={e => onUpdatePlan({ planCreationDate: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-1">
              初回居宅サービス計画作成日
            </label>
            <input
              type="date"
              className="w-full p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900"
              value={plan.firstPlanDate ?? ''}
              onChange={e => onUpdatePlan({ firstPlanDate: e.target.value || undefined })}
            />
          </div>
        </div>

        {/* 初回・紹介・継続 / 認定済・申請中 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-1">
              初回・紹介・継続
            </label>
            <div className="flex gap-3">
              {(['初回', '紹介', '継続'] as const).map(v => (
                <label key={v} className="flex items-center gap-1 text-sm text-stone-700 cursor-pointer">
                  <input
                    type="radio"
                    name="planType"
                    value={v}
                    checked={plan.planType === v}
                    onChange={() => onUpdatePlan({ planType: v })}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-1">
              認定済・申請中
            </label>
            <div className="flex gap-3">
              {(['認定済', '申請中'] as const).map(v => (
                <label key={v} className="flex items-center gap-1 text-sm text-stone-700 cursor-pointer">
                  <input
                    type="radio"
                    name="certificationStatus"
                    value={v}
                    checked={plan.certificationStatus === v}
                    onChange={() => onUpdatePlan({ certificationStatus: v })}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 認定審査会の意見 */}
        <div>
          <label className="text-xs font-bold text-stone-500 block mb-1">
            認定審査会の意見及びサービスの種類の指定
          </label>
          <textarea
            className="w-full p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900 min-h-[48px]"
            value={plan.reviewOpinion ?? ''}
            onChange={e => onUpdatePlan({ reviewOpinion: e.target.value || undefined })}
            placeholder="なし（記載がない場合は「なし」）"
          />
        </div>

        {/* 生活援助中心型の算定理由 */}
        <div>
          <label className="text-xs font-bold text-stone-500 block mb-1">
            生活援助中心型の算定理由
          </label>
          <div className="flex flex-wrap gap-3">
            {([
              { value: '1', label: '①一人暮らし' },
              { value: '2', label: '②家族等が障害・疾病等' },
              { value: '3', label: '③その他' },
            ] as const).map(opt => (
              <label key={opt.value} className="flex items-center gap-1 text-sm text-stone-700 cursor-pointer">
                <input
                  type="radio"
                  name="lifeAssistanceReason"
                  value={opt.value}
                  checked={plan.lifeAssistanceReason === opt.value}
                  onChange={() => onUpdatePlan({ lifeAssistanceReason: opt.value })}
                />
                {opt.label}
              </label>
            ))}
            <label className="flex items-center gap-1 text-sm text-stone-700 cursor-pointer">
              <input
                type="radio"
                name="lifeAssistanceReason"
                value=""
                checked={!plan.lifeAssistanceReason}
                onChange={() => onUpdatePlan({ lifeAssistanceReason: '' })}
              />
              該当なし
            </label>
          </div>
          {plan.lifeAssistanceReason === '3' && (
            <input
              type="text"
              className="mt-1.5 w-full p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900 placeholder:text-stone-400"
              placeholder="その他の理由を入力..."
              value={plan.lifeAssistanceReasonOther ?? ''}
              onChange={e => onUpdatePlan({ lifeAssistanceReasonOther: e.target.value || undefined })}
            />
          )}
        </div>
      </div>

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
