import { test, expect } from '@playwright/test';
import { waitForAutoLogin } from './helpers';

test.describe('ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAutoLogin(page);
  });

  test('ログイン後にダッシュボード画面が表示される', async ({ page }) => {
    await expect(page.getByText('業務概況')).toBeVisible();
  });

  test('担当利用者数が表示される', async ({ page }) => {
    await expect(page.getByText(/担当利用者/)).toBeVisible();
  });

  test('要対応リストが表示される', async ({ page }) => {
    await expect(page.getByText('要対応リスト')).toBeVisible();
  });

  test('利用者一覧ボタンをクリックすると一覧画面に遷移する', async ({ page }) => {
    await page.getByRole('button', { name: '利用者一覧' }).click();
    await expect(page.getByText('新規登録')).toBeVisible();
  });
});
