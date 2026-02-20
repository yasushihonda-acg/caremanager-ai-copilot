import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import type { CarePlan } from '../types';
import { listCarePlans, saveCarePlan, saveCarePlanSnapshot, getCarePlan, migrateCarePlanId, CarePlanDocument } from '../services/firebase';

// ------------------------------------------------------------------
// Public interfaces
// ------------------------------------------------------------------

export interface CarePlanSummary {
  id: string;
  status: 'draft' | 'review' | 'consented' | 'active';
  updatedAt: Timestamp;
  createdAt: Timestamp;
  longTermGoal: string;
}

export interface UseCarePlanReturn {
  plan: CarePlan;
  planList: CarePlanSummary[];
  isLoading: boolean;
  isSaving: boolean;
  saveMessage: { type: 'success' | 'error'; text: string } | null;
  loadPlan: (planId: string) => Promise<void>;
  savePlan: (assessmentId: string | null) => Promise<void>;
  createNewPlan: () => void;
  updatePlan: (updates: Partial<CarePlan>) => void;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const EMPTY_PLAN = (userId = ''): CarePlan => ({
  id: '',
  userId,
  status: 'draft',
  assessmentDate: '',
  draftDate: '',
  meetingDate: '',
  consentDate: '',
  deliveryDate: '',
  longTermGoal: '',
  shortTermGoals: [],
});

function documentToCarePlan(document: CarePlanDocument, userId: string): CarePlan {
  const tsToDate = (ts: Timestamp | undefined): string => {
    if (!ts) return '';
    try {
      return ts.toDate().toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return {
    id: document.id,
    userId,
    status: document.status,
    assessmentDate: tsToDate(document.dates?.assessment),
    draftDate: tsToDate(document.dates?.draft),
    meetingDate: tsToDate(document.dates?.meeting),
    consentDate: tsToDate(document.dates?.consent),
    deliveryDate: tsToDate(document.dates?.delivery),
    longTermGoal: document.longTermGoal ?? '',
    longTermGoalStartDate: document.longTermGoalStartDate,
    longTermGoalEndDate: document.longTermGoalEndDate,
    shortTermGoals: (document.shortTermGoals ?? []).map(g => ({
      id: g.id,
      content: g.content,
      status: g.status,
      startDate: g.startDate,
      endDate: g.endDate,
    })),
    userIntention: document.userIntention,
    familyIntention: document.familyIntention,
    needs: document.needs?.map(n => ({
      id: n.id,
      content: n.content,
      longTermGoal: n.longTermGoal,
      longTermGoalStartDate: n.longTermGoalStartDate,
      longTermGoalEndDate: n.longTermGoalEndDate,
      shortTermGoals: n.shortTermGoals.map(g => ({
        id: g.id,
        content: g.content,
        status: g.status,
        startDate: g.startDate,
        endDate: g.endDate,
      })),
      services: n.services.map(s => ({
        id: s.id,
        content: s.content,
        type: s.type,
        frequency: s.frequency,
      })),
    })),
    totalDirectionPolicy: document.totalDirectionPolicy,
    weeklySchedule: document.weeklySchedule,
  };
}

function planToDocument(plan: CarePlan, assessmentId: string): Partial<CarePlanDocument> {
  const dateToTs = (s: string): Timestamp => {
    if (!s) return Timestamp.now();
    return Timestamp.fromDate(new Date(s + 'T00:00:00'));
  };

  return {
    assessmentId,
    status: plan.status,
    dates: {
      assessment: dateToTs(plan.assessmentDate),
      draft: dateToTs(plan.draftDate),
      ...(plan.meetingDate ? { meeting: dateToTs(plan.meetingDate) } : {}),
      ...(plan.consentDate ? { consent: dateToTs(plan.consentDate) } : {}),
      ...(plan.deliveryDate ? { delivery: dateToTs(plan.deliveryDate) } : {}),
    },
    longTermGoal: plan.longTermGoal,
    ...(plan.longTermGoalStartDate !== undefined && { longTermGoalStartDate: plan.longTermGoalStartDate }),
    ...(plan.longTermGoalEndDate !== undefined && { longTermGoalEndDate: plan.longTermGoalEndDate }),
    shortTermGoals: plan.shortTermGoals.map(g => ({
      id: g.id,
      content: g.content,
      status: g.status,
      ...(g.startDate !== undefined && { startDate: g.startDate }),
      ...(g.endDate !== undefined && { endDate: g.endDate }),
    })),
    ...(plan.userIntention !== undefined && { userIntention: plan.userIntention }),
    ...(plan.familyIntention !== undefined && { familyIntention: plan.familyIntention }),
    ...(plan.needs && {
      needs: plan.needs.map(n => ({
        id: n.id,
        content: n.content,
        longTermGoal: n.longTermGoal,
        ...(n.longTermGoalStartDate !== undefined && { longTermGoalStartDate: n.longTermGoalStartDate }),
        ...(n.longTermGoalEndDate !== undefined && { longTermGoalEndDate: n.longTermGoalEndDate }),
        shortTermGoals: n.shortTermGoals.map(g => ({
          id: g.id,
          content: g.content,
          status: g.status,
          ...(g.startDate !== undefined && { startDate: g.startDate }),
          ...(g.endDate !== undefined && { endDate: g.endDate }),
        })),
        services: n.services.map(s => ({
          id: s.id,
          content: s.content,
          type: s.type,
          frequency: s.frequency,
        })),
      })),
    }),
    ...(plan.totalDirectionPolicy !== undefined && {
      totalDirectionPolicy: plan.totalDirectionPolicy,
    }),
    ...(plan.weeklySchedule !== undefined && {
      weeklySchedule: plan.weeklySchedule,
    }),
  };
}

function docsToPlanSummaries(docs: CarePlanDocument[]): CarePlanSummary[] {
  return docs.map(d => ({
    id: d.id,
    status: d.status,
    updatedAt: d.updatedAt,
    createdAt: d.createdAt,
    longTermGoal: d.longTermGoal ?? '',
  }));
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------

export function useCarePlan(
  userId: string | null,
  clientId: string | null
): UseCarePlanReturn {
  const [plan, setPlan] = useState<CarePlan>(EMPTY_PLAN());
  const [planList, setPlanList] = useState<CarePlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear save message after 3 seconds
  useEffect(() => {
    if (!saveMessage) return;
    const timer = setTimeout(() => setSaveMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [saveMessage]);

  const loadPlanList = useCallback(async () => {
    if (!userId || !clientId) return;
    setIsLoading(true);
    try {
      let docs = await listCarePlans(userId, clientId);

      // Migration: 'p1' ハードコードIDを UUID に移行
      const p1Doc = docs.find(d => d.id === 'p1');
      if (p1Doc) {
        const newId = await migrateCarePlanId(userId, clientId, 'p1');
        docs = await listCarePlans(userId, clientId);
        setPlanList(docsToPlanSummaries(docs));
        const migratedDoc = docs.find(d => d.id === newId);
        if (migratedDoc) {
          setPlan(documentToCarePlan(migratedDoc, userId));
        }
        return;
      }

      setPlanList(docsToPlanSummaries(docs));

      // 最新のプランを自動ロード（updatedAt 降順 → 先頭）
      if (docs.length > 0) {
        setPlan(documentToCarePlan(docs[0], userId));
      } else {
        setPlan(EMPTY_PLAN(userId));
      }
    } catch (error) {
      console.error('Failed to load care plans:', error);
      setPlan(EMPTY_PLAN(userId));
    } finally {
      setIsLoading(false);
    }
  }, [userId, clientId]);

  // userId / clientId が変わったらプラン一覧を再取得
  useEffect(() => {
    if (userId && clientId) {
      loadPlanList();
    } else {
      setPlan(EMPTY_PLAN());
      setPlanList([]);
    }
  }, [userId, clientId, loadPlanList]);

  const loadPlan = useCallback(async (planId: string) => {
    if (!userId || !clientId) return;
    setIsLoading(true);
    try {
      const docData = await getCarePlan(userId, clientId, planId);
      if (docData) {
        setPlan(documentToCarePlan(docData, userId));
      }
    } catch (error) {
      console.error('Failed to load care plan:', error);
      setSaveMessage({ type: 'error', text: 'ケアプランの読み込みに失敗しました' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, clientId]);

  const savePlan = useCallback(async (assessmentId: string | null) => {
    if (!userId || !clientId) return;
    if (isSaving) return; // 連打防止
    if (!assessmentId) {
      setSaveMessage({ type: 'error', text: 'アセスメントを先に保存してください' });
      return;
    }
    setIsSaving(true);
    try {
      const planId = plan.id || crypto.randomUUID();
      const isNew = !plan.id;

      // 既存プランの保存前にスナップショットを履歴として記録
      if (!isNew) {
        const currentDoc = await getCarePlan(userId, clientId, planId);
        if (currentDoc) {
          await saveCarePlanSnapshot(userId, clientId, planId, currentDoc).catch((e) =>
            console.error('Failed to save care plan snapshot:', e)
          );
        }
      }

      await saveCarePlan(userId, clientId, planId, {
        ...planToDocument(plan, assessmentId),
        ...(isNew && { createdAt: Timestamp.now() }),
      });

      setPlan(prev => ({ ...prev, id: planId }));
      setSaveMessage({ type: 'success', text: 'ケアプランを保存しました' });

      // プラン一覧を更新
      const docs = await listCarePlans(userId, clientId);
      setPlanList(docsToPlanSummaries(docs));
    } catch (error) {
      console.error('Failed to save care plan:', error);
      setSaveMessage({ type: 'error', text: 'ケアプランの保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  }, [userId, clientId, plan]);

  const createNewPlan = useCallback(() => {
    setPlan(EMPTY_PLAN(userId ?? ''));
  }, [userId]);

  const updatePlan = useCallback((updates: Partial<CarePlan>) => {
    setPlan(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    plan,
    planList,
    isLoading,
    isSaving,
    saveMessage,
    loadPlan,
    savePlan,
    createNewPlan,
    updatePlan,
  };
}
