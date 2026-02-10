# ハンドオフメモ

**最終更新**: 2026-02-10（セッション2）

## 現在のフェーズ

MVP完了 - デモ版準備中

## 直近の変更

| 日付 | PR/コミット | 内容 |
|------|------------|------|
| 2026-02-10 | 2a3b463 | デモ用シードデータスクリプト追加（3名分の利用者データ） |
| 2026-02-10 | aca5ea9 | clientsコレクションの複合インデックス追加（isActive+kana） |
| 2026-02-10 | #7 | UX改善バッチ（検索フィルタ・進捗バー・定型文テンプレート） |
| 2026-02-10 | #6 | 利用者データベース（複数利用者管理・Firestoreネスト方式） |
| 2026-02-09 | #5 | モニタリング履歴一覧・編集機能 |

## アーキテクチャ変更（重要）

### Firestoreスキーマのネスト化（PR #6）

**旧パス**: `users/{uid}/assessments/{id}`
**新パス**: `users/{uid}/clients/{clientId}/assessments/{id}`

- 全データが利用者（Client）単位で分離
- `services/firebase.ts`の全関数に`clientId`パラメータ追加
- `clientPath()`ヘルパーでDRYなパス構築
- 旧パスはfirestore.rulesで後方互換を維持

### 新規コンポーネント

| ファイル | 説明 |
|---------|------|
| `contexts/ClientContext.tsx` | Client CRUD + 選択管理 |
| `components/clients/ClientListView.tsx` | 利用者一覧（検索付き） |
| `components/clients/ClientForm.tsx` | 利用者登録・編集 |
| `components/clients/ClientContextBar.tsx` | 選択中利用者バー |

### MOCK_USER完全削除

`App.tsx`からハードコードされた`MOCK_USER`を削除。`useClient()`フックによる動的利用者選択に置換。

## MVP実装状況

| 機能 | 状態 | 備考 |
|------|------|------|
| 認証（Googleログイン） | ✅ | Firebase Auth |
| アセスメント（23項目） | ✅ | 保存・読込・履歴 |
| ケアプラン（第1表・第2表） | ✅ | AI生成・印刷プレビュー |
| モニタリング記録 | ✅ | 差分入力・履歴一覧 |
| 支援経過記録（第5表） | ✅ | 音声入力対応 |
| サービス担当者会議（第4表） | ✅ | |
| 入院時情報連携シート | ✅ | 自動生成 |
| 複数利用者管理 | ✅ | Firestoreネスト方式 |

## 今セッションで完了したインフラ作業

- **CI/CD復旧**: `roles/serviceusage.serviceUsageConsumer` IAMロール付与 + GCP Blaze課金設定
- **Firestoreインデックス**: `clients`コレクション（isActive+kana）の複合インデックスデプロイ
- **シードデータ**: 3名の利用者データをFirestoreに投入済み（`scripts/seed.ts`）
  - 田中花子（要介護2）、佐藤太郎（要介護3）、鈴木一郎（要介護1）

## 次のアクション候補

1. **AI抽出精度の実地テスト** - 実際のケアマネ業務での精度検証
2. **給付管理サポート機能** - Phase 4の主要機能
3. **ADCの再設定** - `gcloud auth application-default login`で正しいアカウントに再認証（現在`yasushi-honda@tadakayo.jp`が設定されている）

## デモ環境

- アプリ: https://caremanager-ai-copilot.web.app
- ドキュメント: https://yasushihonda-acg.github.io/caremanager-ai-copilot/
- GCPプロジェクト: `caremanager-ai-copilot`

## シードデータ再投入

```bash
npx tsx scripts/seed.ts bapgVkGOXVep8Tm2vbkxml1vz3D2
```
- gcloud CLIのアクティブアカウント（`hy.unimail.11@gmail.com`）のトークンを使用
- ADCは別アカウント（`yasushi-honda@tadakayo.jp`）のため使用不可

## 注意事項

- `firestore.rules`に旧パスの後方互換ルールを残している（将来削除可能）
- 旧パスの既存データは自動移行されない（デモ段階で少量のため手動対応）
- ADR 0008（Clientネストスキーマ）作成済み
