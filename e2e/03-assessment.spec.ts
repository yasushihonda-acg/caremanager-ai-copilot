import { test, expect } from '@playwright/test';
import { waitForAutoLogin, navigateToClientList, selectClient } from './helpers';

test.describe('アセスメント', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAutoLogin(page);
    await navigateToClientList(page);
    await selectClient(page, '田中 花子');
  });

  test('アセスメントタブがデフォルトで表示される', async ({ page }) => {
    await expect(page.getByText('アセスメント (課題分析)')).toBeVisible();
    await expect(page.getByText('23項目完全準拠')).toBeVisible();
  });

  test('保存済みアセスメントを読み込める', async ({ page }) => {
    // 履歴ドロップダウンを開く
    await page.getByRole('button', { name: /履歴/ }).click();

    // 保存済みアセスメントが表示される
    const assessmentItem = page.locator('button').filter({ hasText: /^\d{4}/ }).first();
    await assessmentItem.click();

    // アセスメントデータが読み込まれる（healthStatusフィールド）
    await expect(page.getByText(/高血圧/)).toBeVisible({ timeout: 5000 });
  });

  test('新規アセスメントを作成できる', async ({ page }) => {
    await page.getByRole('button', { name: '新規' }).click();

    // フォームがリセットされる（空の状態）
    await expect(page.getByText('アセスメント (課題分析)')).toBeVisible();
  });
});
