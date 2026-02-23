import { execSync } from 'child_process';
import { createServer } from 'node:http';
import { initializeApp as adminInitializeApp, deleteApp as adminDeleteApp } from 'firebase-admin/app';
import { getAuth as adminGetAuth } from 'firebase-admin/auth';

/** E2Eカスタムトークンを提供するローカルサーバーのポート番号 */
const E2E_TOKEN_PORT = 19999;
const TEST_USER_UID = 'test-user-uid';

/**
 * Playwright グローバルセットアップ
 * E2Eテスト実行前にFirebase Emulatorへの接続を確認し、シードデータを投入する。
 *
 * 前提: Firebase Emulator が起動済みであること（npm run dev:emulator または npm run demo）
 */
export default async function globalSetup() {
  // Emulatorの起動確認（Auth: 9099）
  try {
    const res = await fetch('http://localhost:9099');
    if (!res.ok && res.status !== 404) {
      throw new Error(`Emulator returned ${res.status}`);
    }
  } catch (err: unknown) {
    const isConnectionError =
      err instanceof TypeError && err.message.includes('fetch failed');
    if (isConnectionError) {
      console.error('\n❌ Firebase Emulatorが起動していません。');
      console.error(
        '   先に以下のいずれかを実行してください:\n' +
        '   - npm run dev:emulator   # Emulatorのみ起動\n' +
        '   - npm run demo           # デモ環境フル起動\n'
      );
      process.exit(1);
    }
    // 404等はEmulator起動済みとみなす（ok）
  }

  // Firestore Emulatorのデータをクリア（テスト間の汚染を防ぐ）
  const FIRESTORE_URL = 'http://localhost:8080/emulator/v1/projects/caremanager-ai-copilot-486212/databases/(default)/documents';
  await fetch(FIRESTORE_URL, { method: 'DELETE' });

  // シードデータ投入（クリア後に再投入）
  console.log('\n🌱 シードデータを投入しています...');
  execSync('npx tsx scripts/seed.ts test-user-uid --emulator', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('✅ シードデータ投入完了\n');

  // firebase-admin でカスタムトークンを生成
  // Auth Emulatorのパスワードハッシュが古いUIDを返すバグを回避するため、
  // signInWithCustomToken を使って test-user-uid として確実に認証する
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  const adminApp = adminInitializeApp(
    { projectId: 'caremanager-ai-copilot-486212' },
    'global-setup'
  );
  const customToken = await adminGetAuth(adminApp).createCustomToken(TEST_USER_UID, { admin: true });
  await adminDeleteApp(adminApp);

  // カスタムトークンをローカルHTTPサーバーで提供（テスト中のみ稼働）
  const server = createServer((req, res) => {
    if (req.url === '/e2e-token') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ token: customToken }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise<void>((resolve) => server.listen(E2E_TOKEN_PORT, resolve));
  console.log(`✅ E2Eトークンサーバー起動 (port: ${E2E_TOKEN_PORT})\n`);

  // テアダウン: テスト完了後にサーバーを停止
  return async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };
}
