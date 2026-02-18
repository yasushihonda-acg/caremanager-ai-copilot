/**
 * テスト用Cloud Function呼び出しクライアント
 *
 * firebase-admin でカスタムトークンを生成し、
 * Firebase Auth REST API で IDトークンに交換して
 * onCall プロトコルで Cloud Function を呼び出す。
 */

import admin from 'firebase-admin';
import type { AssessmentData } from '../../types';

// ============================================================
// 定数
// ============================================================

const FIREBASE_API_KEY = 'AIzaSyCIYASXY_ALRX-VSwR4oZVjN4Ntit7lPi4';
const PROJECT_ID = 'caremanager-ai-copilot';
const REGION = 'asia-northeast1';
const FUNCTIONS_BASE_URL =
  process.env.FUNCTIONS_URL ||
  `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

// ============================================================
// Firebase Admin 初期化（シングルトン）
// ============================================================

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  return admin.initializeApp({
    projectId: PROJECT_ID,
    serviceAccountId: `${PROJECT_ID}@appspot.gserviceaccount.com`,
  });
}

// ============================================================
// IDトークン取得
// ============================================================

/**
 * firebase-admin でカスタムトークンを作り、
 * Firebase Auth REST API で IDトークンに交換する。
 *
 * ADC (Application Default Credentials) が必要。
 */
export async function getTestIdToken(uid = 'test-evaluator'): Promise<string> {
  const app = getAdminApp();
  const customToken = await app.auth().createCustomToken(uid);

  // Firebase Auth REST API でカスタムトークン → IDトークン
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: customToken,
      returnSecureToken: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`IDトークン取得に失敗: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { idToken: string };
  return data.idToken;
}

// ============================================================
// Cloud Function 呼び出し
// ============================================================

interface CallOptions {
  currentData?: Record<string, string>;
  isFinal?: boolean;
  currentSummary?: string;
}

/**
 * analyzeAssessment Cloud Function をテキストモードで呼び出す。
 *
 * onCall プロトコル: POST { data: {...} } + Authorization: Bearer <idToken>
 */
export async function callAnalyzeAssessmentWithText(
  textInput: string,
  idToken: string,
  options: CallOptions = {}
): Promise<Partial<AssessmentData>> {
  const {
    currentData = {},
    isFinal = true,
    currentSummary = '',
  } = options;

  const url = `${FUNCTIONS_BASE_URL}/analyzeAssessment`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      data: {
        textInput,
        currentData,
        isFinal,
        currentSummary,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloud Function呼び出し失敗: ${res.status} ${body}`);
  }

  const json = (await res.json()) as { result: Partial<AssessmentData> };
  return json.result;
}
