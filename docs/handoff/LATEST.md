# ハンドオフメモ

**最終更新**: 2026-02-23（セッション35完了）

## 現在のステージ

**Stage 3: Production Launch** - 本番リリース完了。デモで操作感を体験してもらい、本利用希望者を `allowed_emails` に追加して本番利用へ移行する運用。

> Stage 2（Production Readiness）完了: AI精度90%実証・エラーハンドリング監査・CI/CD正常稼働を達成

## 直近の変更（セッション35: 課題整理総括表自動生成）

| コミット | 内容 |
|----------|------|
| c70806a | feat: 課題整理総括表（様式1-2）自動生成機能 (#70) |
| f2c1f16 | docs: セッション34ハンドオフ更新（E2E strict mode修正完了反映） |
| 6b51a2e | fix(e2e): strict mode violation - タブセレクターをdata-testidでスコープ (#69) |

**セッション35 完了内容**: アセスメントデータから課題整理総括表（様式1-2）をオンデマンド生成する機能を実装。入院時情報連携シートと同パターンで、Firestoreに保存せずメニューから即時生成・印刷（A4横向き）に対応。types.ts に型定義追加、`utils/issueSummarySheet.ts` に生成ロジック実装、`components/documents/IssueSummarySheetView.tsx` に表示+印刷ビュー追加、MenuDrawer + App.tsx へ統合。PR#70 でマージ。CI（Deploy to Firebase）: success。

**テスト状況**: 全テスト パス（ユニット265 + E2E全件）。ユニットテスト28件新規追加（課題整理総括表ロジック）。E2E失敗なし。

## 実装状況

| 機能 | 状態 | 備考 |
|------|------|------|
| 認証（Googleログイン） | ✅ | Firebase Auth / signInWithPopup |
| アセスメント（23項目） | ✅ | 保存・読込・履歴 |
| ケアプラン（第1表・第2表） | ✅ | AI生成・印刷プレビュー |
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

## 次のアクション

| # | タスク | 状態 |
|---|--------|------|
| 1 | **本番ユーザーのメールアドレス登録** | 🔲 手動作業（Firebaseコンソール） |
| 2 | **本番ユーザーへのアプリ案内** | 🔲 登録後 |
| 3 | フィードバック収集・Stage 4優先度決定 | 🔲 利用開始後 |

### 利用開始フロー

```
新規ユーザー → デモ（ゲストモード）で操作感を体験
             → 本利用希望 → allowed_emails に追加（Firebaseコンソール）
             → Googleアカウントでログイン → 本番利用開始
```

### 本番ユーザー登録方法

```bash
# Firebaseコンソールから手動で登録
# allowed_emails コレクション → ドキュメントID = メールアドレス
# フィールド: { createdAt: <Timestamp>, note: <説明> }
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
- CI（Deploy to Firebase）: 6b51a2e（E2E strict mode修正）デプロイ済み（success）。本番反映確認済み
- セッション31: safe-refactorによるコード品質改善（PR#65）完了。未使用import削除・catch句明示化・DRY化。
- セッション33: 第2表文例DB拡充（6→10カテゴリ、30→50件）PR#67完了。ユニットテスト30件追加。
- セッション34: E2E strict mode violation修正（#68→#69）完了。タブセレクターをdata-testidでスコープ。
- セッション35: 課題整理総括表（様式1-2）自動生成機能（#70）完了。ユニットテスト28件追加（計265件）。
- オープンIssue: **0件**
- E2E失敗: **なし**
- `screenshots/` ディレクトリは `.gitignore` 追加済み（6b7b2c8）
- 現在のブランチ: `main`（`feature/49-privacy-policy` はリモートに残存するが実質クローズ済み）
