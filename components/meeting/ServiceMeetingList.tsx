import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Trash2, ChevronRight } from 'lucide-react';
import {
  listServiceMeetingRecords,
  listServiceMeetingRecordsByCarePlan,
  deleteServiceMeetingRecord,
  type ServiceMeetingRecordDocument,
} from '../../services/firebase';

interface ServiceMeetingListProps {
  userId: string;
  carePlanId?: string;
  onSelect?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
}

const formatLabel: Record<string, string> = {
  in_person: '対面',
  online: 'オンライン',
  hybrid: 'ハイブリッド',
};

export const ServiceMeetingList: React.FC<ServiceMeetingListProps> = ({
  userId,
  carePlanId,
  onSelect,
  onDelete,
}) => {
  const [records, setRecords] = useState<ServiceMeetingRecordDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, [userId, carePlanId]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const list = carePlanId
        ? await listServiceMeetingRecordsByCarePlan(userId, carePlanId)
        : await listServiceMeetingRecords(userId);
      setRecords(list);
    } catch (error) {
      console.error('Failed to load meeting records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    setDeletingId(recordId);
    try {
      await deleteServiceMeetingRecord(userId, recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (onDelete) {
        onDelete(recordId);
      }
    } catch (error) {
      console.error('Failed to delete meeting record:', error);
      alert('削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 text-sm">読み込み中...</span>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">会議記録がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const meetingDate = record.meetingDate.toDate();
        const attendeeCount = record.attendees.length;
        const presentCount = record.attendees.filter((a) => a.attended).length;

        return (
          <div
            key={record.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onSelect && onSelect(record.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {record.meetingPurpose}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {formatLabel[record.meetingFormat] || record.meetingFormat}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {meetingDate.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                      {' '}
                      {meetingDate.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{record.meetingLocation || '未設定'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>
                      出席 {presentCount}/{attendeeCount}名
                      {record.userAttended && ' + 利用者'}
                      {record.familyAttended && ' + 家族'}
                    </span>
                  </div>
                </div>

                {record.agendaItems.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">検討事項:</p>
                    <ul className="text-sm text-gray-700">
                      {record.agendaItems.slice(0, 2).map((item) => (
                        <li key={item.id} className="truncate">
                          - {item.topic}
                        </li>
                      ))}
                      {record.agendaItems.length > 2 && (
                        <li className="text-gray-400 text-xs">
                          他 {record.agendaItems.length - 2} 件
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleDelete(record.id)}
                  disabled={deletingId === record.id}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {onSelect && (
                  <button
                    onClick={() => onSelect(record.id)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ServiceMeetingList;
