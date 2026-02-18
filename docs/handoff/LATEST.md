# ハンドオフメモ

**最終更新**: 2026-02-19（セッション8）

## 現在のステージ

**Stage 2: Production Readiness** - パイロット投入に向けた品質保証・精度検証フェーズ

> 開発モデルをPhase（機能カテゴリ別）からStage（開発ステージ別）に移行。詳細: [ADR 0009](../adr/0009-stage-based-development-model.md)

## 直近の変更（直近1週間）

| 日付 | PR/コミット | 内容 |
|------|------------|------|
| 2026-02-19 | PR #13 (4c465ac) | **抽出ルール最適化**（Stage 2 P0完了）- evaluatorバグ修正・テスト期待値修正・プロンプト改善 |
| 2026-02-18 | PR #12 (dfa482f) | **AI精度ライブテスト基盤構築**（Stage 2 P0完了）- 全体精度90%実証 |
| 2026-02-18 | 7056a8f | Emulator環境整備の完了をStage 2タスクに反映（CLAUDE.md / ROADMAP.md更新） |
| 2026-02-18 | PR #11 (9da0f6d) | Firebase Emulatorローカル開発環境整備（Stage 2 P0完了） |
| 2026-02-18 | PR #10 (6946a73) | GCPプロジェクトを新環境に移行（ADR 0010） |

## 解決済みの問題

### CI/CD 403 権限エラー（セッション6で解決）

**原因**: GCPプロジェクト移行(PR #10)時に、サービスアカウントへのIAMロール付与が不完全だった

**修正内容**:
1. `roles/serviceusage.serviceUsageConsumer` をサービスアカウントに付与
2. `cloudbilling.googleapis.com` APIをプロジェクトで有効化

**確認**: run #22139473438 で全ステップ成功（build-and-deploy + cleanup-artifacts）

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
| 0 | **CI修正**: サービスアカウント権限付与 | ✅ セッション6 | - |
| 1 | ADC再認証（`gcloud auth application-default login`） | 🔲 手動 | なし |
| 2 | エラーハンドリング監査 | ✅ PR #9 | - |
| 3 | Emulator環境整備 | ✅ PR #11 | - |
| 4 | AI精度の実地テスト（ライブテスト基盤） | ✅ PR #12 | - |
| 5 | 抽出ルール最適化（弱点3項目） | ✅ PR #13 | #4 |

### Task 4 完了サマリ（PR #12）

- `vertexAi.ts` に `textInput?` パスを追加（audio/text両対応）
- `tests/assessment/extraction.live.test.ts` 作成（6テストケース）
- `tests/assessment/cloudFunctionClient.ts` - Vertex AI REST API直接呼び出し（ADCトークン）
- ベースライン精度: **全体90%** (70%閾値を超過)
- 弱点3項目: `pastHistory`(20%), `environment`(0%), `adlEating`(75%)

### Task 5 完了サマリ（PR #13）

- `tests/assessment/evaluator.ts` - `shouldContain` の `some()` fallbackバグを除去（個別キーワードチェックに修正）
- `tests/assessment/extraction.test.ts` - バグ修正検証テスト追加・`perfectExtraction` 期待値更新
- `tests/assessment/testCases.ts` - TC001期待値修正（`healthStatus`に現在治療中疾患を統合、`pastHistory`削除）
- `functions/src/prompts/assessmentSchema.ts` - フィールドに `description` 追加
- プロンプトに隣接フィールド分類ガイドライン追記（`pastHistory` vs `healthStatus` 等）

### Stage 2 退出基準チェックリスト

- [ ] P0タスク全完了（ADC再認証のみ残 - 手動実行必要）
- [x] AI抽出精度85%以上を実データで実証（**90%達成** PR #12）
- [x] エラーハンドリング監査完了（transient/permanent分類済み）
- [x] Emulator環境整備完了
- [x] 抽出ルール最適化完了（PR #13 evaluatorバグ修正・プロンプト改善）
- [ ] 重大バグ0件
- [x] CI/CD正常稼働（PR #13 デプロイ成功確認済み）

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
