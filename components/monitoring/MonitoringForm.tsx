import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { GoalEvaluation } from './GoalEvaluation';
import { saveMonitoringRecord, getMonitoringRecord, type MonitoringRecordDocument } from '../../services/firebase';
import type { GoalEvaluationStatus, CareGoal } from '../../types';

interface GoalEvaluationData {
  goalId: string;
  goalContent: string;
  status: GoalEvaluationStatus;
  observation: string;
}

interface ServiceUsageData {
  serviceType: string;
  provider: string;
  plannedFrequency: string;
  actualUsage: string;
  remarks: string;
}

interface MonitoringFormProps {
  userId: string;
  carePlanId: string;
  goals: CareGoal[];
  existingRecordId?: string;
  onSave?: (recordId: string) => void;
  onCancel?: () => void;
}

const visitMethodOptions = [
  { value: 'home_visit', label: '居宅訪問' },
  { value: 'online', label: 'オンライン' },
  { value: 'phone', label: '電話' },
] as const;

export const MonitoringForm: React.FC<MonitoringFormProps> = ({
  userId,
  carePlanId,
  goals,
  existingRecordId,
  onSave,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // フォームデータ
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitMethod, setVisitMethod] = useState<'home_visit' | 'online' | 'phone'>('home_visit');
  const [goalEvaluations, setGoalEvaluations] = useState<GoalEvaluationData[]>([]);
  const [overallCondition, setOverallCondition] = useState('');
  const [healthChanges, setHealthChanges] = useState('');
  const [livingConditionChanges, setLivingConditionChanges] = useState('');
  const [serviceUsageRecords, setServiceUsageRecords] = useState<ServiceUsageData[]>([]);
  const [serviceUsageSummary, setServiceUsageSummary] = useState('');
  const [userOpinion, setUserOpinion] = useState('');
  const [familyOpinion, setFamilyOpinion] = useState('');
  const [needsPlanRevision, setNeedsPlanRevision] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [nextActions, setNextActions] = useState('');
  const [nextMonitoringDate, setNextMonitoringDate] = useState('');

  // 初期化
  useEffect(() => {
    // 目標から評価データを初期化
    const initialEvaluations = goals.map((goal) => ({
      goalId: goal.id,
      goalContent: goal.content,
      status: 'not_evaluated' as GoalEvaluationStatus,
      observation: '',
    }));
    setGoalEvaluations(initialEvaluations);

    // 既存レコードがあれば読み込み
    if (existingRecordId) {
      loadExistingRecord();
    }
  }, [goals, existingRecordId]);

  const loadExistingRecord = async () => {
    if (!existingRecordId) return;

    setLoading(true);
    try {
      const record = await getMonitoringRecord(userId, existingRecordId);
      if (record) {
        setVisitDate(record.visitDate.toDate().toISOString().split('T')[0]);
        setVisitMethod(record.visitMethod);
        setGoalEvaluations(record.goalEvaluations);
        setOverallCondition(record.overallCondition);
        setHealthChanges(record.healthChanges);
        setLivingConditionChanges(record.livingConditionChanges);
        setServiceUsageRecords(record.serviceUsageRecords);
        setServiceUsageSummary(record.serviceUsageSummary);
        setUserOpinion(record.userOpinion);
        setFamilyOpinion(record.familyOpinion);
        setNeedsPlanRevision(record.needsPlanRevision);
        setRevisionReason(record.revisionReason);
        setNextActions(record.nextActions);
        if (record.nextMonitoringDate) {
          setNextMonitoringDate(record.nextMonitoringDate.toDate().toISOString().split('T')[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load existing record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalStatusChange = (goalId: string, status: GoalEvaluationStatus) => {
    setGoalEvaluations((prev) =>
      prev.map((e) => (e.goalId === goalId ? { ...e, status } : e))
    );
  };

  const handleGoalObservationChange = (goalId: string, observation: string) => {
    setGoalEvaluations((prev) =>
      prev.map((e) => (e.goalId === goalId ? { ...e, observation } : e))
    );
  };

  const addServiceUsage = () => {
    setServiceUsageRecords((prev) => [
      ...prev,
      { serviceType: '', provider: '', plannedFrequency: '', actualUsage: '', remarks: '' },
    ]);
  };

  const updateServiceUsage = (index: number, field: keyof ServiceUsageData, value: string) => {
    setServiceUsageRecords((prev) =>
      prev.map((record, i) => (i === index ? { ...record, [field]: value } : record))
    );
  };

  const removeServiceUsage = (index: number) => {
    setServiceUsageRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordId = existingRecordId || `monitoring_${Date.now()}`;

      const data: Omit<MonitoringRecordDocument, 'id' | 'createdAt' | 'updatedAt'> = {
        carePlanId,
        userId,
        recordDate: Timestamp.now(),
        visitDate: Timestamp.fromDate(new Date(visitDate)),
        visitMethod,
        goalEvaluations,
        overallCondition,
        healthChanges,
        livingConditionChanges,
        serviceUsageRecords,
        serviceUsageSummary,
        userOpinion,
        familyOpinion,
        needsPlanRevision,
        revisionReason,
        nextActions,
        nextMonitoringDate: nextMonitoringDate
          ? Timestamp.fromDate(new Date(nextMonitoringDate))
          : null,
        createdBy: userId,
      };

      await saveMonitoringRecord(userId, recordId, data);

      if (onSave) {
        onSave(recordId);
      }
    } catch (error) {
      console.error('Failed to save monitoring record:', error);
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
      <h2 className="text-xl font-bold text-gray-900">モニタリング記録</h2>

      {/* 訪問情報 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">訪問情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              モニタリング実施日
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              実施方法
            </label>
            <select
              value={visitMethod}
              onChange={(e) => setVisitMethod(e.target.value as typeof visitMethod)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {visitMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 目標評価 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">目標の評価</h3>
        {goalEvaluations.length === 0 ? (
          <p className="text-gray-500 text-sm">評価対象の目標がありません</p>
        ) : (
          <div className="space-y-4">
            {goalEvaluations.map((evaluation) => (
              <GoalEvaluation
                key={evaluation.goalId}
                goalId={evaluation.goalId}
                goalContent={evaluation.goalContent}
                status={evaluation.status}
                observation={evaluation.observation}
                onStatusChange={(status) => handleGoalStatusChange(evaluation.goalId, status)}
                onObservationChange={(obs) => handleGoalObservationChange(evaluation.goalId, obs)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 全体評価 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">全体評価</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              利用者の全体的な状態
            </label>
            <textarea
              value={overallCondition}
              onChange={(e) => setOverallCondition(e.target.value)}
              placeholder="全体的な状態を記入..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              健康状態の変化
            </label>
            <textarea
              value={healthChanges}
              onChange={(e) => setHealthChanges(e.target.value)}
              placeholder="前回からの健康状態の変化..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              生活状況の変化
            </label>
            <textarea
              value={livingConditionChanges}
              onChange={(e) => setLivingConditionChanges(e.target.value)}
              placeholder="生活環境や日常生活の変化..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* サービス利用状況 */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">サービス利用状況</h3>
          <button
            type="button"
            onClick={addServiceUsage}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + サービス追加
          </button>
        </div>
        {serviceUsageRecords.length > 0 && (
          <div className="space-y-3 mb-4">
            {serviceUsageRecords.map((record, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    value={record.serviceType}
                    onChange={(e) => updateServiceUsage(index, 'serviceType', e.target.value)}
                    placeholder="サービス種別"
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    value={record.provider}
                    onChange={(e) => updateServiceUsage(index, 'provider', e.target.value)}
                    placeholder="事業所名"
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    value={record.plannedFrequency}
                    onChange={(e) => updateServiceUsage(index, 'plannedFrequency', e.target.value)}
                    placeholder="計画頻度"
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={record.actualUsage}
                    onChange={(e) => updateServiceUsage(index, 'actualUsage', e.target.value)}
                    placeholder="実際の利用状況"
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={record.remarks}
                      onChange={(e) => updateServiceUsage(index, 'remarks', e.target.value)}
                      placeholder="備考"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeServiceUsage(index)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            サービス利用状況の総括
          </label>
          <textarea
            value={serviceUsageSummary}
            onChange={(e) => setServiceUsageSummary(e.target.value)}
            placeholder="サービス利用状況の総括..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
      </section>

      {/* 利用者・家族の意向 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">利用者・家族の意向</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              利用者の意見
            </label>
            <textarea
              value={userOpinion}
              onChange={(e) => setUserOpinion(e.target.value)}
              placeholder="利用者本人の意見・希望..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              家族の意見
            </label>
            <textarea
              value={familyOpinion}
              onChange={(e) => setFamilyOpinion(e.target.value)}
              placeholder="家族の意見・希望..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* 今後の対応 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">今後の対応</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={needsPlanRevision}
                onChange={(e) => setNeedsPlanRevision(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                ケアプランの見直しが必要
              </span>
            </label>
          </div>
          {needsPlanRevision && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                見直しが必要な理由
              </label>
              <textarea
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="見直しが必要な理由..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              今後の対応・申し送り
            </label>
            <textarea
              value={nextActions}
              onChange={(e) => setNextActions(e.target.value)}
              placeholder="今後の対応事項..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              次回モニタリング予定日
            </label>
            <input
              type="date"
              value={nextMonitoringDate}
              onChange={(e) => setNextMonitoringDate(e.target.value)}
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default MonitoringForm;
