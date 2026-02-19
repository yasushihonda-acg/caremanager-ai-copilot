# ハンドオフメモ

**最終更新**: 2026-02-19（セッション11）

## 現在のステージ

**Stage 3: Pilot Deployment** - 3-5名のケアマネージャーへの実際の展開フェーズ

> Stage 2（Production Readiness）完了: AI精度90%実証・エラーハンドリング監査・CI/CD正常稼働を達成

## 直近の変更（セッション11: Stage 3実装）

| 日付 | PR/コミット | 内容 |
|------|------------|------|
| 2026-02-19 | feature/stage3-pilot-deployment | **Stage 3実装**: アクセス制御・フィードバック・モニタリング |

### Stage 3で実装した機能

| タスク | ファイル | 内容 |
|--------|----------|------|
| メール許可リスト（A-1） | `contexts/AuthContext.tsx`, `services/firebase.ts` | `allowed_emails` Firestoreチェック。Emulator環境ではスキップ |
| Firestoreルール（A-2） | `firestore.rules` | allowed_emails/feedback/usage_logs の読み書きルール追加 |
| シードスクリプト（A-3） | `scripts/seed.ts` | `test@example.com` を allowed_emails に追加 |
| フィードバックFAB（B-1） | `components/common/FeedbackFAB.tsx` | 右下固定FAB・カテゴリ/テキスト入力・Firestore保存・トースト |
| structured logging（C-1） | `functions/src/vertexAi.ts` | `console.error` → `logger.error`、開始/完了の `logger.info` 追加 |
| 利用ログ（C-2） | `services/firebase.ts`, `App.tsx` | `logUsage()` 追加・ケアプラン生成時に記録 |

## Stage 2 実装状況（完了）

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

## 次のアクション（Stage 3 - 残タスク）

| # | タスク | 状態 | 依存 |
|---|--------|------|------|
| 1 | **PR作成・CIパス確認** | 🔲 | なし |
| 2 | **パイロットユーザーのメールアドレス登録** | 🔲 手動 | PR マージ後 |
| 3 | **本番デプロイ** | 🔲 | PR マージ後 |
| 4 | パイロットユーザーへの案内 | 🔲 | デプロイ後 |
| 5 | P1残タスク判断（パイロットフィードバック後） | 🔲 | パイロット完了後 |

### パイロットユーザー登録方法

```bash
# Firebaseコンソールから手動で登録
# allowed_emails コレクション → ドキュメントID = メールアドレス
# フィールド: { createdAt: <Timestamp>, note: <説明> }

# または npx tsx scripts/seed.ts でEmulator確認後、本番スクリプトを作成
```

### Stage 3 退出基準チェックリスト

- [ ] パイロットユーザー3-5名が実際に使用
- [ ] 満足度80%以上
- [ ] 重大バグ0件（1ヶ月間）
- [ ] フィードバックの集計・分析完了

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
- `allowed_emails` コレクションへのクライアント書き込みは `firestore.rules` で禁止済み（`allow write: if false`）
- フィードバックは `feedback` コレクションに保存（閲覧はFirebaseコンソールまたは管理スクリプトで）
- `usage_logs` はケアプラン生成時のみ記録（最小限）
- ADR 0008（Clientネストスキーマ）、ADR 0009（ステージベース開発モデル）、ADR 0010（GCPプロジェクト移行）作成済み
