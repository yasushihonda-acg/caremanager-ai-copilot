import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { WeeklySchedule, WeeklyServiceEntry, DayOfWeek, CarePlanNeed } from '../../types';

interface Props {
  schedule: WeeklySchedule | undefined;
  needs?: CarePlanNeed[];
  onChange: (schedule: WeeklySchedule) => void;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'mon', label: '月' },
  { key: 'tue', label: '火' },
  { key: 'wed', label: '水' },
  { key: 'thu', label: '木' },
  { key: 'fri', label: '金' },
  { key: 'sat', label: '土' },
  { key: 'sun', label: '日' },
];

const EMPTY_SCHEDULE = (): WeeklySchedule => ({
  entries: [],
  mainActivities: '',
  weeklyNote: '',
});

export const WeeklyScheduleEditor: React.FC<Props> = ({ schedule, needs, onChange }) => {
  const ws = schedule ?? EMPTY_SCHEDULE();

  const updateSchedule = (partial: Partial<WeeklySchedule>) => {
    onChange({ ...ws, ...partial });
  };

  const addEntry = () => {
    const newEntry: WeeklyServiceEntry = {
      id: crypto.randomUUID(),
      serviceType: '',
      provider: '',
      content: '',
      days: [],
      startTime: '',
      endTime: '',
      frequency: '',
      notes: '',
    };
    updateSchedule({ entries: [...ws.entries, newEntry] });
  };

  const updateEntry = (id: string, partial: Partial<WeeklyServiceEntry>) => {
    updateSchedule({
      entries: ws.entries.map(e => e.id === id ? { ...e, ...partial } : e),
    });
  };

  const deleteEntry = (id: string) => {
    updateSchedule({ entries: ws.entries.filter(e => e.id !== id) });
  };

  const toggleDay = (entryId: string, day: DayOfWeek) => {
    const entry = ws.entries.find(e => e.id === entryId);
    if (!entry) return;
    const days = entry.days.includes(day)
      ? entry.days.filter(d => d !== day)
      : [...entry.days, day];
    updateEntry(entryId, { days });
  };

  const importFromNeeds = () => {
    if (!needs) return;
    const imported: WeeklyServiceEntry[] = needs.flatMap(need =>
      need.services.map(svc => ({
        id: crypto.randomUUID(),
        serviceType: svc.type,
        provider: '',
        content: svc.content,
        days: [],
        startTime: '',
        endTime: '',
        frequency: svc.frequency,
        notes: '',
      }))
    );
    if (imported.length === 0) return;
    updateSchedule({ entries: [...ws.entries, ...imported] });
  };

  return (
    <div className="space-y-5">
      {/* 主な日常生活上の活動 */}
      <div>
        <label className="text-xs font-bold text-stone-500 block mb-1">
          主な日常生活上の活動
        </label>
        <textarea
          className="w-full p-2 text-sm border border-stone-300 rounded-lg bg-white text-stone-900 min-h-[60px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={ws.mainActivities}
          onChange={e => updateSchedule({ mainActivities: e.target.value })}
          placeholder="例：朝食後に新聞を読む、デイサービスから帰宅後に入浴..."
        />
      </div>

      {/* サービス一覧 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-stone-500">サービス内容</label>
          {needs && needs.some(n => n.services.length > 0) && (
            <button
              onClick={importFromNeeds}
              className="text-xs text-blue-600 border border-blue-300 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
            >
              ケアプランから取り込み
            </button>
          )}
        </div>

        <div className="space-y-3">
          {ws.entries.map(entry => (
            <div key={entry.id} className="border border-stone-200 rounded-lg p-3 space-y-2 bg-stone-50">
              {/* 1行目: 種別・事業所 */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900 placeholder:text-stone-400"
                  placeholder="サービス種別"
                  value={entry.serviceType}
                  onChange={e => updateEntry(entry.id, { serviceType: e.target.value })}
                />
                <input
                  type="text"
                  className="p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900 placeholder:text-stone-400"
                  placeholder="事業所名"
                  value={entry.provider}
                  onChange={e => updateEntry(entry.id, { provider: e.target.value })}
                />
              </div>
              {/* 2行目: 内容・時間 */}
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  className="flex-1 min-w-0 p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900 placeholder:text-stone-400"
                  placeholder="サービス内容"
                  value={entry.content}
                  onChange={e => updateEntry(entry.id, { content: e.target.value })}
                />
                <input
                  type="time"
                  className="w-full sm:w-28 p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900"
                  value={entry.startTime}
                  onChange={e => updateEntry(entry.id, { startTime: e.target.value })}
                />
                <span className="self-center text-stone-400 text-sm">〜</span>
                <input
                  type="time"
                  className="w-full sm:w-28 p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900"
                  value={entry.endTime}
                  onChange={e => updateEntry(entry.id, { endTime: e.target.value })}
                />
              </div>
              {/* 3行目: 曜日トグル */}
              <div className="flex items-center gap-1 flex-wrap">
                {DAYS.map(d => (
                  <button
                    key={d.key}
                    onClick={() => toggleDay(entry.id, d.key)}
                    className={`w-10 h-10 text-xs font-bold rounded-full border transition-colors ${
                      entry.days.includes(d.key)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-stone-500 border-stone-300 hover:border-blue-400'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {/* 4行目: 頻度・備考・削除 */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className="w-32 p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900 placeholder:text-stone-400"
                  placeholder="頻度"
                  value={entry.frequency}
                  onChange={e => updateEntry(entry.id, { frequency: e.target.value })}
                />
                <input
                  type="text"
                  className="flex-1 p-1.5 text-sm border border-stone-300 rounded bg-white text-stone-900 placeholder:text-stone-400"
                  placeholder="備考"
                  value={entry.notes}
                  onChange={e => updateEntry(entry.id, { notes: e.target.value })}
                />
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-stone-400 hover:text-red-500 p-2 shrink-0"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addEntry}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          サービスを追加
        </button>
      </div>

      {/* 週単位以外のサービス */}
      <div>
        <label className="text-xs font-bold text-stone-500 block mb-1">
          週単位以外のサービス
        </label>
        <textarea
          className="w-full p-2 text-sm border border-stone-300 rounded-lg bg-white text-stone-900 min-h-[60px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={ws.weeklyNote}
          onChange={e => updateSchedule({ weeklyNote: e.target.value })}
          placeholder="例：月1回の往診、3ヶ月ごとの認定更新..."
        />
      </div>
    </div>
  );
};
