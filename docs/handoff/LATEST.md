# ハンドオフメモ

**最終更新**: 2026-02-19（セッション10）

## 現在のステージ

**Stage 2: Production Readiness** - パイロット投入に向けた品質保証・精度検証フェーズ

> 開発モデルをPhase（機能カテゴリ別）からStage（開発ステージ別）に移行。詳細: [ADR 0009](../adr/0009-stage-based-development-model.md)

## 直近の変更（直近1週間）

| 日付 | PR/コミット | 内容 |
|------|------------|------|
| 2026-02-19 | 810993e | **リファクタリング**: `CarePlanNeed` → `CarePlanV2NeedResponse` 型名の明確化 |
| 2026-02-19 | PR #15 (bb1c7e9) | **ニーズ→目標の整合性チェック実装**（P1完了）CI成功 |
| 2026-02-19 | PR #14 (d9e2447) | **サイレント失敗エラーハンドリング修正**（9箇所→ユーザー通知付き）|
| 2026-02-19 | PR #13 (4c465ac) | **抽出ルール最適化**（Stage 2 P0完了）|
| 2026-02-18 | PR #12 (dfa482f) | **AI精度ライブテスト基盤構築**（全体精度90%実証）|

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
| ニーズ→目標の整合性チェック | ✅ | PR #15 |

## 次のアクション（Stage 2 P0 - 残タスク）

| # | タスク | 状態 | 依存 |
|---|--------|------|------|
| 1 | ADC再認証（`gcloud auth application-default login`） | 🔲 手動 | なし |
| 2 | **CI/CD正常稼働確認** | ✅ run #22149947485 成功 | - |

### Stage 2 退出基準チェックリスト

- [ ] P0タスク全完了（ADC再認証のみ残 - 手動実行必要）
- [x] AI抽出精度85%以上を実データで実証（**90%達成** PR #12）
- [x] エラーハンドリング監査完了（transient/permanent分類済み）
- [x] Emulator環境整備完了
- [x] 抽出ルール最適化完了（PR #13 evaluatorバグ修正・プロンプト改善）
- [x] サイレント失敗修正完了（PR #14、9箇所→ユーザー通知付き）
- [x] ニーズ→目標の整合性チェック実装完了（PR #15、P1）
- [ ] 重大バグ0件
- [x] CI/CD正常稼働（run #22149947485 success 2026-02-18）

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

## 注意事項

- `firestore.rules` に旧パスの後方互換ルールを残している（将来削除可能）
- 旧パスの既存データは自動移行されない（デモ段階で少量のため手動対応）
- ADR 0008（Clientネストスキーマ）、ADR 0009（ステージベース開発モデル）、ADR 0010（GCPプロジェクト移行）作成済み
- `services/geminiService.ts` 内の `CarePlanV2NeedResponse` は `types.ts` の `CarePlanNeed`（id付き・CareGoal[]型）と構造が異なるローカル型（810993e でリネーム済み）
