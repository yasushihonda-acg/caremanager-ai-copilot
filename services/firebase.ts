import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

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

// Firestore操作: アセスメント
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
  assessmentId: string,
  data: { content: Record<string, string>; summary: string }
): Promise<void> {
  const assessmentRef = doc(db, 'users', userId, 'assessments', assessmentId);
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

export async function getAssessment(userId: string, assessmentId: string): Promise<AssessmentDocument | null> {
  const assessmentRef = doc(db, 'users', userId, 'assessments', assessmentId);
  const snapshot = await getDoc(assessmentRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as AssessmentDocument;
}

export async function listAssessments(userId: string): Promise<AssessmentDocument[]> {
  const assessmentsRef = collection(db, 'users', userId, 'assessments');
  const snapshot = await getDocs(assessmentsRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AssessmentDocument[];
}

export async function deleteAssessment(userId: string, assessmentId: string): Promise<void> {
  const assessmentRef = doc(db, 'users', userId, 'assessments', assessmentId);
  await deleteDoc(assessmentRef);
}

// Firestore操作: ケアプラン
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

export async function saveCarePlan(userId: string, planId: string, data: Partial<CarePlanDocument>): Promise<void> {
  const planRef = doc(db, 'users', userId, 'carePlans', planId);
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

export async function getCarePlan(userId: string, planId: string): Promise<CarePlanDocument | null> {
  const planRef = doc(db, 'users', userId, 'carePlans', planId);
  const snapshot = await getDoc(planRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as CarePlanDocument;
}

export async function listCarePlans(userId: string): Promise<CarePlanDocument[]> {
  const plansRef = collection(db, 'users', userId, 'carePlans');
  const snapshot = await getDocs(plansRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CarePlanDocument[];
}
