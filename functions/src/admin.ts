import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

const REGION = 'asia-northeast1';

interface AuthInfo {
  uid: string;
  token: Record<string, unknown>;
}

// ------------------------------------------------------------------
// ヘルパー: Admin権限チェック
// ------------------------------------------------------------------
function requireAdmin(auth: AuthInfo | undefined): asserts auth is AuthInfo {
  if (!auth) {
    throw new HttpsError('unauthenticated', '認証が必要です');
  }
  if (auth.token.admin !== true) {
    throw new HttpsError('permission-denied', '管理者権限が必要です');
  }
}

// ------------------------------------------------------------------
// listAllowedEmails: 許可メール一覧取得（admin限定）
// ------------------------------------------------------------------
export const listAllowedEmails = onCall({ region: REGION }, async (request) => {
  const auth = request.auth as AuthInfo | undefined;
  requireAdmin(auth);

  const db = admin.firestore();
  const snapshot = await db.collection('allowed_emails').orderBy('createdAt', 'desc').get();

  const emails = snapshot.docs.map((doc) => ({
    email: doc.id,
    ...doc.data(),
  }));

  logger.info(`listAllowedEmails: ${emails.length} entries returned`, { uid: auth.uid });

  return { emails };
});

// ------------------------------------------------------------------
// manageAllowedEmail: メール追加/削除（admin限定）
// ------------------------------------------------------------------
interface ManageAllowedEmailData {
  action: 'add' | 'remove';
  email: string;
  note?: string;
}

export const manageAllowedEmail = onCall({ region: REGION }, async (request) => {
  const auth = request.auth as AuthInfo | undefined;
  requireAdmin(auth);

  const { action, email, note } = request.data as ManageAllowedEmailData;

  // バリデーション
  if (!action || !['add', 'remove'].includes(action)) {
    throw new HttpsError('invalid-argument', 'action は "add" または "remove" を指定してください');
  }
  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'email は必須です');
  }

  // メール形式の簡易バリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new HttpsError('invalid-argument', '有効なメールアドレスを入力してください');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = admin.firestore();
  const emailRef = db.collection('allowed_emails').doc(normalizedEmail);

  if (action === 'add') {
    await emailRef.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: auth.token.email as string ?? auth.uid,
      note: note ?? '',
    });
    logger.info(`manageAllowedEmail: added ${normalizedEmail}`, {
      uid: auth.uid,
      addedEmail: normalizedEmail,
    });
    return { success: true, message: `${normalizedEmail} を追加しました` };
  }

  // action === 'remove'
  // 自分自身の削除防止
  if (normalizedEmail === auth.token.email) {
    throw new HttpsError('failed-precondition', '自分自身を削除することはできません');
  }

  const docSnap = await emailRef.get();
  if (!docSnap.exists) {
    throw new HttpsError('not-found', `${normalizedEmail} は許可リストに存在しません`);
  }

  await emailRef.delete();
  logger.info(`manageAllowedEmail: removed ${normalizedEmail}`, {
    uid: auth.uid,
    removedEmail: normalizedEmail,
  });
  return { success: true, message: `${normalizedEmail} を削除しました` };
});
