import { execSync } from 'child_process';

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

  // シードデータ投入（冪等: 既存データがあっても上書きされる）
  console.log('\n🌱 シードデータを投入しています...');
  execSync('npx tsx scripts/seed.ts test-user-uid --emulator', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('✅ シードデータ投入完了\n');
}
