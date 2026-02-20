import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, connectAuthEmulator, User } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, collection, getDocs, deleteDoc, addDoc, Timestamp, query, orderBy, limit, where, writeBatch } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import type { ClientInput } from '../types';

// Firebase設定
const firebaseConfig = {
  apiKey: 'AIzaSyBIXVu-eGU5HuYyahCh9y8pL5pniGmwfJc',
  authDomain: 'caremanager-ai-copilot-486212.firebaseapp.com',
  projectId: 'caremanager-ai-copilot-486212',
  storageBucket: 'caremanager-ai-copilot-486212.firebasestorage.app',
  messagingSenderId: '405962110931',
  appId: '1:405962110931:web:aeffd8c49575549b05e126',
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-northeast1');

// Emulator接続
export const isEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';

if (isEmulator) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Google認証プロバイダー
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// 認証関数
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Emulator用テストユーザーログイン
export async function signInAsTestUser(): Promise<User> {
  const email = 'test@example.com';
  const password = 'testpassword123';
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  }
}

// Vertex AI呼び出し（Cloud Functions経由）
interface AnalyzeAssessmentRequest {
  audioBase64?: string;
  textInput?: string;
  currentData: Record<string, string>;
  isFinal: boolean;
  currentSummary: string;
}

interface AnalyzeAssessmentResponse {
  serviceHistory?: string;
  healthStatus?: string;
  pastHistory?: string;
  skinCondition?: string;
  oralHygiene?: string;
  fluidIntake?: string;
  adlTransfer?: string;
  adlEating?: string;
  adlToileting?: string;
  adlBathing?: string;
  adlDressing?: string;
  iadlCooking?: string;
  iadlShopping?: string;
  iadlMoney?: string;
  medication?: string;
  cognition?: string;
  communication?: string;
  socialParticipation?: string;
  residence?: string;
  familySituation?: string;
  maltreatmentRisk?: string;
  environment?: string;
  summary?: string;
}

export const analyzeAssessment = httpsCallable<AnalyzeAssessmentRequest, AnalyzeAssessmentResponse>(
  functions,
  'analyzeAssessment'
);

// ------------------------------------------------------------------
// Firestoreエラーハンドリング
// ------------------------------------------------------------------

export class FirestoreError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly collectionName: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'FirestoreError';
  }
}

