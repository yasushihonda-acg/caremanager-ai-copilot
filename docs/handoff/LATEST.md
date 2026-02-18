# ハンドオフメモ

**最終更新**: 2026-02-18（セッション5）

## 現在のステージ

**Stage 2: Production Readiness** - パイロット投入に向けた品質保証・精度検証フェーズ

> 開発モデルをPhase（機能カテゴリ別）からStage（開発ステージ別）に移行。詳細: [ADR 0009](../adr/0009-stage-based-development-model.md)

## 直近の変更（直近1週間）

| 日付 | PR/コミット | 内容 |
|------|------------|------|
| 2026-02-18 | 7056a8f | Emulator環境整備の完了をStage 2タスクに反映（CLAUDE.md / ROADMAP.md更新） |
| 2026-02-18 | PR #11 (9da0f6d) | **Firebase Emulatorローカル開発環境整備**（Stage 2 P0完了） |
| 2026-02-18 | PR #10 (6946a73) | GCPプロジェクトを新環境に移行（ADR 0010） |
| 2026-02-10 | PR #9 (40f33bd) | エラーハンドリング監査（Stage 2 P0）- 11ファイル修正 |
| 2026-02-10 | PR #8 (b0c1d21) | ロードマップ再構成（Stage-based）、ADR 0009 |

## 緊急対応が必要な問題

### CI/CD が 403 権限エラーで失敗中

**症状**: `Deploy to Firebase` ワークフローが全ランで失敗

**エラー**:
```
Error: Request to https://serviceusage.googleapis.com/v1/projects/caremanager-ai-copilot-486212/services/firestore.googleapis.com
had HTTP Error: 403, Caller does not have required permission to use project caremanager-ai-copilot-486212.
Grant the caller the roles/serviceusage.serviceUsageConsumer role
```

**影響**: PR #11以降のデプロイが全て失敗（run #22139290538, #22139353363）

**対処**: GCP Console でサービスアカウントに `roles/serviceusage.serviceUsageConsumer` を付与
- サービスアカウント: `github-actions-deploy@caremanager-ai-copilot-486212.iam.gserviceaccount.com`
- URL: https://console.developers.google.com/iam-admin/iam/project?project=caremanager-ai-copilot-486212

## MVP実装状況（Stage 1 完了）

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
| Firebase Emulator環境 | ✅ | PR #11 |

## 次のアクション（Stage 2 P0 - 残タスク）

| # | タスク | 状態 | 依存 |
|---|--------|------|------|
| 0 | **CI修正**: サービスアカウント権限付与（`roles/serviceusage.serviceUsageConsumer`） | 🔴 緊急 | GCP Console手動作業 |
| 1 | ADC再認証（`gcloud auth application-default login`） | 🔲 手動 | なし |
| 2 | エラーハンドリング監査 | ✅ PR #9 | - |
| 3 | Emulator環境整備 | ✅ PR #11 | - |
| 4 | AI精度の実地テスト（Cloud Functions連携テスト） | 🔲 | #1 |
| 5 | 抽出ルール最適化（弱点4項目） | 🔲 | #4 |

### Task 4 実装概要（AI精度テスト）

1. `vertexAi.ts`の`analyzeAssessment`に`textInput?`パスを追加
2. `tests/assessment/extraction.live.test.ts`を作成（6テストケース）
3. `npm run test:live`でベースライン精度を計測
4. ブランチ: `feature/stage2-ai-accuracy-tests`
5. 弱点4項目: `healthStatus`, `pastHistory`, `iadlCooking`, `environment`

### Stage 2 退出基準チェックリスト

- [ ] P0タスク全完了（CI修正含む）
- [ ] AI抽出精度85%以上を実データで実証
- [x] エラーハンドリング監査完了（transient/permanent分類済み）
- [x] Emulator環境整備完了
- [ ] 重大バグ0件
- [ ] CI/CD正常稼働

## デモ環境

- アプリ: https://caremanager-ai-copilot-486212.web.app
- ドキュメント: https://yasushihonda-acg.github.io/caremanager-ai-copilot/
- GCPプロジェクト: `caremanager-ai-copilot-486212`
- GCPオーナー: `yasushi.honda@aozora-cg.com`

## ローカル開発（Emulator）

```bash
# Emulator起動（Auth:9099, Firestore:8080, Functions:5001）
npm run dev:emulator

# Vite起動（自動でEmulator接続、テストユーザー自動ログイン）
npm run dev

# シードデータ投入（Emulator Firestore）
npm run dev:seed
```

環境変数: `.env.development` の `VITE_USE_EMULATOR=true`

## シードデータ再投入（本番）

```bash
npx tsx scripts/seed.ts bapgVkGOXVep8Tm2vbkxml1vz3D2
```

- gcloud CLIのアクティブアカウント（`yasushi.honda@aozora-cg.com`）のトークンを使用

## 注意事項

- `firestore.rules`に旧パスの後方互換ルールを残している（将来削除可能）
- 旧パスの既存データは自動移行されない（デモ段階で少量のため手動対応）
- ADR 0008（Clientネストスキーマ）、ADR 0009（ステージベース開発モデル）、ADR 0010（GCPプロジェクト移行）作成済み
- `.serena/project.yml` に未コミットの変更あり（Serenaの設定更新のみ、機能影響なし）
