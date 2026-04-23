# ハンドオフメモ

**最終更新**: 2026-04-23（セッション40完了: メンテのみ）

## 現在のステージ

**Stage 3: Production Launch** - 本番リリース完了。デモで操作感を体験してもらい、本利用希望者を `allowed_emails` に追加して本番利用へ移行する運用。

> Stage 2（Production Readiness）完了: AI精度90%実証・エラーハンドリング監査・CI/CD正常稼働を達成

## 直近の変更（セッション39: ケアプラン第1表・第2表 A4横向き印刷完全対応）

| コミット | 内容 |
|----------|------|
| 04a7d0f | fix: apple-mobile-web-app-capable を mobile-web-app-capable に更新 (#82) |
| ed1957a | fix(careplan): 第1表の印刷ページ溢れ修正（セル高さ縮小+項目名改行修正）(#81) |
| a4af59e | fix(careplan): 印刷4ページ→2ページに修正（print-sheetクラスで印刷時の高さを自動化）(#80) |
| 71940dc | fix(careplan): 第1表・第2表をA4横向き1ページにフィット+ウォーターマーク削除 (#79) |
| 634c802 | fix(careplan): 第2表罫線欠け修正・A4横向きフィット対応 (#78) |

**セッション39 完了内容（#75〜#82）**:
1. **第2表罫線欠け修正・A4横向きフィット対応** (#78): 第2表の罫線欠けをborder-collapseで修正し、A4横向き1ページに収まるよう調整。
2. **第1表・第2表をA4横向き1ページにフィット+ウォーターマーク削除** (#79): 印刷時のスケールをfit-to-pageに統一し、デバッグ用ウォーターマークを削除。
3. **印刷4ページ→2ページに修正** (#80): print-sheetクラスで印刷時の高さを自動化し、第1表・第2表それぞれ1ページに収束。
4. **第1表の印刷ページ溢れ修正** (#81): セル高さ縮小と項目名改行修正で溢れを解消。
5. **PWAメタタグ修正** (#82): apple-mobile-web-app-capable を W3C標準の mobile-web-app-capable に更新。

**CI状況**: #82（最新、2026-02-27T15:00:07Z）は **success**。PR#74で発生したfirebase extensions 403 CI失敗は、その後のデプロイで解消済み。

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
| 4 | **GitHub Actions Node.js 24 移行** | 🔲 2026-08 頃までに対応（詳細は下記） |

### GitHub Actions Node.js 24 移行（期限: 2026-09-16）

PR #83 の Deploy CI で Node.js 20 非推奨警告を検出。以下の actions のメジャー/サブバージョン更新が必要:

| Action | 現行 | 期限 |
|--------|------|------|
| `actions/checkout@v4` | Node.js 20 | 2026-06-02 デフォルト変更 / 2026-09-16 削除 |
| `actions/setup-node@v4` | Node.js 20 | 同上 |
| `google-github-actions/auth@v2` | Node.js 20 | 同上 |
| `google-github-actions/setup-gcloud@v2` | Node.js 20 | 同上 |

暫定回避策（緊急時のみ）: workflow に `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true` を設定。
参考: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/

### 未追跡スクリーンショットファイル（ルートに散在）

git status に16件の `.png` ファイルが未追跡（`careplan-*.png`, `current-state.png` 等）。
これらはセッション中のデバッグ用スクリーンショット。`.gitignore` に `*.png` を追加するか手動削除すること。

```bash
# 削除する場合
rm /Users/yyyhhh/ACG/caremanager-ai-copilot/*.png
# または .gitignore に追加
echo "*.png" >> .gitignore  # 注意: auth-error.png等も除外されるため既存エントリと重複確認
```

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
- セッション40: 前セッションの未コミット handoff 変更を整理（PR #83）。CI success。Node.js 24 移行タスクを検出。
- セッション39: 第1表・第2表 A4横向き1ページ印刷完全対応（#75〜#82）。CI全件 success。
- セッション38: 第1表・第2表の厚生労働省公式様式準拠（#73/#74）。
- セッション37: E2EテストにAIケアプラン点検セクション追加・E2E全24件パス修正（Auth Emulatorバグ回避: signInWithCustomTokenに変更）・MenuDrawerスクロール対応。
- セッション36: AIケアプラン自動点検機能（#71）完了。Gemini 2.5 Flashで第1表・第2表を点検。Cloud Function追加・CarePlanReviewPanel新設・types.ts拡張。
- オープンIssue: **0件**
- E2E失敗: **なし（全24件パス）**
- `screenshots/` ディレクトリは `.gitignore` 追加済み（6b7b2c8）
- 現在のブランチ: `main`
