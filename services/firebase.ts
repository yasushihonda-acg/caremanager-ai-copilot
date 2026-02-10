import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, Timestamp, query, orderBy, limit, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { ClientInput } from '../types';

// Firebase設定
const firebaseConfig = {
  apiKey: 'AIzaSyCIYASXY_ALRX-VSwR4oZVjN4Ntit7lPi4',
  authDomain: 'caremanager-ai-copilot.firebaseapp.com',
  projectId: 'caremanager-ai-copilot',
  storageBucket: 'caremanager-ai-copilot.firebasestorage.app',
  messagingSenderId: '624222634250',
  appId: '1:624222634250:web:2b2d8d89fc466864417af3',
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-northeast1');

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

// Vertex AI呼び出し（Cloud Functions経由）
interface AnalyzeAssessmentRequest {
  audioBase64: string;
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

// Firestore操作: ユーザープロファイル
export async function saveUserProfile(userId: string, data: { displayName: string; email: string }): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      ...data,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
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
  phone?: string;
  insurerNumber?: string;
  insuredNumber?: string;
  certificationDate?: string;
  certificationExpiry?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function saveClient(
  userId: string,
  clientId: string,
  data: ClientInput
): Promise<void> {
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
}

export async function getClient(
  userId: string,
  clientId: string
): Promise<ClientDocument | null> {
  const clientRef = doc(db, 'users', userId, 'clients', clientId);
  const snapshot = await getDoc(clientRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as ClientDocument;
}

export async function listClients(
  userId: string
): Promise<ClientDocument[]> {
  const clientsRef = collection(db, 'users', userId, 'clients');
  const q = query(clientsRef, where('isActive', '==', true), orderBy('kana', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as ClientDocument[];
}

export async function archiveClient(
  userId: string,
  clientId: string
): Promise<void> {
  const clientRef = doc(db, 'users', userId, 'clients', clientId);
  await setDoc(
    clientRef,
    {
      isActive: false,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
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
}

export async function getAssessment(userId: string, clientId: string, assessmentId: string): Promise<AssessmentDocument | null> {
  const assessmentRef = doc(db, ...clientPath(userId, clientId), 'assessments', assessmentId);
  const snapshot = await getDoc(assessmentRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as AssessmentDocument;
}

export async function listAssessments(userId: string, clientId: string): Promise<AssessmentDocument[]> {
  const assessmentsRef = collection(db, ...clientPath(userId, clientId), 'assessments');
  const snapshot = await getDocs(assessmentsRef);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as AssessmentDocument[];
}

export async function deleteAssessment(userId: string, clientId: string, assessmentId: string): Promise<void> {
  const assessmentRef = doc(db, ...clientPath(userId, clientId), 'assessments', assessmentId);
  await deleteDoc(assessmentRef);
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
  shortTermGoals: Array<{
    id: string;
    content: string;
    status: 'not_started' | 'in_progress' | 'achieved' | 'discontinued';
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function saveCarePlan(userId: string, clientId: string, planId: string, data: Partial<CarePlanDocument>): Promise<void> {
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
}

export async function getCarePlan(userId: string, clientId: string, planId: string): Promise<CarePlanDocument | null> {
  const planRef = doc(db, ...clientPath(userId, clientId), 'carePlans', planId);
  const snapshot = await getDoc(planRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as CarePlanDocument;
}

export async function listCarePlans(userId: string, clientId: string): Promise<CarePlanDocument[]> {
  const plansRef = collection(db, ...clientPath(userId, clientId), 'carePlans');
  const snapshot = await getDocs(plansRef);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as CarePlanDocument[];
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
  const recordRef = doc(db, ...clientPath(userId, clientId), 'monitoringRecords', recordId);
  const now = Timestamp.now();

  const existingDoc = await getDoc(recordRef);
  const createdAt = existingDoc.exists() ? existingDoc.data().createdAt : now;

  await setDoc(recordRef, {
    ...data,
    createdAt,
    updatedAt: now,
  });
}

export async function getMonitoringRecord(
  userId: string,
  clientId: string,
  recordId: string
): Promise<MonitoringRecordDocument | null> {
  const recordRef = doc(db, ...clientPath(userId, clientId), 'monitoringRecords', recordId);
  const snapshot = await getDoc(recordRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as MonitoringRecordDocument;
}

export async function listMonitoringRecords(
  userId: string,
  clientId: string,
  maxResults: number = 20
): Promise<MonitoringRecordDocument[]> {
  const recordsRef = collection(db, ...clientPath(userId, clientId), 'monitoringRecords');
  const q = query(recordsRef, orderBy('visitDate', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as MonitoringRecordDocument[];
}

export async function listMonitoringRecordsByCarePlan(
  userId: string,
  clientId: string,
  carePlanId: string,
  maxResults: number = 10
): Promise<MonitoringRecordDocument[]> {
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
}

export async function deleteMonitoringRecord(userId: string, clientId: string, recordId: string): Promise<void> {
  const recordRef = doc(db, ...clientPath(userId, clientId), 'monitoringRecords', recordId);
  await deleteDoc(recordRef);
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
  const recordRef = doc(db, ...clientPath(userId, clientId), 'supportRecords', recordId);
  const now = Timestamp.now();

  const existingDoc = await getDoc(recordRef);
  const createdAt = existingDoc.exists() ? existingDoc.data().createdAt : now;

  await setDoc(recordRef, {
    ...data,
    createdAt,
    updatedAt: now,
  });
}

export async function getSupportRecord(
  userId: string,
  clientId: string,
  recordId: string
): Promise<SupportRecordDocument | null> {
  const recordRef = doc(db, ...clientPath(userId, clientId), 'supportRecords', recordId);
  const snapshot = await getDoc(recordRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as SupportRecordDocument;
}

export async function listSupportRecords(
  userId: string,
  clientId: string,
  maxResults: number = 50
): Promise<SupportRecordDocument[]> {
  const recordsRef = collection(db, ...clientPath(userId, clientId), 'supportRecords');
  const q = query(recordsRef, orderBy('recordDate', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as SupportRecordDocument[];
}

export async function deleteSupportRecord(userId: string, clientId: string, recordId: string): Promise<void> {
  const recordRef = doc(db, ...clientPath(userId, clientId), 'supportRecords', recordId);
  await deleteDoc(recordRef);
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
  const recordRef = doc(db, ...clientPath(userId, clientId), 'serviceMeetingRecords', recordId);
  const now = Timestamp.now();

  const existingDoc = await getDoc(recordRef);
  const createdAt = existingDoc.exists() ? existingDoc.data().createdAt : now;

  await setDoc(recordRef, {
    ...data,
    createdAt,
    updatedAt: now,
  });
}

export async function getServiceMeetingRecord(
  userId: string,
  clientId: string,
  recordId: string
): Promise<ServiceMeetingRecordDocument | null> {
  const recordRef = doc(db, ...clientPath(userId, clientId), 'serviceMeetingRecords', recordId);
  const snapshot = await getDoc(recordRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as ServiceMeetingRecordDocument;
}

export async function listServiceMeetingRecords(
  userId: string,
  clientId: string,
  maxResults: number = 20
): Promise<ServiceMeetingRecordDocument[]> {
  const recordsRef = collection(db, ...clientPath(userId, clientId), 'serviceMeetingRecords');
  const q = query(recordsRef, orderBy('meetingDate', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as ServiceMeetingRecordDocument[];
}

export async function listServiceMeetingRecordsByCarePlan(
  userId: string,
  clientId: string,
  carePlanId: string
): Promise<ServiceMeetingRecordDocument[]> {
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
}

export async function deleteServiceMeetingRecord(userId: string, clientId: string, recordId: string): Promise<void> {
  const recordRef = doc(db, ...clientPath(userId, clientId), 'serviceMeetingRecords', recordId);
  await deleteDoc(recordRef);
}