async function withFirestoreErrorHandling<T>(
  operation: string,
  collectionName: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Firestore ${operation} error [${collectionName}]:`, error);
    throw new FirestoreError(
      `${collectionName}の${operation}に失敗しました`,
      operation,
      collectionName,
      error
    );
  }
}

// Firestore操作: ユーザープロファイル
export async function saveUserProfile(userId: string, data: { displayName: string; email: string }): Promise<void> {
  return withFirestoreErrorHandling('保存', 'users', async () => {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        ...data,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  });
}

// ------------------------------------------------------------------
// Firestore操作: ケアマネプロファイル
// ------------------------------------------------------------------

export interface CareManagerProfileData {
  name: string;
  office: string;
  phone: string;
  fax: string;
}

export async function saveCareManagerProfile(userId: string, data: CareManagerProfileData): Promise<void> {
  return withFirestoreErrorHandling('保存', 'profile', async () => {
    const profileRef = doc(db, 'users', userId, 'profile', 'careManager');
    await setDoc(profileRef, { ...data, updatedAt: Timestamp.now() }, { merge: true });
  });
}

export async function getCareManagerProfile(userId: string): Promise<CareManagerProfileData | null> {
  return withFirestoreErrorHandling('取得', 'profile', async () => {
    const profileRef = doc(db, 'users', userId, 'profile', 'careManager');
    const snapshot = await getDoc(profileRef);
    if (!snapshot.exists()) return null;
    const d = snapshot.data();
    return {
      name: d.name ?? '',
      office: d.office ?? '',
      phone: d.phone ?? '',
      fax: d.fax ?? '',
    };
  });
}

// ------------------------------------------------------------------
// Firestore操作: 利用者（Client）CRUD
// ------------------------------------------------------------------

export interface ClientDocument {
  id: string;
  name: string;
  kana: string;
  birthDate: string;
  gender: '男' | '女';
  careLevel: string;
  lifeHistory: {
    hobbies: string[];
    previousOccupation: string;
    topicsToAvoid: string[];
    importantMemories: string;
  };
  medicalAlerts: string[];
  address: string;
  phone: string | null;
  insurerNumber: string | null;
  insuredNumber: string | null;
  certificationDate: string | null;
  certificationExpiry: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function saveClient(
  userId: string,
  clientId: string,
  data: ClientInput
): Promise<void> {
  return withFirestoreErrorHandling('保存', 'clients', async () => {
    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    const now = Timestamp.now();

    const existingDoc = await getDoc(clientRef);
    const createdAt = existingDoc.exists() ? existingDoc.data().createdAt : now;

    await setDoc(clientRef, {
      ...data,
      isActive: true,
      createdAt,
      updatedAt: now,
    });
  });
}

export async function getClient(
  userId: string,
  clientId: string
): Promise<ClientDocument | null> {
  return withFirestoreErrorHandling('取得', 'clients', async () => {
    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    const snapshot = await getDoc(clientRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as ClientDocument;
  });
}

export async function listClients(
  userId: string
): Promise<ClientDocument[]> {
  return withFirestoreErrorHandling('一覧取得', 'clients', async () => {
    const clientsRef = collection(db, 'users', userId, 'clients');
    const q = query(clientsRef, where('isActive', '==', true), orderBy('kana', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ClientDocument[];
  });
}

export async function archiveClient(
  userId: string,
  clientId: string
): Promise<void> {
  return withFirestoreErrorHandling('アーカイブ', 'clients', async () => {
    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    await setDoc(
      clientRef,
      {
        isActive: false,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  });
}

// ------------------------------------------------------------------
// ヘルパー: クライアントパスのベース
// ------------------------------------------------------------------
function clientPath(userId: string, clientId: string): string[] {
  return ['users', userId, 'clients', clientId];
}

// ------------------------------------------------------------------
// Firestore操作: アセスメント
// ------------------------------------------------------------------

export interface AssessmentDocument {
  id: string;
  date: Timestamp;
  content: Record<string, string>;
  summary: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function saveAssessment(
  userId: string,
  clientId: string,
  assessmentId: string,
  data: { content: Record<string, string>; summary: string }
): Promise<void> {
  return withFirestoreErrorHandling('保存', 'assessments', async () => {
    const assessmentRef = doc(db, ...clientPath(userId, clientId), 'assessments', assessmentId);
    const now = Timestamp.now();

    await setDoc(
      assessmentRef,
      {
        ...data,
        date: now,
        updatedAt: now,
      },
      { merge: true }
    );
  });
}

export async function getAssessment(userId: string, clientId: string, assessmentId: string): Promise<AssessmentDocument | null> {
  return withFirestoreErrorHandling('取得', 'assessments', async () => {
    const assessmentRef = doc(db, ...clientPath(userId, clientId), 'assessments', assessmentId);
    const snapshot = await getDoc(assessmentRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as AssessmentDocument;
  });
}

export async function listAssessments(userId: string, clientId: string): Promise<AssessmentDocument[]> {
  return withFirestoreErrorHandling('一覧取得', 'assessments', async () => {
    const assessmentsRef = collection(db, ...clientPath(userId, clientId), 'assessments');
    const snapshot = await getDocs(assessmentsRef);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as AssessmentDocument[];
  });
}

export async function deleteAssessment(userId: string, clientId: string, assessmentId: string): Promise<void> {
  return withFirestoreErrorHandling('削除', 'assessments', async () => {
    const assessmentRef = doc(db, ...clientPath(userId, clientId), 'assessments', assessmentId);
    await deleteDoc(assessmentRef);
  });
}

// ------------------------------------------------------------------
// Firestore操作: ケアプラン
// ------------------------------------------------------------------

export interface CarePlanDocument {
  id: string;
  assessmentId: string;
  dates: {
    assessment: Timestamp;
    draft: Timestamp;
    meeting?: Timestamp;
    consent?: Timestamp;
    delivery?: Timestamp;
  };
  status: 'draft' | 'review' | 'consented' | 'active';
  longTermGoal: string;
  longTermGoalStartDate?: string;
  longTermGoalEndDate?: string;
  shortTermGoals: Array<{
    id: string;
    content: string;
    status: 'not_started' | 'in_progress' | 'achieved' | 'discontinued';
    startDate?: string;
    endDate?: string;
  }>;
  // V2: ニーズ別構造（optional → V1データとの後方互換）
  needs?: Array<{
    id: string;
    content: string;
    longTermGoal: string;
    longTermGoalStartDate?: string;
    longTermGoalEndDate?: string;
    shortTermGoals: Array<{
      id: string;
      content: string;
      status: 'not_started' | 'in_progress' | 'achieved' | 'discontinued';
      startDate?: string;
      endDate?: string;
    }>;
    services: Array<{
      id: string;
      content: string;
      type: string;
      frequency: string;
    }>;
  }>;
  // 第1表: 本人・家族等の意向
  userIntention?: string;
  familyIntention?: string;
  totalDirectionPolicy?: string;
  // 第3表: 週間サービス計画表（optional）
  weeklySchedule?: {
    entries: Array<{
      id: string;
      serviceType: string;
      provider: string;
      content: string;
      days: string[];
      startTime: string;
      endTime: string;
      frequency: string;
      notes: string;
    }>;
    mainActivities: string;
    weeklyNote: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function saveCarePlan(userId: string, clientId: string, planId: string, data: Partial<CarePlanDocument>): Promise<void> {
  return withFirestoreErrorHandling('保存', 'carePlans', async () => {
    const planRef = doc(db, ...clientPath(userId, clientId), 'carePlans', planId);
    const now = Timestamp.now();

    await setDoc(
      planRef,
      {
        ...data,
        updatedAt: now,
      },
      { merge: true }
    );
  });
}

export async function getCarePlan(userId: string, clientId: string, planId: string): Promise<CarePlanDocument | null> {
  return withFirestoreErrorHandling('取得', 'carePlans', async () => {
    const planRef = doc(db, ...clientPath(userId, clientId), 'carePlans', planId);
    const snapshot = await getDoc(planRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as CarePlanDocument;
  });
}

export async function listCarePlans(userId: string, clientId: string): Promise<CarePlanDocument[]> {
  return withFirestoreErrorHandling('一覧取得', 'carePlans', async () => {
    const plansRef = collection(db, ...clientPath(userId, clientId), 'carePlans');
    // updatedAt 降順で返す（最新プランが先頭）
    const q = query(plansRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as CarePlanDocument[];
  });
}

export interface CarePlanHistoryEntry {
  id: string;
  savedAt: Timestamp;
  status: string;
  shortTermGoalCount: number;
  shortTermGoals: CarePlanDocument['shortTermGoals'];
  needs?: CarePlanDocument['needs'];
  longTermGoal: string;
}

/** ケアプランのスナップショットをhistoryサブコレクションに保存する */
export async function saveCarePlanSnapshot(
  userId: string,
  clientId: string,
  planId: string,
  plan: CarePlanDocument
): Promise<void> {
  return withFirestoreErrorHandling('履歴保存', 'carePlans', async () => {
    const historyRef = collection(
      db,
      ...clientPath(userId, clientId),
      'carePlans',
      planId,
      'history'
    );
    await addDoc(historyRef, {
      savedAt: Timestamp.now(),
      status: plan.status,
      shortTermGoalCount: plan.shortTermGoals?.length ?? 0,
      shortTermGoals: plan.shortTermGoals ?? [],
      needs: plan.needs ?? null,
      longTermGoal: plan.longTermGoal ?? '',
    });
  });
}

/** ケアプランの変更履歴を新しい順で最大10件取得する */
export async function listCarePlanHistory(
  userId: string,
  clientId: string,
  planId: string
): Promise<CarePlanHistoryEntry[]> {
  return withFirestoreErrorHandling('履歴取得', 'carePlans', async () => {
    const historyRef = collection(
      db,
      ...clientPath(userId, clientId),
      'carePlans',
      planId,
      'history'
    );
    const q = query(historyRef, orderBy('savedAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as CarePlanHistoryEntry[];
  });
}

/**
 * ケアプランIDを旧IDから新UUIDへ移行する。
 * 旧プランを削除し、関連するモニタリング・支援経過・担当者会議記録の
 * carePlanId も新IDに一括更新する。
 * @returns 新しいプランID
 */
export async function migrateCarePlanId(
  userId: string,
  clientId: string,
  oldPlanId: string
): Promise<string> {
  const newPlanId = crypto.randomUUID();
  const basePath = clientPath(userId, clientId);

  const oldPlanRef = doc(db, ...basePath, 'carePlans', oldPlanId);
  const oldPlanSnap = await getDoc(oldPlanRef);

  if (!oldPlanSnap.exists()) {
    return newPlanId;
  }

  const batch = writeBatch(db);

  // 新IDでプランを保存
  const newPlanRef = doc(db, ...basePath, 'carePlans', newPlanId);
  batch.set(newPlanRef, {
    ...oldPlanSnap.data(),
    id: newPlanId,
    updatedAt: Timestamp.now(),
  });

  // 旧プラン削除
  batch.delete(oldPlanRef);

  // 関連レコードの carePlanId を更新
  const collectionsToMigrate = [
    'monitoringRecords',
    'supportRecords',
    'serviceMeetingRecords',
  ] as const;

  for (const colName of collectionsToMigrate) {
    const colRef = collection(db, ...basePath, colName);
    const q = query(colRef, where('carePlanId', '==', oldPlanId));
    const snap = await getDocs(q);
    snap.docs.forEach(d => {
      batch.update(d.ref, { carePlanId: newPlanId });
    });
  }

  await batch.commit();
  return newPlanId;
}

// ------------------------------------------------------------------
// Firestore操作: モニタリング記録
// ------------------------------------------------------------------

export interface MonitoringRecordDocument {
  id: string;
  carePlanId: string;
  userId: string;
  recordDate: Timestamp;
  visitDate: Timestamp;
  visitMethod: 'home_visit' | 'online' | 'phone';
  goalEvaluations: Array<{
    goalId: string;
    goalContent: string;
    status: 'achieved' | 'progressing' | 'unchanged' | 'declined' | 'not_evaluated';
    observation: string;
  }>;
  overallCondition: string;
  healthChanges: string;
  livingConditionChanges: string;
  serviceUsageRecords: Array<{
    serviceType: string;
    provider: string;
    plannedFrequency: string;
    actualUsage: string;
    remarks: string;
  }>;
  serviceUsageSummary: string;
  userOpinion: string;
  familyOpinion: string;
  needsPlanRevision: boolean;
  revisionReason: string;
  nextActions: string;
  nextMonitoringDate: Timestamp | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function saveMonitoringRecord(
  userId: string,
  clientId: string,
  recordId: string,
  data: Omit<MonitoringRecordDocument, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  return withFirestoreErrorHandling('保存', 'monitoringRecords', async () => {
    const recordRef = doc(db, ...clientPath(userId, clientId), 'monitoringRecords', recordId);
    const now = Timestamp.now();

    const existingDoc = await getDoc(recordRef);
    const createdAt = existingDoc.exists() ? existingDoc.data().createdAt : now;

    await setDoc(recordRef, {
      ...data,
      createdAt,
      updatedAt: now,
    });
  });
}

export async function getMonitoringRecord(
  userId: string,
  clientId: string,
  recordId: string
): Promise<MonitoringRecordDocument | null> {
  return withFirestoreErrorHandling('取得', 'monitoringRecords', async () => {
    const recordRef = doc(db, ...clientPath(userId, clientId), 'monitoringRecords', recordId);
    const snapshot = await getDoc(recordRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as MonitoringRecordDocument;
  });
}

export async function listMonitoringRecords(
  userId: string,
  clientId: string,
  maxResults: number = 20
): Promise<MonitoringRecordDocument[]> {
  return withFirestoreErrorHandling('一覧取得', 'monitoringRecords', async () => {
    const recordsRef = collection(db, ...clientPath(userId, clientId), 'monitoringRecords');
    const q = query(recordsRef, orderBy('visitDate', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as MonitoringRecordDocument[];
  });
}

export async function listMonitoringRecordsByCarePlan(
  userId: string,
  clientId: string,
  carePlanId: string,
  maxResults: number = 10
): Promise<MonitoringRecordDocument[]> {
  return withFirestoreErrorHandling('一覧取得', 'monitoringRecords', async () => {
    const recordsRef = collection(db, ...clientPath(userId, clientId), 'monitoringRecords');
    const q = query(
      recordsRef,
      where('carePlanId', '==', carePlanId),
      orderBy('visitDate', 'desc'),
      limit(maxResults)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as MonitoringRecordDocument[];
  });
}

export async function deleteMonitoringRecord(userId: string, clientId: string, recordId: string): Promise<void> {
  return withFirestoreErrorHandling('削除', 'monitoringRecords', async () => {
    const recordRef = doc(db, ...clientPath(userId, clientId), 'monitoringRecords', recordId);
    await deleteDoc(recordRef);
  });
}

// ------------------------------------------------------------------
// Firestore操作: 支援経過記録
// ------------------------------------------------------------------

export interface SupportRecordDocument {
  id: string;
  userId: string;
  carePlanId?: string;
  recordDate: Timestamp;
  recordType: 'phone_call' | 'home_visit' | 'office_visit' | 'service_coordination' | 'meeting' | 'document' | 'other';
  actor: string;
  counterpart: string;
  content: string;
  result: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function saveSupportRecord(
  userId: string,
  clientId: string,
  recordId: string,
  data: Omit<SupportRecordDocument, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  return withFirestoreErrorHandling('保存', 'supportRecords', async () => {
    const recordRef = doc(db, ...clientPath(userId, clientId), 'supportRecords', recordId);
    const now = Timestamp.now();

    const existingDoc = await getDoc(recordRef);
    const createdAt = existingDoc.exists() ? existingDoc.data().createdAt : now;

    await setDoc(recordRef, {
      ...data,
      createdAt,
      updatedAt: now,
    });
  });
}

export async function getSupportRecord(
  userId: string,
  clientId: string,
  recordId: string
): Promise<SupportRecordDocument | null> {
  return withFirestoreErrorHandling('取得', 'supportRecords', async () => {
    const recordRef = doc(db, ...clientPath(userId, clientId), 'supportRecords', recordId);
    const snapshot = await getDoc(recordRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as SupportRecordDocument;
  });
}

export async function listSupportRecords(
  userId: string,
  clientId: string,
  maxResults: number = 50
): Promise<SupportRecordDocument[]> {
  return withFirestoreErrorHandling('一覧取得', 'supportRecords', async () => {
    const recordsRef = collection(db, ...clientPath(userId, clientId), 'supportRecords');
    const q = query(recordsRef, orderBy('recordDate', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as SupportRecordDocument[];
  });
}

export async function deleteSupportRecord(userId: string, clientId: string, recordId: string): Promise<void> {
  return withFirestoreErrorHandling('削除', 'supportRecords', async () => {
    const recordRef = doc(db, ...clientPath(userId, clientId), 'supportRecords', recordId);
    await deleteDoc(recordRef);
  });
}

// ------------------------------------------------------------------
// Firestore操作: サービス担当者会議記録
// ------------------------------------------------------------------

export interface ServiceMeetingRecordDocument {
  id: string;
  userId: string;
  carePlanId: string;
  meetingDate: Timestamp;
  meetingLocation: string;
  meetingFormat: 'in_person' | 'online' | 'hybrid';
  meetingPurpose: string;
  attendees: Array<{
    name: string;
    organization: string;
    profession: string;
    attended: boolean;
    inquiryMethod?: string;
    inquiryDate?: string;
    inquiryResponse?: string;
  }>;
  userAttended: boolean;
  userOpinion: string;
  familyAttended: boolean;
  familyOpinion: string;
  agendaItems: Array<{
    id: string;
    topic: string;
    discussion: string;
    conclusion: string;
    responsible?: string;
  }>;
  carePlanExplained: boolean;
  carePlanAgreed: boolean;
  carePlanModifications: string;
  remainingIssues: string;
  nextMeetingSchedule: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function saveServiceMeetingRecord(
  userId: string,
  clientId: string,
  recordId: string,
  data: Omit<ServiceMeetingRecordDocument, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  return withFirestoreErrorHandling('保存', 'serviceMeetingRecords', async () => {
    const recordRef = doc(db, ...clientPath(userId, clientId), 'serviceMeetingRecords', recordId);
    const now = Timestamp.now();

    const existingDoc = await getDoc(recordRef);
    const createdAt = existingDoc.exists() ? existingDoc.data().createdAt : now;

    await setDoc(recordRef, {
      ...data,
      createdAt,
      updatedAt: now,
    });
  });
}

export async function getServiceMeetingRecord(
  userId: string,
  clientId: string,
  recordId: string
): Promise<ServiceMeetingRecordDocument | null> {
  return withFirestoreErrorHandling('取得', 'serviceMeetingRecords', async () => {
    const recordRef = doc(db, ...clientPath(userId, clientId), 'serviceMeetingRecords', recordId);
    const snapshot = await getDoc(recordRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as ServiceMeetingRecordDocument;
  });
}

export async function listServiceMeetingRecords(
  userId: string,
  clientId: string,
  maxResults: number = 20
): Promise<ServiceMeetingRecordDocument[]> {
  return withFirestoreErrorHandling('一覧取得', 'serviceMeetingRecords', async () => {
    const recordsRef = collection(db, ...clientPath(userId, clientId), 'serviceMeetingRecords');
    const q = query(recordsRef, orderBy('meetingDate', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ServiceMeetingRecordDocument[];
  });
}

export async function listServiceMeetingRecordsByCarePlan(
  userId: string,
  clientId: string,
  carePlanId: string
): Promise<ServiceMeetingRecordDocument[]> {
  return withFirestoreErrorHandling('一覧取得', 'serviceMeetingRecords', async () => {
    const recordsRef = collection(db, ...clientPath(userId, clientId), 'serviceMeetingRecords');
    const q = query(
      recordsRef,
      where('carePlanId', '==', carePlanId),
      orderBy('meetingDate', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ServiceMeetingRecordDocument[];
  });
}

export async function deleteServiceMeetingRecord(userId: string, clientId: string, recordId: string): Promise<void> {
  return withFirestoreErrorHandling('削除', 'serviceMeetingRecords', async () => {
    const recordRef = doc(db, ...clientPath(userId, clientId), 'serviceMeetingRecords', recordId);
    await deleteDoc(recordRef);
  });
}

// ------------------------------------------------------------------
// アクセス制御: メール許可リスト
// ------------------------------------------------------------------

export async function checkEmailAllowed(email: string | null): Promise<boolean> {
  // Emulator環境ではチェックをスキップ
  if (isEmulator) return true;
  if (!email) return false;

  return withFirestoreErrorHandling('確認', 'allowed_emails', async () => {
    const emailRef = doc(db, 'allowed_emails', email);
    const snapshot = await getDoc(emailRef);
    return snapshot.exists();
  });
}

// ------------------------------------------------------------------
// 利用ログ記録
// ------------------------------------------------------------------

export async function logUsage(userId: string, action: string): Promise<void> {
  // エラーは握りつぶす（ログ失敗でアプリを止めない）
  try {
    const logsRef = collection(db, 'usage_logs');
    await addDoc(logsRef, {
      userId,
      action,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.warn('Usage logging failed:', error);
  }
}
