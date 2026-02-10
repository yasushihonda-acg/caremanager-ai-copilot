import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { VoiceRecordInput } from './VoiceRecordInput';
import { saveSupportRecord, getSupportRecord, type SupportRecordDocument } from '../../services/firebase';
import type { SupportRecordType } from '../../types';

interface SupportRecordFormProps {
  userId: string;
  clientId: string;
  carePlanId?: string;
  existingRecordId?: string;
  onSave?: (recordId: string) => void;
  onCancel?: () => void;
}

const recordTypeOptions: { value: SupportRecordType; label: string }[] = [
  { value: 'phone_call', label: '電話連絡' },
  { value: 'home_visit', label: '訪問' },
  { value: 'office_visit', label: '来所' },
  { value: 'service_coordination', label: 'サービス調整' },
  { value: 'meeting', label: '会議' },
  { value: 'document', label: '書類作成・送付' },
  { value: 'other', label: 'その他' },
];

// 定型文テンプレート
const contentTemplates = [
  { label: '電話での状況確認', text: '電話にて利用者の状況確認を行った。' },
  { label: 'サービス事業所への連絡', text: 'サービス事業所に連絡し、サービス提供状況を確認した。' },
  { label: '担当者会議の調整', text: 'サービス担当者会議の日程調整を行った。' },
  { label: 'ケアプラン交付', text: 'ケアプランを利用者・家族に交付し、内容を説明した。' },
  { label: '主治医への連絡', text: '主治医に連絡し、利用者の状態について情報共有を行った。' },
];

export const SupportRecordForm: React.FC<SupportRecordFormProps> = ({
  userId,
  clientId,
  carePlanId,
  existingRecordId,
  onSave,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useVoiceInput, setUseVoiceInput] = useState(false);

  // フォームデータ
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 16));
  const [recordType, setRecordType] = useState<SupportRecordType>('phone_call');
  const [actor, setActor] = useState('');
  const [counterpart, setCounterpart] = useState('');
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');

  // 既存レコードの読み込み
  useEffect(() => {
    if (existingRecordId) {
      loadExistingRecord();
    }
  }, [existingRecordId]);

  const loadExistingRecord = async () => {
    if (!existingRecordId) return;

    setLoading(true);
    try {
      const record = await getSupportRecord(userId, clientId, existingRecordId);
      if (record) {
        setRecordDate(record.recordDate.toDate().toISOString().slice(0, 16));
        setRecordType(record.recordType);
        setActor(record.actor);
        setCounterpart(record.counterpart);
        setContent(record.content);
        setResult(record.result);
      }
    } catch (error) {
      console.error('Failed to load existing record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (templateText: string) => {
    setContent((prev) => (prev ? prev + '\n' + templateText : templateText));
  };

  const handleVoiceTranscript = (text: string) => {
    // 音声入力を内容フィールドに追加
    setContent((prev) => (prev ? prev + '\n' + text : text));
  };

  const handleSave = async () => {
    // バリデーション
    if (!content.trim()) {
      setError('内容を入力してください');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const recordId = existingRecordId || `support_${Date.now()}`;

      const data: Omit<SupportRecordDocument, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        carePlanId,
        recordDate: Timestamp.fromDate(new Date(recordDate)),
        recordType,
        actor: actor || '担当ケアマネ',
        counterpart,
        content,
        result,
        createdBy: userId,
      };

      await saveSupportRecord(userId, clientId, recordId, data);

      if (onSave) {
        onSave(recordId);
      }
    } catch (err) {
      console.error('Failed to save support record:', err);
      setError('保存に失敗しました。再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900">支援経過記録</h2>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 基本情報 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日時
            </label>
            <input
              type="datetime-local"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              種別
            </label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as SupportRecordType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {recordTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 誰が・誰に */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">対象者</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              対応者（誰が）
            </label>
            <input
              type="text"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="担当ケアマネ"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              相手方（誰に）
            </label>
            <input
              type="text"
              value={counterpart}
              onChange={(e) => setCounterpart(e.target.value)}
              placeholder="利用者本人、家族、事業所名など"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* 内容 */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">内容</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useVoiceInput}
              onChange={(e) => setUseVoiceInput(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">音声入力を使用</span>
          </label>
        </div>

        {/* 定型文テンプレート */}
        <div className="mb-3">
          <p className="text-sm text-gray-500 mb-2">定型文:</p>
          <div className="flex flex-wrap gap-2">
            {contentTemplates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleTemplateClick(template.text)}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {/* 音声入力または通常入力 */}
        {useVoiceInput ? (
          <VoiceRecordInput
            onTranscript={handleVoiceTranscript}
            placeholder="マイクボタンをクリックして音声入力..."
          />
        ) : null}

        <div className="mt-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="支援内容を記入...&#10;（いつ・誰が・誰に・どのように・何を）"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={5}
          />
        </div>
      </section>

      {/* 結果・対応 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">結果・対応</h3>
        <textarea
          value={result}
          onChange={(e) => setResult(e.target.value)}
          placeholder="結果や今後の対応を記入..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </section>

      {/* アクションボタン */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
};

export default SupportRecordForm;
