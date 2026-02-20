import { Page, expect } from '@playwright/test';

/**
 * Emulator環境で自動ログイン完了を待つ。
 * signInAsTestUser() がトリガーされ、ヘッダーに「ログイン中」が表示されるのを待機。
 */
export async function waitForAutoLogin(page: Page) {
  // オンボーディングモーダルをスキップ（localStorageを事前設定）
  await page.addInitScript(() => {
    localStorage.setItem('caremanager_onboarding_completed', 'true');
  });
  await page.goto('/');
  // デモバナーが表示されるまで待機（アプリ読み込み完了の指標）
  await expect(page.getByText('デモ環境')).toBeVisible({ timeout: 15_000 });
  // 自動ログイン完了を待機
  await expect(page.getByText('ログイン中')).toBeVisible({ timeout: 10_000 });
}

/**
 * ダッシュボードから利用者一覧へ遷移する
 */
export async function navigateToClientList(page: Page) {
  await page.getByRole('button', { name: '利用者一覧' }).click();
  await expect(page.getByText('新規登録')).toBeVisible();
}

/**
 * 利用者一覧から指定の利用者を選択する
 */
export async function selectClient(page: Page, clientName: string) {
  await page.getByText(clientName).click();
  // ClientContextBarが表示されるまで待機
  await expect(page.getByText(clientName)).toBeVisible();
}

/**
 * タブを切り替える（テキストが hidden sm:inline のため、モバイルではアイコンを使う）
 * デスクトップビューポートではテキストで選択可能
 */
export async function switchTab(page: Page, tabLabel: string) {
  // テキストラベルが見えるならクリック
  const tab = page.getByText(tabLabel, { exact: true });
  await tab.click();
}
