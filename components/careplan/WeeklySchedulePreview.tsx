import React from 'react';
import type { WeeklySchedule, DayOfWeek } from '../../types';

interface Props {
  schedule: WeeklySchedule;
  compact?: boolean;
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

const SERVICE_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-green-100 text-green-800 border-green-300',
  'bg-purple-100 text-purple-800 border-purple-300',
  'bg-orange-100 text-orange-800 border-orange-300',
  'bg-pink-100 text-pink-800 border-pink-300',
  'bg-teal-100 text-teal-800 border-teal-300',
  'bg-yellow-100 text-yellow-800 border-yellow-300',
];

export const WeeklySchedulePreview: React.FC<Props> = ({ schedule, compact = false }) => {
  if (schedule.entries.length === 0 && !schedule.mainActivities && !schedule.weeklyNote) {
    return (
      <p className="text-xs text-stone-400 italic">週間サービス計画が未入力です。</p>
    );
  }

  return (
    <div className={`space-y-4 ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* 主な日常生活上の活動 */}
      {schedule.mainActivities && (
        <div>
          <span className="font-bold text-stone-600 block mb-1">主な日常生活上の活動</span>
          <p className="text-stone-700 whitespace-pre-wrap">{schedule.mainActivities}</p>
        </div>
      )}

      {/* 曜日マトリックス */}
      {schedule.entries.length > 0 && (
        <div>
          <span className="font-bold text-stone-600 block mb-2">週間スケジュール</span>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-stone-200">
              <thead>
                <tr className="bg-stone-100">
                  <th className="border border-stone-200 px-2 py-1 text-left text-stone-600 font-bold min-w-[120px]">
                    サービス
                  </th>
                  {DAYS.map(d => (
                    <th key={d.key} className={`border border-stone-200 px-2 py-1 text-center font-bold w-10 ${
                      d.key === 'sat' ? 'text-blue-600' : d.key === 'sun' ? 'text-red-600' : 'text-stone-600'
                    }`}>
                      {d.label}
                    </th>
                  ))}
                  <th className="border border-stone-200 px-2 py-1 text-left text-stone-600 font-bold">
                    時間
                  </th>
                  <th className="border border-stone-200 px-2 py-1 text-left text-stone-600 font-bold">
                    頻度
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule.entries.map((entry, idx) => {
                  const colorClass = SERVICE_COLORS[idx % SERVICE_COLORS.length];
                  return (
                    <tr key={entry.id} className="hover:bg-stone-50">
                      <td className="border border-stone-200 px-2 py-1">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
                          {entry.serviceType || '—'}
                        </span>
                        <br />
                        <span className="text-stone-700">{entry.content}</span>
                        {entry.provider && (
                          <span className="text-stone-400 ml-1">({entry.provider})</span>
                        )}
                      </td>
                      {DAYS.map(d => (
                        <td key={d.key} className="border border-stone-200 px-1 py-1 text-center">
                          {entry.days.includes(d.key) ? (
                            <span className={`inline-block w-5 h-5 rounded-full border text-center leading-5 text-xs font-bold ${colorClass}`}>
                              ●
                            </span>
                          ) : null}
                        </td>
                      ))}
                      <td className="border border-stone-200 px-2 py-1 text-stone-600 whitespace-nowrap">
                        {entry.startTime && entry.endTime
                          ? `${entry.startTime}〜${entry.endTime}`
                          : entry.startTime || '—'}
                      </td>
                      <td className="border border-stone-200 px-2 py-1 text-stone-600">
                        {entry.frequency || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 週単位以外のサービス */}
      {schedule.weeklyNote && (
        <div>
          <span className="font-bold text-stone-600 block mb-1">週単位以外のサービス</span>
          <p className="text-stone-700 whitespace-pre-wrap">{schedule.weeklyNote}</p>
        </div>
      )}
    </div>
  );
};
