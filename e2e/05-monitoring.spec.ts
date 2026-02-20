import { test, expect } from '@playwright/test';
import { waitForAutoLogin, navigateToClientList, selectClient, switchTab } from './helpers';

test.describe('モニタリング記録', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAutoLogin(page);
    await navigateToClientList(page);
    await selectClient(page, '田中 花子');
    await switchTab(page, 'モニタリング');
  });

  test('モニタリング記録一覧が表示される', async ({ page }) => {
    await expect(page.getByText('モニタリング記録')).toBeVisible();
  });

  test('既存のモニタリング記録が表示される', async ({ page }) => {
    // シードデータのモニタリング記録が一覧に表示される
    await expect(page.getByText(/居宅訪問|home_visit/)).toBeVisible({ timeout: 5000 });
  });

  test('新規作成ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '新規作成' })).toBeVisible();
  });
});
