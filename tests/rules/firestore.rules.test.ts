/**
 * Firestoreセキュリティルールテスト
 * Issue #40: Firestoreセキュリティルールテスト追加
 *
 * 前提: Firestoreエミュレータが起動済みであること（port 8080）
 * 実行: npm run test:rules
 *       または firebase emulators:exec --only firestore "vitest run tests/rules"
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { afterAll, beforeAll, describe, test } from 'vitest';

// -------------------------------------------------------------------
// 定数
// -------------------------------------------------------------------
const PROJECT_ID = 'caremanager-ai-copilot-486212';
const RULES_PATH = resolve(__dirname, '../../firestore.rules');

let testEnv: RulesTestEnvironment;

// -------------------------------------------------------------------
// セットアップ / テアダウン
// -------------------------------------------------------------------
beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

// -------------------------------------------------------------------
// ヘルパー
// -------------------------------------------------------------------
function authCtx(uid: string, email?: string) {
  return testEnv.authenticatedContext(uid, email ? { email } : undefined);
}

function anonCtx() {
  return testEnv.unauthenticatedContext();
}

// テスト用パス生成ヘルパー
function userPath(uid: string) {
  return `users/${uid}`;
}
function clientPath(uid: string, clientId = 'client1') {
  return `users/${uid}/clients/${clientId}`;
}
function assessmentPath(uid: string, clientId = 'client1', id = 'a1') {
  return `${clientPath(uid, clientId)}/assessments/${id}`;
}
function carePlanPath(uid: string, clientId = 'client1', id = 'p1') {
  return `${clientPath(uid, clientId)}/carePlans/${id}`;
}
function historyPath(uid: string, clientId = 'client1', planId = 'p1', id = 'h1') {
  return `${carePlanPath(uid, clientId, planId)}/history/${id}`;
}
function monitoringPath(uid: string, clientId = 'client1', id = 'm1') {
  return `${clientPath(uid, clientId)}/monitoringRecords/${id}`;
}
function supportPath(uid: string, clientId = 'client1', id = 's1') {
  return `${clientPath(uid, clientId)}/supportRecords/${id}`;
}
function meetingPath(uid: string, clientId = 'client1', id = 'r1') {
  return `${clientPath(uid, clientId)}/serviceMeetingRecords/${id}`;
}

const SAMPLE_DATA = { value: 'test' };

// -------------------------------------------------------------------
// 1. 未認証ユーザーのアクセス拒否
// -------------------------------------------------------------------
describe('未認証ユーザーのアクセス拒否', () => {
  const anon = () => anonCtx();

  test('users コレクションへの読み取りが拒否される', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, userPath('alice'))));
  });

  test('users コレクションへの書き込みが拒否される', async () => {
    const db = anon().firestore();
    await assertFails(setDoc(doc(db, userPath('alice')), SAMPLE_DATA));
  });

  test('clients コレクションへの読み取りが拒否される', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, clientPath('alice'))));
  });

  test('clients コレクションへの書き込みが拒否される', async () => {
    const db = anon().firestore();
    await assertFails(setDoc(doc(db, clientPath('alice')), SAMPLE_DATA));
  });

  test('assessments への読み取りが拒否される', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, assessmentPath('alice'))));
  });

  test('carePlans への読み取りが拒否される', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, carePlanPath('alice'))));
  });

  test('monitoringRecords への読み取りが拒否される', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, monitoringPath('alice'))));
  });

  test('usage_logs への書き込みが拒否される', async () => {
    const db = anon().firestore();
    await assertFails(addDoc(collection(db, 'usage_logs'), SAMPLE_DATA));
  });

  test('feedback への書き込みが拒否される', async () => {
    const db = anon().firestore();
    await assertFails(addDoc(collection(db, 'feedback'), SAMPLE_DATA));
  });

  test('allowed_emails への読み取りが拒否される', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, 'allowed_emails/user@example.com')));
  });
});

// -------------------------------------------------------------------
// 2. 認証済みユーザーが自分のデータを読み書きできる
// -------------------------------------------------------------------
describe('認証済みユーザーが自分のデータを操作できる', () => {
  const UID = 'alice';

  test('自分の users ドキュメントを読み書きできる', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), userPath(UID)), SAMPLE_DATA);
    });
    const db = authCtx(UID).firestore();
    await assertSucceeds(getDoc(doc(db, userPath(UID))));
    await assertSucceeds(setDoc(doc(db, userPath(UID)), { updated: true }));
  });

  test('自分の clients を読み書きできる', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), clientPath(UID)), SAMPLE_DATA);
    });
    const db = authCtx(UID).firestore();
    await assertSucceeds(getDoc(doc(db, clientPath(UID))));
    await assertSucceeds(setDoc(doc(db, clientPath(UID)), { name: 'Test' }));
  });

  test('自分の assessments を読み書きできる', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), assessmentPath(UID)), SAMPLE_DATA);
    });
    const db = authCtx(UID).firestore();
    await assertSucceeds(getDoc(doc(db, assessmentPath(UID))));
    await assertSucceeds(setDoc(doc(db, assessmentPath(UID)), SAMPLE_DATA));
  });

  test('自分の carePlans を読み書きできる', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), carePlanPath(UID)), SAMPLE_DATA);
    });
    const db = authCtx(UID).firestore();
    await assertSucceeds(getDoc(doc(db, carePlanPath(UID))));
    await assertSucceeds(setDoc(doc(db, carePlanPath(UID)), SAMPLE_DATA));
  });

  test('自分の carePlan history を読み書きできる', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), historyPath(UID)), SAMPLE_DATA);
    });
    const db = authCtx(UID).firestore();
    await assertSucceeds(getDoc(doc(db, historyPath(UID))));
    await assertSucceeds(setDoc(doc(db, historyPath(UID)), SAMPLE_DATA));
  });

  test('自分の monitoringRecords を読み書きできる', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), monitoringPath(UID)), SAMPLE_DATA);
    });
    const db = authCtx(UID).firestore();
    await assertSucceeds(getDoc(doc(db, monitoringPath(UID))));
    await assertSucceeds(setDoc(doc(db, monitoringPath(UID)), SAMPLE_DATA));
  });

  test('自分の supportRecords を読み書きできる', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), supportPath(UID)), SAMPLE_DATA);
    });
    const db = authCtx(UID).firestore();
    await assertSucceeds(getDoc(doc(db, supportPath(UID))));
    await assertSucceeds(setDoc(doc(db, supportPath(UID)), SAMPLE_DATA));
  });

  test('自分の serviceMeetingRecords を読み書きできる', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), meetingPath(UID)), SAMPLE_DATA);
    });
    const db = authCtx(UID).firestore();
    await assertSucceeds(getDoc(doc(db, meetingPath(UID))));
    await assertSucceeds(setDoc(doc(db, meetingPath(UID)), SAMPLE_DATA));
  });
});

// -------------------------------------------------------------------
// 3. 他ユーザーのデータにアクセスできない（権限境界）
// -------------------------------------------------------------------
describe('他ユーザーのデータへのアクセス拒否', () => {
  const OWNER = 'alice';
  const OTHER = 'bob';

  beforeAll(async () => {
    // オーナーのデータを事前作成
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, userPath(OWNER)), SAMPLE_DATA);
      await setDoc(doc(db, clientPath(OWNER)), SAMPLE_DATA);
      await setDoc(doc(db, assessmentPath(OWNER)), SAMPLE_DATA);
      await setDoc(doc(db, carePlanPath(OWNER)), SAMPLE_DATA);
      await setDoc(doc(db, monitoringPath(OWNER)), SAMPLE_DATA);
      await setDoc(doc(db, supportPath(OWNER)), SAMPLE_DATA);
      await setDoc(doc(db, meetingPath(OWNER)), SAMPLE_DATA);
    });
  });

  test('他ユーザーの users ドキュメントを読めない', async () => {
    const db = authCtx(OTHER).firestore();
    await assertFails(getDoc(doc(db, userPath(OWNER))));
  });

  test('他ユーザーの users ドキュメントに書き込めない', async () => {
    const db = authCtx(OTHER).firestore();
    await assertFails(setDoc(doc(db, userPath(OWNER)), SAMPLE_DATA));
  });

  test('他ユーザーの clients を読めない', async () => {
    const db = authCtx(OTHER).firestore();
    await assertFails(getDoc(doc(db, clientPath(OWNER))));
  });

  test('他ユーザーの clients に書き込めない', async () => {
    const db = authCtx(OTHER).firestore();
    await assertFails(setDoc(doc(db, clientPath(OWNER)), SAMPLE_DATA));
  });

  test('他ユーザーの assessments を読めない', async () => {
    const db = authCtx(OTHER).firestore();
    await assertFails(getDoc(doc(db, assessmentPath(OWNER))));
  });

  test('他ユーザーの carePlans を読めない', async () => {
    const db = authCtx(OTHER).firestore();
    await assertFails(getDoc(doc(db, carePlanPath(OWNER))));
  });

  test('他ユーザーの monitoringRecords を読めない', async () => {
    const db = authCtx(OTHER).firestore();
    await assertFails(getDoc(doc(db, monitoringPath(OWNER))));
  });

  test('他ユーザーの supportRecords を読めない', async () => {
    const db = authCtx(OTHER).firestore();
    await assertFails(getDoc(doc(db, supportPath(OWNER))));
  });

  test('他ユーザーの serviceMeetingRecords を読めない', async () => {
    const db = authCtx(OTHER).firestore();
    await assertFails(getDoc(doc(db, meetingPath(OWNER))));
  });
});

// -------------------------------------------------------------------
// 4. allowed_emails コレクションの保護
// -------------------------------------------------------------------
describe('allowed_emails コレクションの保護', () => {
  const EMAIL = 'user@example.com';
  const UID = 'carol';

  beforeAll(async () => {
    // テスト用データを事前作成
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `allowed_emails/${EMAIL}`), { active: true });
    });
  });

  test('認証済みユーザーが自分のメールエントリを読める', async () => {
    const db = authCtx(UID, EMAIL).firestore();
    await assertSucceeds(getDoc(doc(db, `allowed_emails/${EMAIL}`)));
  });

  test('他のメールアドレスのエントリは読めない', async () => {
    const db = authCtx(UID, 'other@example.com').firestore();
    await assertFails(getDoc(doc(db, `allowed_emails/${EMAIL}`)));
  });

  test('認証済みユーザーでも allowed_emails に書き込めない', async () => {
    const db = authCtx(UID, EMAIL).firestore();
    await assertFails(setDoc(doc(db, `allowed_emails/new@example.com`), { active: true }));
  });

  test('自分のメールエントリでも更新できない', async () => {
    const db = authCtx(UID, EMAIL).firestore();
    await assertFails(updateDoc(doc(db, `allowed_emails/${EMAIL}`), { active: false }));
  });

  test('自分のメールエントリでも削除できない', async () => {
    const db = authCtx(UID, EMAIL).firestore();
    await assertFails(deleteDoc(doc(db, `allowed_emails/${EMAIL}`)));
  });

  test('未認証ユーザーは allowed_emails を読めない', async () => {
    const db = anonCtx().firestore();
    await assertFails(getDoc(doc(db, `allowed_emails/${EMAIL}`)));
  });
});

// -------------------------------------------------------------------
// 5. usage_logs の監査ログ不変性
// -------------------------------------------------------------------
describe('usage_logs への書き込み制御', () => {
  test('認証済みユーザーが usage_logs に書き込める', async () => {
    const db = authCtx('dave').firestore();
    await assertSucceeds(
      addDoc(collection(db, 'usage_logs'), { action: 'test', timestamp: Date.now() })
    );
  });

  test('未認証ユーザーは usage_logs に書き込めない', async () => {
    const db = anonCtx().firestore();
    await assertFails(addDoc(collection(db, 'usage_logs'), SAMPLE_DATA));
  });

  test('usage_logs の読み取りは拒否される（認証済みでも）', async () => {
    const db = authCtx('dave').firestore();
    await assertFails(getDocs(collection(db, 'usage_logs')));
  });

  test('usage_logs の更新は拒否される', async () => {
    let logId = 'dummy_id';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), 'usage_logs'), SAMPLE_DATA);
      logId = ref.id;
    });
    const db = authCtx('dave').firestore();
    await assertFails(updateDoc(doc(db, 'usage_logs', logId), { tampered: true }));
  });

  test('usage_logs の削除は拒否される', async () => {
    let logId = 'dummy_id2';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), 'usage_logs'), SAMPLE_DATA);
      logId = ref.id;
    });
    const db = authCtx('dave').firestore();
    await assertFails(deleteDoc(doc(db, 'usage_logs', logId)));
  });
});

// -------------------------------------------------------------------
// 6. feedback の書き込み制御
// -------------------------------------------------------------------
describe('feedback への書き込み制御', () => {
  test('認証済みユーザーが feedback を作成できる', async () => {
    const db = authCtx('eve').firestore();
    await assertSucceeds(
      addDoc(collection(db, 'feedback'), { message: 'Great app!', timestamp: Date.now() })
    );
  });

  test('未認証ユーザーは feedback を作成できない', async () => {
    const db = anonCtx().firestore();
    await assertFails(addDoc(collection(db, 'feedback'), SAMPLE_DATA));
  });

  test('feedback の読み取りは拒否される（認証済みでも）', async () => {
    const db = authCtx('eve').firestore();
    await assertFails(getDocs(collection(db, 'feedback')));
  });

  test('feedback の更新は拒否される', async () => {
    let fbId = 'dummy_fb';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), 'feedback'), SAMPLE_DATA);
      fbId = ref.id;
    });
    const db = authCtx('eve').firestore();
    await assertFails(updateDoc(doc(db, 'feedback', fbId), { tampered: true }));
  });

  test('feedback の削除は拒否される', async () => {
    let fbId = 'dummy_fb2';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), 'feedback'), SAMPLE_DATA);
      fbId = ref.id;
    });
    const db = authCtx('eve').firestore();
    await assertFails(deleteDoc(doc(db, 'feedback', fbId)));
  });
});
