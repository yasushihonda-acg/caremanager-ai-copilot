# ハンドオフメモ

**最終更新**: 2026-02-19（セッション12）

## 現在のステージ

**Stage 3: Pilot Deployment** - 3-5名のケアマネージャーへの実際の展開フェーズ

> Stage 2（Production Readiness）完了: AI精度90%実証・エラーハンドリング監査・CI/CD正常稼働を達成

## 直近の変更（セッション12: Tier 1 ケアプラン管理基盤）

| 日付 | コミット | 内容 |
|------|----------|------|
| 2026-02-19 | c78f74d | **Tier 1**: ケアプラン管理基盤・V2編集・第3表実装 |
| 2026-02-19 | 28dd786 | chore: direnv catchup設定追加（GH_TOKEN自動取得） |
| 2026-02-19 | ed42c07 | fix: Firebase Hosting Emulatorポートを5100に変更 |
| 2026-02-19 | f6788c3 | **Stage 3実装**: アクセス制御・フィードバック・モニタリング |

### セッション12で実装した機能（c78f74d）

| フェーズ | タスク | ファイル |
|----------|--------|----------|
| Phase A | useCarePlan カスタムフック（Firestore読み込み・自動マイグレーション） | `hooks/useCarePlan.ts` |
| Phase A | CarePlanSelector: ケアプラン履歴ドロップダウン | `components/careplan/CarePlanSelector.tsx` |
| Phase A | CarePlanStatusBar: draft→review→consented→active ステータス管理 | `components/careplan/CarePlanStatusBar.tsx` |
| Phase B | NeedEditor: ニーズ単体アコーディオン編集 | `components/careplan/NeedEditor.tsx` |
| Phase B | CarePlanV2Editor: V2全体エディタ | `components/careplan/CarePlanV2Editor.tsx` |
| Phase C | 第3表（週間サービス計画表）型定義 | `types.ts` |
| Phase C | WeeklyScheduleEditor: 曜日トグル・時間設定 | `components/careplan/WeeklyScheduleEditor.tsx` |
| Phase C | WeeklySchedulePreview: 曜日マトリックス表示 | `components/careplan/WeeklySchedulePreview.tsx` |
| Phase C | PrintPreview: 第3表A4横向き印刷ページ追加 | `components/careplan/PrintPreview.tsx` |

### セッション11で実装した機能（Stage 3）

| タスク | ファイル | 内容 |
|--------|----------|------|
| メール許可リスト（A-1） | `contexts/AuthContext.tsx`, `services/firebase.ts` | `allowed_emails` Firestoreチェック。Emulator環境ではスキップ |
| Firestoreルール（A-2） | `firestore.rules` | allowed_emails/feedback/usage_logs の読み書きルール追加 |
| シードスクリプト（A-3） | `scripts/seed.ts` | `test@example.com` を allowed_emails に追加 |
| フィードバックFAB（B-1） | `components/common/FeedbackFAB.tsx` | 右下固定FAB・カテゴリ/テキスト入力・Firestore保存・トースト |
| structured logging（C-1） | `functions/src/vertexAi.ts` | `console.error` → `logger.error`、開始/完了の `logger.info` 追加 |
| 利用ログ（C-2） | `services/firebase.ts`, `App.tsx` | `logUsage()` 追加・ケアプラン生成時に記録 |

## 実装状況

| 機能 | 状態 | 備考 |
|------|------|------|
| 認証（Googleログイン） | ✅ | Firebase Auth |
| アセスメント（23項目） | ✅ | 保存・読込・履歴 |
| ケアプラン（第1表・第2表） | ✅ | AI生成・印刷プレビュー |
| ケアプラン履歴・ステータス管理 | ✅ | CarePlanSelector / CarePlanStatusBar（c78f74d） |
| ケアプランV2編集 | ✅ | NeedEditor / CarePlanV2Editor（c78f74d） |
| 第3表（週間サービス計画表） | ✅ | WeeklyScheduleEditor / Preview / 印刷対応（c78f74d） |
| モニタリング記録 | ✅ | 差分入力・履歴一覧 |
| 支援経過記録（第5表） | ✅ | 音声入力対応 |
| サービス担当者会議（第4表） | ✅ | |
| 入院時情報連携シート | ✅ | 自動生成 |
| 複数利用者管理 | ✅ | Firestoreネスト方式 |
| Firebase Emulator環境 | ✅ | PR #11 |
| ニーズ→目標の整合性チェック | ✅ | PR #15 |
| アクセス制御（allowed_emails） | ✅ | Stage 3実装（f6788c3） |
| フィードバックFAB | ✅ | Stage 3実装（f6788c3） |
| 利用ログ・structured logging | ✅ | Stage 3実装（f6788c3） |

## 次のアクション

| # | タスク | 状態 | 依存 |
|---|--------|------|------|
| 1 | **Tier 1コミット（c78f74d）のPR作成・CIパス確認** | 🔲 | なし |
| 2 | **本番デプロイ（Tier 1 + Stage 3）** | 🔲 | PR マージ後 |
| 3 | **パイロットユーザーのメールアドレス登録** | 🔲 手動 | デプロイ後 |
| 4 | パイロットユーザーへの案内 | 🔲 | 登録後 |
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
