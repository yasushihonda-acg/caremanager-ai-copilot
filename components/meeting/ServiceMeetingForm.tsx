import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Plus } from 'lucide-react';
import { AttendeeEditor } from './AttendeeEditor';
import { AgendaItemEditor } from './AgendaItemEditor';
import {
  saveServiceMeetingRecord,
  getServiceMeetingRecord,
  type ServiceMeetingRecordDocument,
} from '../../services/firebase';
import type { MeetingAttendee, MeetingAgendaItem, MeetingFormat } from '../../types';

interface ServiceMeetingFormProps {
  userId: string;
  carePlanId: string;
  existingRecordId?: string;
  onSave?: (recordId: string) => void;
  onCancel?: () => void;
}

const meetingFormatOptions: { value: MeetingFormat; label: string }[] = [
  { value: 'in_person', label: '対面開催' },
  { value: 'online', label: 'オンライン開催' },
  { value: 'hybrid', label: 'ハイブリッド' },
];

const meetingPurposeOptions = [
  '新規ケアプラン作成',
  'ケアプラン更新',
  'ケアプラン変更',
  '緊急対応',
  'その他',
];

export const ServiceMeetingForm: React.FC<ServiceMeetingFormProps> = ({
  userId,
  carePlanId,
  existingRecordId,
  onSave,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 基本情報
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingFormat, setMeetingFormat] = useState<MeetingFormat>('in_person');
  const [meetingPurpose, setMeetingPurpose] = useState('新規ケアプラン作成');

  // 出席者
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);

  // 利用者・家族
  const [userAttended, setUserAttended] = useState(true);
  const [userOpinion, setUserOpinion] = useState('');
  const [familyAttended, setFamilyAttended] = useState(true);
  const [familyOpinion, setFamilyOpinion] = useState('');

  // 検討事項
  const [agendaItems, setAgendaItems] = useState<MeetingAgendaItem[]>([]);

  // ケアプラン同意
  const [carePlanExplained, setCarePlanExplained] = useState(false);
  const [carePlanAgreed, setCarePlanAgreed] = useState(false);
  const [carePlanModifications, setCarePlanModifications] = useState('');

  // その他
  const [remainingIssues, setRemainingIssues] = useState('');
  const [nextMeetingSchedule, setNextMeetingSchedule] = useState('');

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
      const record = await getServiceMeetingRecord(userId, existingRecordId);
      if (record) {
        setMeetingDate(record.meetingDate.toDate().toISOString().slice(0, 16));
        setMeetingLocation(record.meetingLocation);
        setMeetingFormat(record.meetingFormat);
        setMeetingPurpose(record.meetingPurpose);
        setAttendees(record.attendees);
        setUserAttended(record.userAttended);
        setUserOpinion(record.userOpinion);
        setFamilyAttended(record.familyAttended);
        setFamilyOpinion(record.familyOpinion);
        setAgendaItems(record.agendaItems);
        setCarePlanExplained(record.carePlanExplained);
        setCarePlanAgreed(record.carePlanAgreed);
        setCarePlanModifications(record.carePlanModifications);
        setRemainingIssues(record.remainingIssues);
        setNextMeetingSchedule(record.nextMeetingSchedule);
      }
    } catch (error) {
      console.error('Failed to load existing record:', error);
    } finally {
      setLoading(false);
    }
  };

  // 出席者管理
  const addAttendee = () => {
    setAttendees((prev) => [
      ...prev,
      {
        name: '',
        organization: '',
        profession: '',
        attended: true,
      },
    ]);
  };

  const updateAttendee = (index: number, updated: MeetingAttendee) => {
    setAttendees((prev) =>
      prev.map((a, i) => (i === index ? updated : a))
    );
  };

  const removeAttendee = (index: number) => {
    setAttendees((prev) => prev.filter((_, i) => i !== index));
  };

  // 検討事項管理
  const addAgendaItem = () => {
    setAgendaItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        topic: '',
        discussion: '',
        conclusion: '',
        responsible: '',
      },
    ]);
  };

  const updateAgendaItem = (index: number, updated: MeetingAgendaItem) => {
    setAgendaItems((prev) =>
      prev.map((item, i) => (i === index ? updated : item))
    );
  };

  const removeAgendaItem = (index: number) => {
    setAgendaItems((prev) => prev.filter((_, i) => i !== index));
  };

  // 保存
  const handleSave = async () => {
    setSaving(true);
    try {
      const recordId = existingRecordId || `meeting_${Date.now()}`;

      const data: Omit<ServiceMeetingRecordDocument, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        carePlanId,
        meetingDate: Timestamp.fromDate(new Date(meetingDate)),
        meetingLocation,
        meetingFormat,
        meetingPurpose,
        attendees,
        userAttended,
        userOpinion,
        familyAttended,
        familyOpinion,
        agendaItems,
        carePlanExplained,
        carePlanAgreed,
        carePlanModifications,
        remainingIssues,
        nextMeetingSchedule,
        createdBy: userId,
      };

      await saveServiceMeetingRecord(userId, recordId, data);

      if (onSave) {
        onSave(recordId);
      }
    } catch (error) {
      console.error('Failed to save service meeting record:', error);
      alert('保存に失敗しました');
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
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900">サービス担当者会議記録（第4表）</h2>

      {/* 会議基本情報 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">会議基本情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開催日時
            </label>
            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開催場所
            </label>
            <input
              type="text"
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
              placeholder="例: 利用者宅、○○デイサービス、オンライン"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開催方式
            </label>
            <select
              value={meetingFormat}
              onChange={(e) => setMeetingFormat(e.target.value as MeetingFormat)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {meetingFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開催目的
            </label>
            <select
              value={meetingPurpose}
              onChange={(e) => setMeetingPurpose(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {meetingPurposeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 出席者 */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">出席者</h3>
          <button
            type="button"
            onClick={addAttendee}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            出席者を追加
          </button>
        </div>
        {attendees.length === 0 ? (
          <p className="text-gray-500 text-sm">出席者を追加してください</p>
        ) : (
          <div className="space-y-3">
            {attendees.map((attendee, index) => (
              <AttendeeEditor
                key={index}
                attendee={attendee}
                onChange={(updated) => updateAttendee(index, updated)}
                onRemove={() => removeAttendee(index)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 利用者・家族の参加 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">利用者・家族の参加</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={userAttended}
                  onChange={(e) => setUserAttended(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">利用者本人が出席</span>
              </label>
              <textarea
                value={userOpinion}
                onChange={(e) => setUserOpinion(e.target.value)}
                placeholder="利用者の発言・意向"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={familyAttended}
                  onChange={(e) => setFamilyAttended(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">家族が出席</span>
              </label>
              <textarea
                value={familyOpinion}
                onChange={(e) => setFamilyOpinion(e.target.value)}
                placeholder="家族の発言・意向"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 検討事項 */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">検討事項</h3>
          <button
            type="button"
            onClick={addAgendaItem}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            検討事項を追加
          </button>
        </div>
        {agendaItems.length === 0 ? (
          <p className="text-gray-500 text-sm">検討事項を追加してください</p>
        ) : (
          <div className="space-y-4">
            {agendaItems.map((item, index) => (
              <AgendaItemEditor
                key={item.id}
                item={item}
                index={index}
                onChange={(updated) => updateAgendaItem(index, updated)}
                onRemove={() => removeAgendaItem(index)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ケアプラン同意状況 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">ケアプラン原案の説明・同意</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={carePlanExplained}
                onChange={(e) => setCarePlanExplained(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">ケアプラン原案を説明した</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={carePlanAgreed}
                onChange={(e) => setCarePlanAgreed(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">同意を得た</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会議を踏まえた修正点
            </label>
            <textarea
              value={carePlanModifications}
              onChange={(e) => setCarePlanModifications(e.target.value)}
              placeholder="会議での検討を踏まえて修正した点"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* 残された課題・次回予定 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">残された課題・次回予定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              残された課題
            </label>
            <textarea
              value={remainingIssues}
              onChange={(e) => setRemainingIssues(e.target.value)}
              placeholder="今後検討が必要な課題"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              次回会議予定
            </label>
            <input
              type="text"
              value={nextMeetingSchedule}
              onChange={(e) => setNextMeetingSchedule(e.target.value)}
              placeholder="例: 3ヶ月後（状態変化時は随時）"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
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
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
};

export default ServiceMeetingForm;
