import { test, expect } from '@playwright/test';
import { waitForAutoLogin, navigateToClientList } from './helpers';

test.describe('利用者登録・編集', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAutoLogin(page);
    await navigateToClientList(page);
  });

  test('利用者一覧にシードデータの利用者が表示される', async ({ page }) => {
    await expect(page.getByText('田中 花子')).toBeVisible();
    await expect(page.getByText('佐藤 太郎')).toBeVisible();
    await expect(page.getByText('鈴木 一郎')).toBeVisible();
  });

  test('名前で検索フィルタが機能する', async ({ page }) => {
    await page.getByPlaceholder('名前・フリガナで検索').fill('田中');
    await expect(page.getByText('田中 花子')).toBeVisible();
    await expect(page.getByText('佐藤 太郎')).not.toBeVisible();
  });

  test('新規登録フォームを開いて利用者を登録できる', async ({ page }) => {
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page.getByText('新規利用者登録')).toBeVisible();

    // 必須フィールドを入力（placeholderで特定）
    await page.getByPlaceholder('山田 太郎').fill('テスト 利用者');
    await page.getByPlaceholder('ヤマダ タロウ').fill('テスト リヨウシャ');

    // 登録ボタンをクリック
    await page.getByRole('button', { name: '登録', exact: true }).click();

    // 一覧に戻って新規利用者が表示される（複数回実行でデータが蓄積するため.first()）
    await expect(page.getByText('テスト 利用者').first()).toBeVisible({ timeout: 5000 });
  });

  test('利用者を選択すると詳細画面に遷移する', async ({ page }) => {
    await page.getByText('田中 花子').click();
    // ClientContextBarに利用者名が表示される
    await expect(page.getByText('田中 花子')).toBeVisible();
    // タブナビゲーションが表示される
    await expect(page.getByRole('button', { name: 'アセスメント' })).toBeVisible();
  });
});
