import React, { useState, useEffect, useMemo } from 'react';
import { listSupportRecords, deleteSupportRecord, type SupportRecordDocument } from '../../services/firebase';
import type { SupportRecordType } from '../../types';

interface SupportRecordListProps {
  userId: string;
  clientId: string;
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

const allRecordTypes = Object.keys(recordTypeLabels) as SupportRecordType[];

export const SupportRecordList: React.FC<SupportRecordListProps> = ({
  userId,
  clientId,
  onEdit,
  onAdd,
}) => {
  const [records, setRecords] = useState<SupportRecordDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルタ状態
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<SupportRecordType[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadRecords();
  }, [userId, clientId]);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSupportRecords(userId, clientId, 50);
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
      await deleteSupportRecord(userId, clientId, recordId);
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

  const toggleTypeFilter = (type: SupportRecordType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedTypes([]);
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchText || selectedTypes.length > 0 || dateFrom || dateTo;

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // テキスト検索（内容・結果・相手先）
      if (searchText) {
        const lower = searchText.toLowerCase();
        const matchContent = record.content?.toLowerCase().includes(lower);
        const matchResult = record.result?.toLowerCase().includes(lower);
        const matchCounterpart = record.counterpart?.toLowerCase().includes(lower);
        if (!matchContent && !matchResult && !matchCounterpart) return false;
      }

      // 記録タイプフィルタ
      if (selectedTypes.length > 0 && !selectedTypes.includes(record.recordType)) {
        return false;
      }

      // 日付範囲フィルタ
      if (dateFrom || dateTo) {
        const recordDate = record.recordDate.toDate();
        if (dateFrom && recordDate < new Date(dateFrom)) return false;
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (recordDate > toDate) return false;
        }
      }

      return true;
    });
  }, [records, searchText, selectedTypes, dateFrom, dateTo]);

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
        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors flex items-center gap-1 ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              検索・フィルタ
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {(searchText ? 1 : 0) + (selectedTypes.length > 0 ? 1 : 0) + (dateFrom || dateTo ? 1 : 0)}
                </span>
              )}
            </button>
          )}
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
      </div>

      {/* フィルタパネル */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
          {/* テキスト検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">キーワード検索</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="内容・結果・相手先で検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 記録タイプフィルタ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">記録タイプ</label>
            <div className="flex flex-wrap gap-2">
              {allRecordTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                    selectedTypes.includes(type)
                      ? `${recordTypeColors[type]} border-current`
                      : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {recordTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* 日付範囲 */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="pb-2 text-gray-400">〜</span>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* クリアボタン */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                フィルタをクリア
              </button>
            </div>
          )}
        </div>
      )}

      {/* 結果件数 */}
      {hasActiveFilters && (
        <div className="text-sm text-gray-600">
          {filteredRecords.length === 0 ? (
            <span className="text-amber-600">条件に一致する記録がありません</span>
          ) : (
            <span>{records.length}件中 {filteredRecords.length}件を表示</span>
          )}
        </div>
      )}

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
      ) : filteredRecords.length === 0 && hasActiveFilters ? (
        <div className="text-center py-8 text-gray-500">
          <p>条件に一致する記録がありません</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-blue-600 hover:underline"
          >
            フィルタをクリア
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
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
