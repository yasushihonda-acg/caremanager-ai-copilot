import React, { useState, useEffect } from 'react';
import { listSupportRecords, deleteSupportRecord, type SupportRecordDocument } from '../../services/firebase';
import type { SupportRecordType } from '../../types';

interface SupportRecordListProps {
  userId: string;
  onEdit?: (recordId: string) => void;
  onAdd?: () => void;
}

const recordTypeLabels: Record<SupportRecordType, string> = {
  phone_call: '電話',
  home_visit: '訪問',
  office_visit: '来所',
  service_coordination: '調整',
  meeting: '会議',
  document: '書類',
  other: 'その他',
};

const recordTypeColors: Record<SupportRecordType, string> = {
  phone_call: 'bg-blue-100 text-blue-800',
  home_visit: 'bg-green-100 text-green-800',
  office_visit: 'bg-purple-100 text-purple-800',
  service_coordination: 'bg-yellow-100 text-yellow-800',
  meeting: 'bg-red-100 text-red-800',
  document: 'bg-gray-100 text-gray-800',
  other: 'bg-gray-100 text-gray-600',
};

export const SupportRecordList: React.FC<SupportRecordListProps> = ({
  userId,
  onEdit,
  onAdd,
}) => {
  const [records, setRecords] = useState<SupportRecordDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, [userId]);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSupportRecords(userId, 50);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load support records:', err);
      setError('記録の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('この記録を削除しますか？')) return;

    try {
      await deleteSupportRecord(userId, recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err) {
      console.error('Failed to delete record:', err);
      alert('削除に失敗しました');
    }
  };

  const formatDate = (timestamp: { toDate: () => Date }) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
        <button
          onClick={loadRecords}
          className="ml-2 underline hover:no-underline"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">支援経過記録（第5表）</h2>
        {onAdd && (
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規記録
          </button>
        )}
      </div>

      {/* 記録一覧 */}
      {records.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>支援経過記録がありません</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-2 text-blue-600 hover:underline"
            >
              最初の記録を作成する
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              {/* ヘッダー行 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      recordTypeColors[record.recordType]
                    }`}
                  >
                    {recordTypeLabels[record.recordType]}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(record.recordDate)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(record.id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      編集
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    削除
                  </button>
                </div>
              </div>

              {/* 対象者 */}
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">{record.actor || '担当ケアマネ'}</span>
                {record.counterpart && (
                  <>
                    <span className="mx-1">→</span>
                    <span>{record.counterpart}</span>
                  </>
                )}
              </div>

              {/* 内容 */}
              <p className="text-gray-800 whitespace-pre-wrap text-sm">
                {record.content}
              </p>

              {/* 結果 */}
              {record.result && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">結果: </span>
                    {record.result}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportRecordList;
