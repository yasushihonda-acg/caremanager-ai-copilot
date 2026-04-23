# ハンドオフメモ

**最終更新**: 2026-04-24（セッション41完了: GitHub Actions Node 24 移行 + rules CI fix）

## 現在のステージ

**Stage 3: Production Launch** - 本番リリース完了。デモで操作感を体験してもらい、本利用希望者を `allowed_emails` に追加して本番利用へ移行する運用。

> Stage 2（Production Readiness）完了: AI精度90%実証・エラーハンドリング監査・CI/CD正常稼働を達成

## 直近の変更（セッション41: GitHub Actions Node 24 移行 + rules CI fix）

| コミット | 内容 |
|----------|------|
| a1ab2c6 | chore(ci): GitHub Actions を最新メジャー版へ更新（Node.js 24 対応） (#85) |
| 279773f | docs(handoff): セッション40完了・GitHub Actions Node.js 24 移行タスクを追記 (#84) |
| 8618cfb | docs(handoff): セッション39完了内容を反映 (#83) |
| 04a7d0f | fix: apple-mobile-web-app-capable を mobile-web-app-capable に更新 (#82) |
| ed1957a | fix(careplan): 第1表の印刷ページ溢れ修正（セル高さ縮小+項目名改行修正）(#81) |

**セッション41 完了内容（#85）**:
1. **GitHub Actions actions の最新メジャー版更新** (#85): 2026-09-16 の Node.js 20 ランタイム削除に備え、`actions/checkout v4→v6` `actions/setup-node v4→v6` `actions/setup-java v4→v5` `actions/upload-artifact v4→v7` `google-github-actions/auth v2→v3` `google-github-actions/setup-gcloud v2→v3` を一括更新（3 workflow × 6 actions）。`setup-node` の `node-version: 20` は Cloud Functions ランタイム整合のため据え置き。
2. **rules CI 既存バグ修正** (#85): vitest v3→v4 で `exclude` の優先順位が CLI filter より上がった挙動変更により、`vitest run tests/rules` が `No test files found` で exit 1 になっていた。専用設定 `vitest.rules.config.ts` を新設し `package.json` の `test:rules` から参照することで回避。ローカル emulator で 51 件全 pass 確認済。

**セッション40 完了内容（#83-84）**: handoff 更新と Node.js 24 移行タスクの検出（#84 で記載）。

**セッション39 完了内容（#75〜#82）**: ケアプラン第1表・第2表の A4 横向き 1 ページ印刷完全対応 + PWA メタタグ修正。

**CI状況**: #85 マージ後の `Deploy to Firebase` は次回セッション開始時に再確認。PR の `E2E Tests` (2m14s) と `Firestore Rules Tests` (1m14s) はマージ前に green 確認済。

## 実装状況

| 機能 | 状態 | 備考 |
|------|------|------|
| 認証（Googleログイン） | ✅ | Firebase Auth / signInWithPopup |
| アセスメント（23項目） | ✅ | 保存・読込・履歴 |
| ケアプラン（第1表・第2表） | ✅ | AI生成・印刷プレビュー・厚生労働省公式様式準拠 |
| ケアプラン履歴・ステータス管理 | ✅ | CarePlanSelector / CarePlanStatusBar |
| ケアプランV2編集 | ✅ | NeedEditor / CarePlanV2Editor |
| 第3表（週間サービス計画表） | ✅ | WeeklyScheduleEditor / Preview / 印刷対応 |
| モニタリング記録 | ✅ | 差分入力・履歴一覧 |
| 支援経過記録（第5表） | ✅ | 音声入力・月次クイックボタン対応 |
| サービス担当者会議（第4表） | ✅ | |
| 入院時情報連携シート | ✅ | 自動生成 |
| 複数利用者管理 | ✅ | Firestoreネスト方式 |
| Firebase Emulator環境 | ✅ | |
| アクセス制御（allowed_emails） | ✅ | Stage 3実装 |
| フィードバックFAB | ✅ | Stage 3実装 |
| 利用ログ・structured logging | ✅ | Stage 3実装 |
| 認定有効期限・モニタリング期限アラート | ✅ | #22 |
| 初回利用オンボーディング・操作ガイド | ✅ | #23 |
| ダッシュボード/業務サマリー画面 | ✅ | #24 |
| デモ環境1コマンド起動 | ✅ | #35 |
| モバイル操作性最適化 | ✅ | #26 |
| 本番ゲストデモモード | ✅ | #47/#48 |
| コンポーネントテスト | ✅ | #39 |
| E2Eテスト（Playwright） | ✅ | #37 |
| FE/BE整合性テスト | ✅ | #38 |
| Firestoreセキュリティルールテスト | ✅ | #40 |
| 非同期エラーハンドリング強化 | ✅ | #29 |
| インタビューコパイロット（missingInfoAdvice） | ✅ | #28 |
| 保険者番号バリデーション | ✅ | #30 |
| 未保存変更保護・タブ dirty 表示 | ✅ | #31 |
| ケアプランPDF保存ガイドUX改善 | ✅ | #32 |
| 定型文データベースV2対応 | ✅ | #33 |
| ヘルプページ（使い方ガイド） | ✅ | #50 |
| プライバシーポリシー・同意ゲート | ✅ | #49 PR#56 マージ・本番デプロイ済 |
| ケアプランCSVエクスポート（第2表・第3表） | ✅ | #54 PR#66 Excel互換（UTF-8 BOM・CRLF） |
| 第2表文例DB拡充（6→10カテゴリ、30→50件） | ✅ | #67 パーキンソン病・糖尿病・COPD・がん末期追加 |
| 課題整理総括表（様式1-2）自動生成 | ✅ | #70 アセスメントから即時生成・A4横印刷対応 |
| AIケアプラン自動点検 | ✅ | #71 Gemini 2.5 Flashでケアプラン品質チェック |

## 次のアクション

| # | タスク | 状態 |
|---|--------|------|
| 1 | **本番ユーザーのメールアドレス登録** | 🔲 手動作業（Firebaseコンソール） |
| 2 | **本番ユーザーへのアプリ案内** | 🔲 登録後 |
| 3 | フィードバック収集・Stage 4優先度決定 | 🔲 利用開始後 |
| 4 | ~~GitHub Actions Node.js 24 移行~~ | ✅ セッション41完了 (#85) |
| 5 | Cloud Functions ランタイム Node 22 移行 | 🔲 任意（Firebase 側互換確認 + `functions/package.json` engines + `setup-node` `node-version` 同時更新） |

### 利用開始フロー

```
新規ユーザー → デモ（ゲストモード）で操作感を体験
             → 本利用希望 → allowed_emails に追加（Firebaseコンソール）
             → Googleアカウントでログイン → 本番利用開始
```

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

# シードデータ投入（allowed_emails含む）
npm run dev:seed
```

環境変数: `.env.development` の `VITE_USE_EMULATOR=true`

## 注意事項

- Emulator環境では `checkEmailAllowed` は常に `true` を返す（バイパス済み）
- `allowed_emails` コレクションへのクライアント書き込みは `firestore.rules` で禁止済み
- プライバシー同意データは `users/{userId}` ドキュメントに merge 保存（既存ルールでカバー済み）
- デモユーザー（`DEMO_USER_UID`）はプライバシー同意チェックをバイパス（自動 consented）
- フィードバックは `feedback` コレクションに保存（閲覧はFirebaseコンソールまたは管理スクリプトで）
- `usage_logs` はケアプラン生成時のみ記録（最小限）
- ADR 0001-0013 作成済み（0012 = PWA戦略、0013 = プライバシー同意管理）
- セッション41: GitHub Actions actions の最新メジャー版更新で Node 24 ランタイム移行完了（#85）。あわせて vitest v3→v4 で発覚した rules CI の既存バグ（exclude 優先順位変更）を `vitest.rules.config.ts` 新設で fix。E2E + Rules + Deploy CI 全 green 確認済。
- セッション40: 前セッションの未コミット handoff 変更を整理（PR #83）。CI success。Node.js 24 移行タスクを検出。
- セッション39: 第1表・第2表 A4横向き1ページ印刷完全対応（#75〜#82）。CI全件 success。
- セッション38: 第1表・第2表の厚生労働省公式様式準拠（#73/#74）。
- セッション37: E2EテストにAIケアプラン点検セクション追加・E2E全24件パス修正（Auth Emulatorバグ回避: signInWithCustomTokenに変更）・MenuDrawerスクロール対応。
- セッション36: AIケアプラン自動点検機能（#71）完了。Gemini 2.5 Flashで第1表・第2表を点検。Cloud Function追加・CarePlanReviewPanel新設・types.ts拡張。
- オープンIssue: **0件**
- E2E失敗: **なし（全24件パス）**
- `screenshots/` ディレクトリは `.gitignore` 追加済み（6b7b2c8）
- 現在のブランチ: `main`
