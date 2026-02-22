/**
 * 管理者Custom Claims設定スクリプト
 *
 * Usage:
 *   npx tsx scripts/set-admin.ts <email>
 *
 * 前提: gcloud auth login 済み & gcloud config set project caremanager-ai-copilot-486212
 *
 * 処理:
 *   1. Identity Toolkit API で email → UID 変換
 *   2. UID に admin: true の Custom Claims を設定
 */
import { execSync } from 'child_process';

const PROJECT_ID = 'caremanager-ai-copilot-486212';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npx tsx scripts/set-admin.ts <email>');
  process.exit(1);
}

async function main() {
  const accessToken = execSync('gcloud auth print-access-token', { encoding: 'utf-8' }).trim();

  console.log(`\n🔐 管理者設定: ${email}`);
  console.log(`   Project: ${PROJECT_ID}`);

  // Step 1: email → UID
  console.log('\n1. ユーザー情報を取得中...');
  const lookupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-goog-user-project': PROJECT_ID,
      },
      body: JSON.stringify({ email: [email] }),
    }
  );

  const lookupData = await lookupRes.json() as {
    users?: Array<{ localId: string; email: string }>;
    error?: { message: string };
  };

  if (!lookupRes.ok || !lookupData.users || lookupData.users.length === 0) {
    console.error(`   ❌ ユーザーが見つかりません: ${email}`);
    console.error(`   エラー: ${lookupData.error?.message ?? 'ユーザーが存在しません'}`);
    process.exit(1);
  }

  const uid = lookupData.users[0].localId;
  console.log(`   ✓ UID: ${uid}`);

  // Step 2: Custom Claims 設定
  console.log('\n2. Custom Claims (admin: true) を設定中...');
  const updateRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-goog-user-project': PROJECT_ID,
      },
      body: JSON.stringify({
        localId: uid,
        customAttributes: JSON.stringify({ admin: true }),
      }),
    }
  );

  const updateData = await updateRes.json() as { error?: { message: string } };

  if (!updateRes.ok) {
    console.error(`   ❌ Custom Claims設定失敗: ${updateData.error?.message ?? 'Unknown error'}`);
    process.exit(1);
  }

  console.log(`   ✓ Custom Claims設定完了`);
  console.log(`\n✅ ${email} を管理者に設定しました`);
  console.log('   ※ ブラウザで再ログイン（またはトークンリフレッシュ）が必要です');
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
