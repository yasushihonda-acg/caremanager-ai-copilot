import React from 'react';
import { Trash2 } from 'lucide-react';
import type { MeetingAttendee } from '../../types';

interface AttendeeEditorProps {
  attendee: MeetingAttendee;
  onChange: (updated: MeetingAttendee) => void;
  onRemove: () => void;
}

export const AttendeeEditor: React.FC<AttendeeEditorProps> = ({
  attendee,
  onChange,
  onRemove,
}) => {
  const handleChange = (field: keyof MeetingAttendee, value: string | boolean) => {
    onChange({ ...attendee, [field]: value });
  };

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
        <input
          type="text"
          value={attendee.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="氏名"
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <input
          type="text"
          value={attendee.organization}
          onChange={(e) => handleChange('organization', e.target.value)}
          placeholder="所属事業所"
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <input
          type="text"
          value={attendee.profession}
          onChange={(e) => handleChange('profession', e.target.value)}
          placeholder="職種"
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={attendee.attended}
              onChange={(e) => handleChange('attended', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">出席</span>
          </label>
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 欠席時の照会情報 */}
      {!attendee.attended && (
        <div className="mt-2 pt-2 border-t border-gray-200 bg-amber-50 -mx-3 -mb-3 p-3 rounded-b-lg">
          <p className="text-xs font-medium text-amber-700 mb-2">照会情報（欠席のため）</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              value={attendee.inquiryMethod || ''}
              onChange={(e) => handleChange('inquiryMethod', e.target.value)}
              placeholder="照会方法（電話/FAX/メール等）"
              className="px-2 py-1 border border-amber-300 rounded text-sm bg-white"
            />
            <input
              type="date"
              value={attendee.inquiryDate || ''}
              onChange={(e) => handleChange('inquiryDate', e.target.value)}
              className="px-2 py-1 border border-amber-300 rounded text-sm bg-white"
            />
            <input
              type="text"
              value={attendee.inquiryResponse || ''}
              onChange={(e) => handleChange('inquiryResponse', e.target.value)}
              placeholder="照会回答内容"
              className="px-2 py-1 border border-amber-300 rounded text-sm bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendeeEditor;
