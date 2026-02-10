import React, { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { GoalEvaluationDiff } from './GoalEvaluationDiff';
import { MonitoringCompareField } from './MonitoringCompareField';
import {
  saveMonitoringRecord,
  getMonitoringRecord,
  listMonitoringRecordsByCarePlan,
  type MonitoringRecordDocument,
} from '../../services/firebase';
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

interface MonitoringDiffViewProps {
  userId: string;
  clientId: string;
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

export const MonitoringDiffView: React.FC<MonitoringDiffViewProps> = ({
  userId,
  clientId,
  carePlanId,
  goals,
  existingRecordId,
  onSave,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diffMode, setDiffMode] = useState(true);
  const [previousRecord, setPreviousRecord] = useState<MonitoringRecordDocument | null>(null);

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

  // 前回記録から前回評価を取得するヘルパー
  const getPreviousEvaluation = useCallback(
    (goalId: string) => {
      if (!previousRecord) return undefined;
      return previousRecord.goalEvaluations.find((e) => e.goalId === goalId);
    },
    [previousRecord]
  );

  // 初期化・前回記録の取得
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      try {
        // 目標から評価データを初期化
        const initialEvaluations = goals.map((goal) => ({
          goalId: goal.id,
          goalContent: goal.content,
          status: 'not_evaluated' as GoalEvaluationStatus,
          observation: '',
        }));
        setGoalEvaluations(initialEvaluations);

        // 既存レコードがあれば読み込み（編集モード）
        if (existingRecordId) {
          const record = await getMonitoringRecord(userId, clientId, existingRecordId);
          if (record) {
            populateFormFromRecord(record);
          }
        }

        // 前回記録を取得（差分表示用）
        const previousRecords = await listMonitoringRecordsByCarePlan(userId, clientId, carePlanId, 2);
        // 編集中のレコード以外で直近のものを取得
        const latestPrevious = previousRecords.find(
          (r) => r.id !== existingRecordId
        );
        if (latestPrevious) {
          setPreviousRecord(latestPrevious);
        }
      } catch (error) {
        console.error('Failed to initialize form:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, [goals, existingRecordId, userId, clientId, carePlanId]);

  const populateFormFromRecord = (record: MonitoringRecordDocument) => {
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

  // 前回値をすべてコピー
  const copyAllFromPrevious = () => {
    if (!previousRecord) return;

    setVisitMethod(previousRecord.visitMethod);
    setOverallCondition(previousRecord.overallCondition);
    setHealthChanges(previousRecord.healthChanges);
    setLivingConditionChanges(previousRecord.livingConditionChanges);
    setServiceUsageRecords([...previousRecord.serviceUsageRecords]);
    setServiceUsageSummary(previousRecord.serviceUsageSummary);
    setUserOpinion(previousRecord.userOpinion);
    setFamilyOpinion(previousRecord.familyOpinion);
    setNextActions(previousRecord.nextActions);

    // 目標評価もコピー（マッチするもののみ）
    setGoalEvaluations((prev) =>
      prev.map((e) => {
        const prevEval = previousRecord.goalEvaluations.find(
          (pe) => pe.goalId === e.goalId
        );
        if (prevEval) {
          return { ...e, status: prevEval.status, observation: prevEval.observation };
        }
        return e;
      })
    );
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

      await saveMonitoringRecord(userId, clientId, recordId, data);

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

  const formatPreviousDate = () => {
    if (!previousRecord) return '';
    return previousRecord.visitDate.toDate().toLocaleDateString('ja-JP');
  };

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">モニタリング記録</h2>
        <div className="flex items-center gap-3">
          {previousRecord && (
            <>
              <button
                type="button"
                onClick={() => setDiffMode(!diffMode)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  diffMode
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                差分モード: {diffMode ? 'ON' : 'OFF'}
              </button>
              {diffMode && (
                <button
                  type="button"
                  onClick={copyAllFromPrevious}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  前回値をすべてコピー
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 前回記録情報 */}
      {previousRecord && diffMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <span className="font-medium">▶ 前回記録:</span> {formatPreviousDate()}{' '}
            ({visitMethodOptions.find((o) => o.value === previousRecord.visitMethod)?.label})
          </p>
        </div>
      )}

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
          <MonitoringCompareField
            label="実施方法"
            fieldType="select"
            currentValue={visitMethod}
            previousValue={diffMode ? previousRecord?.visitMethod : undefined}
            onChange={(v) => setVisitMethod(v as typeof visitMethod)}
            selectOptions={visitMethodOptions.map((o) => ({ value: o.value, label: o.label }))}
            showDiff={diffMode}
          />
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
              <GoalEvaluationDiff
                key={evaluation.goalId}
                goalContent={evaluation.goalContent}
                status={evaluation.status}
                observation={evaluation.observation}
                previousEvaluation={diffMode ? getPreviousEvaluation(evaluation.goalId) : undefined}
                onStatusChange={(status) => handleGoalStatusChange(evaluation.goalId, status)}
                onObservationChange={(obs) => handleGoalObservationChange(evaluation.goalId, obs)}
                showDiff={diffMode}
              />
            ))}
          </div>
        )}
      </section>

      {/* 全体評価 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">全体評価</h3>
        <div className="space-y-4">
          <MonitoringCompareField
            label="利用者の全体的な状態"
            fieldType="textarea"
            currentValue={overallCondition}
            previousValue={diffMode ? previousRecord?.overallCondition : undefined}
            onChange={setOverallCondition}
            placeholder="全体的な状態を記入..."
            rows={3}
            showDiff={diffMode}
          />
          <MonitoringCompareField
            label="健康状態の変化"
            fieldType="textarea"
            currentValue={healthChanges}
            previousValue={diffMode ? previousRecord?.healthChanges : undefined}
            onChange={setHealthChanges}
            placeholder="前回からの健康状態の変化..."
            rows={2}
            showDiff={diffMode}
          />
          <MonitoringCompareField
            label="生活状況の変化"
            fieldType="textarea"
            currentValue={livingConditionChanges}
            previousValue={diffMode ? previousRecord?.livingConditionChanges : undefined}
            onChange={setLivingConditionChanges}
            placeholder="生活環境や日常生活の変化..."
            rows={2}
            showDiff={diffMode}
          />
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
        <MonitoringCompareField
          label="サービス利用状況の総括"
          fieldType="textarea"
          currentValue={serviceUsageSummary}
          previousValue={diffMode ? previousRecord?.serviceUsageSummary : undefined}
          onChange={setServiceUsageSummary}
          placeholder="サービス利用状況の総括..."
          rows={2}
          showDiff={diffMode}
        />
      </section>

      {/* 利用者・家族の意向 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">利用者・家族の意向</h3>
        <div className="space-y-4">
          <MonitoringCompareField
            label="利用者の意見"
            fieldType="textarea"
            currentValue={userOpinion}
            previousValue={diffMode ? previousRecord?.userOpinion : undefined}
            onChange={setUserOpinion}
            placeholder="利用者本人の意見・希望..."
            rows={2}
            showDiff={diffMode}
          />
          <MonitoringCompareField
            label="家族の意見"
            fieldType="textarea"
            currentValue={familyOpinion}
            previousValue={diffMode ? previousRecord?.familyOpinion : undefined}
            onChange={setFamilyOpinion}
            placeholder="家族の意見・希望..."
            rows={2}
            showDiff={diffMode}
          />
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
            <MonitoringCompareField
              label="見直しが必要な理由"
              fieldType="textarea"
              currentValue={revisionReason}
              previousValue={diffMode ? previousRecord?.revisionReason : undefined}
              onChange={setRevisionReason}
              placeholder="見直しが必要な理由..."
              rows={2}
              showDiff={diffMode}
            />
          )}
          <MonitoringCompareField
            label="今後の対応・申し送り"
            fieldType="textarea"
            currentValue={nextActions}
            previousValue={diffMode ? previousRecord?.nextActions : undefined}
            onChange={setNextActions}
            placeholder="今後の対応事項..."
            rows={3}
            showDiff={diffMode}
          />
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

export default MonitoringDiffView;
