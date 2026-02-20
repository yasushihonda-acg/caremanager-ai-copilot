import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Plus } from 'lucide-react';
import type { CarePlanNeed, CareGoal, CarePlanService } from '../../types';

interface Props {
  need: CarePlanNeed;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (updated: CarePlanNeed) => void;
  onDelete: () => void;
}

const GOAL_STATUS_OPTIONS: { value: CareGoal['status']; label: string }[] = [
  { value: 'not_started', label: '未着手' },
  { value: 'in_progress', label: '取組中' },
  { value: 'achieved',    label: '達成' },
  { value: 'discontinued', label: '中止' },
];

export const NeedEditor: React.FC<Props> = ({
  need,
  index,
  isExpanded,
  onToggleExpand,
  onChange,
  onDelete,
}) => {
  const [newGoalText, setNewGoalText] = useState('');
  const [newServiceContent, setNewServiceContent] = useState('');
  const [newServiceType, setNewServiceType] = useState('');
  const [newServiceFreq, setNewServiceFreq] = useState('');

  const updateNeed = (partial: Partial<CarePlanNeed>) => {
    onChange({ ...need, ...partial });
  };

  const updateGoal = (goalId: string, partial: Partial<CareGoal>) => {
    updateNeed({
      shortTermGoals: need.shortTermGoals.map(g =>
        g.id === goalId ? { ...g, ...partial } : g
      ),
    });
  };

  const deleteGoal = (goalId: string) => {
    updateNeed({ shortTermGoals: need.shortTermGoals.filter(g => g.id !== goalId) });
  };

  const addGoal = () => {
    if (!newGoalText.trim()) return;
    const newGoal: CareGoal = {
      id: crypto.randomUUID(),
      content: newGoalText.trim(),
      status: 'not_started',
    };
    updateNeed({ shortTermGoals: [...need.shortTermGoals, newGoal] });
    setNewGoalText('');
  };

  const updateService = (svcId: string, partial: Partial<CarePlanService>) => {
    updateNeed({
      services: need.services.map(s =>
        s.id === svcId ? { ...s, ...partial } : s
      ),
    });
  };

  const deleteService = (svcId: string) => {
    updateNeed({ services: need.services.filter(s => s.id !== svcId) });
  };

  const addService = () => {
    if (!newServiceContent.trim()) return;
    const newSvc: CarePlanService = {
      id: crypto.randomUUID(),
      content: newServiceContent.trim(),
      type: newServiceType.trim(),
      frequency: newServiceFreq.trim(),
    };
    updateNeed({ services: [...need.services, newSvc] });
    setNewServiceContent('');
    setNewServiceType('');
    setNewServiceFreq('');
  };

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      {/* ヘッダー行（折りたたみ/展開） */}
      <div className="bg-stone-50 px-3 py-2 flex items-center gap-2">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full shrink-0">
            ニーズ{index + 1}
          </span>
          <span className="text-sm font-medium text-stone-800 truncate">
            {need.content || '（ニーズ内容を入力してください）'}
          </span>
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-stone-400 shrink-0 ml-auto" />
            : <ChevronRight className="w-4 h-4 text-stone-400 shrink-0 ml-auto" />
          }
        </button>
        <button
          onClick={onDelete}
          className="text-stone-400 hover:text-red-500 p-1 shrink-0"
          title="このニーズを削除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 展開時の編集フォーム */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* ニーズ内容 */}
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-1">
              ニーズ（生活全般の課題）
            </label>
            <textarea
              className="w-full p-2 text-sm border border-stone-300 rounded-lg bg-white text-stone-900 min-h-[60px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={need.content}
              onChange={e => updateNeed({ content: e.target.value })}
              placeholder="生活上の課題や希望を入力..."
            />
          </div>

          {/* 長期目標 */}
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-1">
              長期目標（6ヶ月〜1年）
            </label>
            <textarea
              className="w-full p-2 text-sm border border-stone-300 rounded-lg bg-white text-stone-900 min-h-[60px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={need.longTermGoal}
              onChange={e => updateNeed({ longTermGoal: e.target.value })}
              placeholder="長期目標を入力..."
            />
            <div className="flex gap-2 mt-1">
              <div className="flex items-center gap-1">
                <label className="text-xs text-stone-500 shrink-0">期間:</label>
                <input
                  type="date"
                  className="text-xs p-1 border border-stone-300 rounded bg-white text-stone-700"
                  value={need.longTermGoalStartDate ?? ''}
                  onChange={e => updateNeed({ longTermGoalStartDate: e.target.value || undefined })}
                />
                <span className="text-xs text-stone-400">〜</span>
                <input
                  type="date"
                  className="text-xs p-1 border border-stone-300 rounded bg-white text-stone-700"
                  value={need.longTermGoalEndDate ?? ''}
                  onChange={e => updateNeed({ longTermGoalEndDate: e.target.value || undefined })}
                />
              </div>
            </div>
          </div>

          {/* 短期目標 */}
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-2">
              短期目標
            </label>
            <div className="space-y-2 mb-2">
              {need.shortTermGoals.map(g => (
                <div key={g.id} className="bg-stone-50 border border-stone-200 p-2 rounded-lg">
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      className="flex-1 text-sm bg-transparent border-none outline-none text-stone-800"
                      value={g.content}
                      onChange={e => updateGoal(g.id, { content: e.target.value })}
                      placeholder="短期目標の内容"
                    />
                    <select
                      className="text-xs border border-stone-300 rounded bg-white text-stone-700 px-1 py-0.5"
                      value={g.status}
                      onChange={e => updateGoal(g.id, { status: e.target.value as CareGoal['status'] })}
                    >
                      {GOAL_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="text-stone-400 hover:text-red-500 p-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-stone-500 shrink-0">期間:</span>
                    <input
                      type="date"
                      className="text-xs p-0.5 border border-stone-300 rounded bg-white text-stone-700"
                      value={g.startDate ?? ''}
                      onChange={e => updateGoal(g.id, { startDate: e.target.value || undefined })}
                    />
                    <span className="text-xs text-stone-400">〜</span>
                    <input
                      type="date"
                      className="text-xs p-0.5 border border-stone-300 rounded bg-white text-stone-700"
                      value={g.endDate ?? ''}
                      onChange={e => updateGoal(g.id, { endDate: e.target.value || undefined })}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* 短期目標追加 */}
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-1.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-900 placeholder:text-stone-400"
                placeholder="短期目標を追加..."
                value={newGoalText}
                onChange={e => setNewGoalText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGoal()}
              />
              <button
                onClick={addGoal}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-3 h-3" />追加
              </button>
            </div>
          </div>

          {/* サービス内容 */}
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-2">
              サービス内容
            </label>
            <div className="space-y-2 mb-2">
              {need.services.map(s => (
                <div key={s.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center bg-stone-50 border border-stone-200 p-2 rounded-lg">
                  <input
                    type="text"
                    className="text-sm bg-transparent border-none outline-none text-stone-800 col-span-4"
                    value={s.content}
                    onChange={e => updateService(s.id, { content: e.target.value })}
                    placeholder="サービス内容"
                  />
                  <input
                    type="text"
                    className="text-xs border border-stone-300 rounded bg-white text-stone-700 px-1.5 py-0.5"
                    value={s.type}
                    onChange={e => updateService(s.id, { type: e.target.value })}
                    placeholder="種別"
                  />
                  <input
                    type="text"
                    className="text-xs border border-stone-300 rounded bg-white text-stone-700 px-1.5 py-0.5"
                    value={s.frequency}
                    onChange={e => updateService(s.id, { frequency: e.target.value })}
                    placeholder="頻度"
                  />
                  <button
                    onClick={() => deleteService(s.id)}
                    className="text-stone-400 hover:text-red-500 p-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {/* サービス追加 */}
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                className="flex-1 min-w-[120px] p-1.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-900 placeholder:text-stone-400"
                placeholder="サービス内容"
                value={newServiceContent}
                onChange={e => setNewServiceContent(e.target.value)}
              />
              <input
                type="text"
                className="w-24 p-1.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-900 placeholder:text-stone-400"
                placeholder="種別"
                value={newServiceType}
                onChange={e => setNewServiceType(e.target.value)}
              />
              <input
                type="text"
                className="w-20 p-1.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-900 placeholder:text-stone-400"
                placeholder="頻度"
                value={newServiceFreq}
                onChange={e => setNewServiceFreq(e.target.value)}
              />
              <button
                onClick={addService}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-3 h-3" />追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
