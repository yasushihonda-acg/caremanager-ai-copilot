# ハンドオフメモ

**最終更新**: 2026-02-27（セッション38完了）

## 現在のステージ

**Stage 3: Production Launch** - 本番リリース完了。デモで操作感を体験してもらい、本利用希望者を `allowed_emails` に追加して本番利用へ移行する運用。

> Stage 2（Production Readiness）完了: AI精度90%実証・エラーハンドリング監査・CI/CD正常稼働を達成

## 直近の変更（セッション38: ケアプラン第1表・第2表の厚生労働省公式様式準拠）

| コミット | 内容 |
|----------|------|
| 2c332dd | fix(careplan): 第1表のcolgroup調整で「初回居宅サービス」3行折り返しを修正 (#74) |
| 4553086 | fix(careplan): 第1表・第2表を厚生労働省公式様式に完全準拠 (#73) |
| 2ab0ece | fix(ui): MenuDrawerにoverflow-y-autoを追加してスクロール対応 |
| 36de49d | fix(e2e): Auth EmulatorのパスワードハッシュバグをsignInWithCustomTokenで回避しE2E全24件パス |
| f1f96e9 | test(e2e): AIケアプラン点検セクションのE2Eテストを追加 |

**セッション38 完了内容**:
1. **第1表・第2表を厚生労働省公式様式に完全準拠** (#73 PR): 列幅・行高・フォントサイズ・テーブルレイアウトを公式様式に合わせて修正。
2. **第1表colgroup調整** (#74 PR): 「初回居宅サービス計画作成」欄の3行折り返し問題をcolgroup幅調整で解消。

**CI状況**: PR#74（2026-02-27T01:16:09Z）でDeployジョブが**failure**。原因: `firebaseextensions.googleapis.com` に対して403エラー（`Request to .../instances?pageSize=100... had HTTP Error: 403, The caller does not have permission`）。これはFirebase Extensionsのリストアップ権限の問題であり、実際のホスティング・Functions・Firestoreのデプロイ自体は成功している可能性がある。PR#73（2026-02-26T15:48:52Z）は success。**次セッションで要調査**。

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
| 1 | **CI failure調査**: PR#74のDeploy失敗（firebase extensions API 403）を調査・修正 | 🔲 要対応 |
| 2 | **本番ユーザーのメールアドレス登録** | 🔲 手動作業（Firebaseコンソール） |
| 3 | **本番ユーザーへのアプリ案内** | 🔲 登録後 |
| 4 | フィードバック収集・Stage 4優先度決定 | 🔲 利用開始後 |

### CI failure 詳細（次セッション要調査）

```
Error: Request to https://firebaseextensions.googleapis.com/v1beta/projects/
caremanager-ai-copilot-486212/instances?pageSize=100&pageToken=
had HTTP Error: 403, The caller does not have permission
```

- PR#73（直前のコミット）は success → 今回の変更内容自体は問題なし可能性あり
- firebase-tools が extensions を自動チェックする仕様変更による可能性あり
- WIFサービスアカウントに `firebaseextensions.googleapis.com` へのアクセス権が不足している可能性
- `firebase deploy` コマンドに `--except extensions` オプション追加を検討

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
- セッション38: 第1表・第2表の厚生労働省公式様式準拠（#73 PR#74）。CI失敗（firebase extensions 403）要調査。
- セッション37: E2EテストにAIケアプラン点検セクション追加・E2E全24件パス修正（Auth Emulatorバグ回避: signInWithCustomTokenに変更）・MenuDrawerスクロール対応。
- セッション36: AIケアプラン自動点検機能（#71）完了。Gemini 2.5 Flashで第1表・第2表を点検。Cloud Function追加・CarePlanReviewPanel新設・types.ts拡張。
- セッション35: 課題整理総括表（様式1-2）自動生成機能（#70）完了。ユニットテスト28件追加（計265件）。
- オープンIssue: **0件**
- E2E失敗: **なし（全24件パス）** ※ただしCI本番デプロイはPR#74でfailure
- `screenshots/` ディレクトリは `.gitignore` 追加済み（6b7b2c8）
- 現在のブランチ: `main`
