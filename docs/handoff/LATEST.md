# ハンドオフメモ

**最終更新**: 2026-02-21（セッション24完了）

## 現在のステージ

**Stage 3: Pilot Deployment** - 3-5名のケアマネージャーへの実際の展開フェーズ

> Stage 2（Production Readiness）完了: AI精度90%実証・エラーハンドリング監査・CI/CD正常稼働を達成

## 直近の変更（セッション24: 運用系即時対応）

| コミット | 内容 |
|----------|------|
| 1e64653 | fix: プライバシーポリシー事業者名プレースホルダーを更新 |
| 3468e17 | feat: プライバシーポリシー整備・初回同意ゲート実装 (#49) (#56) |
| 049d0b1 | fix(#51): AI第2表のニーズ・目標記載主語・文体統一ルールを強化 |

### セッション24: 完了内容（運用系即時対応）

| 作業 | 結果 |
|------|------|
| 本番動作確認（Playwright） | ✅ ログイン画面・ポリシーページ・デモフロー確認（スクリーンショット3枚） |
| 事業者名プレースホルダー更新 | ✅ `[事業者名]` → `（仮称）あおぞらケアグループ株式会社` |
| パイロットユーザー登録 | ⏭ スキップ（メール未確定のため後日手動登録） |

### セッション23: 完了内容（#49 プライバシーポリシー）

PR #56 が `main` にマージ・本番デプロイ済み。

| ファイル | 変更内容 |
|----------|----------|
| `components/privacy/PrivacyPolicyPage.tsx` | プライバシーポリシー全文表示ページ（新規） |
| `components/privacy/PrivacyConsentDialog.tsx` | 初回同意ダイアログ（新規） |
| `components/privacy/privacyContent.ts` | ポリシー本文データ v1.0（新規） |
| `hooks/usePrivacyConsent.ts` | 同意状態管理フック（新規） |
| `services/firebase.ts` | `getPrivacyConsent` / `savePrivacyConsent` 追加 |
| `App.tsx` | `usePrivacyConsent` 統合・同意ゲート実装 |
| `components/auth/LoginScreen.tsx` | プライバシーポリシーリンク追加 |
| `components/common/MenuDrawer.tsx` | プライバシーポリシーメニュー追加 |

**テスト状況**: 全181テスト パス（1スキップ）

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

## 次のアクション

| # | タスク | 状態 |
|---|--------|------|
| 1 | **パイロットユーザーのメールアドレス登録** | 🔲 手動作業（Firebaseコンソール） |
| 2 | **パイロットユーザーへの案内・展開** | 🔲 登録後 |
| 3 | フィードバック収集・分析 | 🔲 展開後 |

### Stage 3 退出基準チェックリスト

- [ ] パイロットユーザー3-5名が実際に使用
- [ ] 満足度80%以上
- [ ] 重大バグ0件（1ヶ月間）
- [ ] フィードバックの集計・分析完了

### パイロットユーザー登録方法

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
- ADR 0001-0011 作成済み（0011 = 期限アラート定義）
- CI（Deploy to Firebase）: 1e64653（事業者名更新）のデプロイ済み。本番反映確認済み
- オープンIssue: **2件**（#53=PWA検討, #54=給付管理連携）。#49はPR#56マージでクローズ済み
- `screenshots/` ディレクトリ（01〜03.png）は動作確認用、`.gitignore` 未追加のため要確認
