import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

// 定型文テンプレート定義
const templates: Record<string, { label: string; text: string }[]> = {
  overallCondition: [
    { label: '安定', text: '全体的に安定した状態が続いている。' },
    { label: '改善傾向', text: '前回と比較し改善傾向がみられる。' },
    { label: '状態低下', text: '前回と比較し状態の低下がみられる。' },
    { label: '変化なし', text: '前回と大きな変化はみられない。' },
  ],
  healthChanges: [
    { label: '変化なし', text: '健康状態に大きな変化はない。' },
    { label: '通院継続', text: '定期的な通院を継続しており、主治医より現状維持の方針。' },
    { label: '体調不良', text: '体調不良の訴えがあり、経過観察が必要。' },
    { label: '入退院', text: '入院/退院があり、状態の確認が必要。' },
  ],
  livingConditionChanges: [
    { label: '変化なし', text: '生活状況に大きな変化はない。' },
    { label: '自立度改善', text: '日常生活の自立度に改善がみられる。' },
    { label: 'ADL低下', text: 'ADLの低下がみられ、支援内容の見直しが必要。' },
    { label: '環境変化', text: '生活環境に変化があり、対応を検討する。' },
  ],
  serviceUsageSummary: [
    { label: '計画通り', text: '各サービスとも計画通りに利用できている。' },
    { label: '利用増', text: '状態の変化に伴い、サービス利用が増加している。' },
    { label: '利用減', text: '状態改善に伴い、一部サービスの利用を減らしている。' },
    { label: '未利用あり', text: '一部サービスの未利用があり、理由の確認が必要。' },
  ],
  nextActions: [
    { label: '継続観察', text: '現行プランを継続し、経過観察を行う。' },
    { label: '主治医連携', text: '主治医に状態変化を報告し、指示を仰ぐ。' },
    { label: 'サービス調整', text: 'サービス事業所と連携し、提供内容の調整を行う。' },
    { label: 'プラン見直し', text: '状態変化に基づき、ケアプランの見直しを検討する。' },
  ],
};

// テンプレートボタンコンポーネント
const TemplateButtons: React.FC<{
  fieldKey: string;
  onInsert: (text: string) => void;
}> = ({ fieldKey, onInsert }) => {
  const fieldTemplates = templates[fieldKey];
  if (!fieldTemplates) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {fieldTemplates.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={() => onInsert(t.text)}
          className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md border border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

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
  const [initError, setInitError] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState(true);
  const [previousRecord, setPreviousRecord] = useState<MonitoringRecordDocument | null>(null);

  // フォームデータ
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitMethod, setVisitMethod] = useState<'home_visit' | 'online' | 'phone'>('home_visit');
  const [goalEvaluations, setGoalEvaluations] = useState<GoalEvaluationData[]>([]);
  const [showAchieved, setShowAchieved] = useState(false);
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

  // テンプレート追記ヘルパー（既存テキストに追記）
  const appendText = (setter: React.Dispatch<React.SetStateAction<string>>, text: string) => {
    setter((prev) => {
      if (!prev.trim()) return text;
      return prev + '\n' + text;
    });
  };

  // 前回記録から前回評価を取得するヘルパー
  const getPreviousEvaluation = useCallback(
    (goalId: string) => {
      if (!previousRecord) return undefined;
      return previousRecord.goalEvaluations.find((e) => e.goalId === goalId);
    },
    [previousRecord]
  );

  // 達成済みとそれ以外を分離（DRY: 分類ロジックを1箇所に集約）
  const { activeGoals, achievedGoals } = useMemo(() => ({
    activeGoals: goalEvaluations.filter((e) => e.status !== 'achieved'),
    achievedGoals: goalEvaluations.filter((e) => e.status === 'achieved'),
  }), [goalEvaluations]);

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
        setInitError('フォームの初期化に失敗しました');
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

      {initError && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
          {initError}
        </div>
      )}

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
            {/* 未達成・評価中の目標 */}
            {activeGoals.map((evaluation) => (
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
            {/* 達成済み目標 - デフォルト折りたたみ */}
            {achievedGoals.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowAchieved((v) => !v)}
                  className="flex items-center gap-1 text-sm text-green-700 font-medium py-1 px-2 rounded hover:bg-green-50 transition-colors"
                >
                  {showAchieved ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  達成済み（{achievedGoals.length}件）
                  {showAchieved ? 'を折りたたむ' : 'を表示'}
                </button>
                {showAchieved && (
                  <div className="space-y-4 mt-2">
                    {achievedGoals.map((evaluation) => (
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
              </div>
            )}
          </div>
        )}
      </section>

      {/* 全体評価 */}
      <section className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">全体評価</h3>
        <div className="space-y-4">
          <div>
            <TemplateButtons fieldKey="overallCondition" onInsert={(text) => appendText(setOverallCondition, text)} />
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
          </div>
          <div>
            <TemplateButtons fieldKey="healthChanges" onInsert={(text) => appendText(setHealthChanges, text)} />
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
          </div>
          <div>
            <TemplateButtons fieldKey="livingConditionChanges" onInsert={(text) => appendText(setLivingConditionChanges, text)} />
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
        <TemplateButtons fieldKey="serviceUsageSummary" onInsert={(text) => appendText(setServiceUsageSummary, text)} />
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
          <div>
            <TemplateButtons fieldKey="nextActions" onInsert={(text) => appendText(setNextActions, text)} />
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

export default MonitoringDiffView;
