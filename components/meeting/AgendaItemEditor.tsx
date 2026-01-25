import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import type { MeetingAgendaItem } from '../../types';

interface AgendaItemEditorProps {
  item: MeetingAgendaItem;
  index: number;
  onChange: (updated: MeetingAgendaItem) => void;
  onRemove: () => void;
}

export const AgendaItemEditor: React.FC<AgendaItemEditorProps> = ({
  item,
  index,
  onChange,
  onRemove,
}) => {
  const handleChange = (field: keyof MeetingAgendaItem, value: string) => {
    onChange({ ...item, [field]: value });
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 text-gray-400 pt-1">
          <GripVertical className="w-4 h-4" />
          <span className="text-sm font-bold">{index + 1}</span>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              検討項目
            </label>
            <input
              type="text"
              value={item.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              placeholder="例: 入浴サービスの頻度について"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              検討内容
            </label>
            <textarea
              value={item.discussion}
              onChange={(e) => handleChange('discussion', e.target.value)}
              placeholder="各担当者からの意見・検討された内容"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                結論
              </label>
              <textarea
                value={item.conclusion}
                onChange={(e) => handleChange('conclusion', e.target.value)}
                placeholder="検討の結果・決定事項"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                担当者/事業所
              </label>
              <input
                type="text"
                value={item.responsible || ''}
                onChange={(e) => handleChange('responsible', e.target.value)}
                placeholder="担当する事業所・担当者名"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AgendaItemEditor;
