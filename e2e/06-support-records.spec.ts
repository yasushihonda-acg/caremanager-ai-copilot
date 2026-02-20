import { test, expect } from '@playwright/test';
import { waitForAutoLogin, navigateToClientList, selectClient, switchTab } from './helpers';

test.describe('支援経過記録', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAutoLogin(page);
    await navigateToClientList(page);
    await selectClient(page, '田中 花子');
    await switchTab(page, '支援経過');
  });

  test('支援経過記録タブが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /支援経過記録/ }).first()).toBeVisible();
  });

  test('既存の支援経過記録が一覧表示される', async ({ page }) => {
    // シードデータの支援経過記録
    await expect(page.getByText(/長女|田中美咲/)).toBeVisible({ timeout: 5000 });
  });

  test('支援経過記録の基本情報セクションが表示される', async ({ page }) => {
    await expect(page.getByText('基本情報')).toBeVisible({ timeout: 5000 });
  });
});
