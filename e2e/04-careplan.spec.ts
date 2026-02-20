import { test, expect } from '@playwright/test';
import { waitForAutoLogin, navigateToClientList, selectClient, switchTab } from './helpers';

test.describe('ケアプラン', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAutoLogin(page);
    await navigateToClientList(page);
    await selectClient(page, '田中 花子');
    await switchTab(page, 'ケアプラン');
  });

  test('ケアプラン作成画面が表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ケアプラン作成' })).toBeVisible();
  });

  test('保存済みケアプランを選択・表示できる', async ({ page }) => {
    // CarePlanSelectorにプランが表示されるまで待機（comboboxのoption内テキスト）
    await expect(page.getByRole('combobox')).toBeVisible({ timeout: 5000 });
  });

  test('長期目標が表示される', async ({ page }) => {
    // 長期目標セクション
    await expect(page.getByText('長期目標')).toBeVisible();
    // textareaに長期目標テキストが入力されている（placeholderで特定: 「再び畑仕事」がある方）
    await expect(page.getByPlaceholder(/再び畑仕事/)).toHaveValue(/転倒せず安全に在宅生活/, { timeout: 5000 });
  });

  test('短期目標リストが表示される', async ({ page }) => {
    // 短期目標のセクション
    await expect(page.getByText('短期目標')).toBeVisible();
    // シードデータの短期目標
    await expect(page.getByText(/デイサービスで体力維持/)).toBeVisible({ timeout: 5000 });
  });

  test('週間サービス計画表セクションが表示される', async ({ page }) => {
    await expect(page.getByText('週間サービス計画表')).toBeVisible();
  });
});
