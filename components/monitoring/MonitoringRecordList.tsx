import React, { useState, useEffect } from 'react';
import { Calendar, Activity, Trash2, ChevronRight, CheckCircle, AlertCircle, MinusCircle } from 'lucide-react';
import {
  listMonitoringRecords,
  listMonitoringRecordsByCarePlan,
  deleteMonitoringRecord,
  type MonitoringRecordDocument,
} from '../../services/firebase';

interface MonitoringRecordListProps {
  userId: string;
  clientId: string;
  carePlanId?: string;
  onSelect?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
}

const visitMethodLabels: Record<string, string> = {
  home_visit: '居宅訪問',
  online: 'オンライン',
  phone: '電話',
};

export const MonitoringRecordList: React.FC<MonitoringRecordListProps> = ({
  userId,
  clientId,
  carePlanId,
  onSelect,
  onDelete,
}) => {
  const [records, setRecords] = useState<MonitoringRecordDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, [userId, clientId, carePlanId]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const list = carePlanId
        ? await listMonitoringRecordsByCarePlan(userId, clientId, carePlanId)
        : await listMonitoringRecords(userId, clientId);
      setRecords(list);
    } catch (error) {
      console.error('Failed to load monitoring records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('この記録を削除してもよろしいですか？')) {
      return;
    }
    setDeletingId(recordId);
    try {
      await deleteMonitoringRecord(userId, clientId, recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (onDelete) {
        onDelete(recordId);
      }
    } catch (error) {
      console.error('Failed to delete monitoring record:', error);
      alert('削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  // 目標評価のサマリーを計算
  const getEvaluationSummary = (record: MonitoringRecordDocument) => {
    const counts: Record<string, number> = {};
    record.goalEvaluations.forEach((e) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return counts;
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
        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">モニタリング記録がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const visitDate = record.visitDate.toDate();
        const summary = getEvaluationSummary(record);

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
                    {visitMethodLabels[record.visitMethod] || record.visitMethod}
                  </span>
                  {record.needsPlanRevision && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      見直し要
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {visitDate.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {summary.achieved > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-green-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{summary.achieved}</span>
                      </span>
                    )}
                    {summary.progressing > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-blue-600">
                        <Activity className="w-3.5 h-3.5" />
                        <span className="text-xs">{summary.progressing}</span>
                      </span>
                    )}
                    {summary.declined > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-red-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{summary.declined}</span>
                      </span>
                    )}
                    {summary.unchanged > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-gray-500">
                        <MinusCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{summary.unchanged}</span>
                      </span>
                    )}
                  </div>
                </div>

                {record.overallCondition && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">全体的な状態:</p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {record.overallCondition}
                    </p>
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

export default MonitoringRecordList;
