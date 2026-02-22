# CareManager AI Copilot - プロジェクトルール

## プロジェクト概要

**ケアマネのミカタ 2025** - ケアマネージャー向けAI支援アプリケーション

- Gemini 2.5 Flash による音声解析・アセスメント支援
- 23項目アセスメントの自動抽出
- ケアプラン原案の自動生成

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 19 + TypeScript + Vite |
| スタイリング | Tailwind CSS v4 |
| バックエンド | Cloud Functions for Firebase |
| データベース | Firestore (asia-northeast1) |
| 認証 | Firebase Authentication (Google) |
| AI | Vertex AI Gemini 2.5 Flash |
| CI/CD | GitHub Actions + Workload Identity |

## ディレクトリ構成

```
├── App.tsx                 # メインアプリケーション
├── components/             # UIコンポーネント
├── contexts/               # React Context（Auth, Client）
├── services/
│   ├── firebase.ts         # Firebase SDK統合
│   └── geminiService.ts    # Vertex AI連携（Cloud Functions経由）
├── functions/              # Cloud Functions
│   └── src/
│       ├── index.ts        # エントリーポイント
│       └── vertexAi.ts     # Vertex AI統合
├── docs/
│   └── adr/                # Architecture Decision Records
├── firebase.json           # Firebase設定
├── firestore.rules         # Firestoreセキュリティルール
└── .github/workflows/      # CI/CD
```

## 開発コマンド

```bash
# フロントエンド開発
npm install
npm run dev

# Cloud Functions開発
cd functions && npm install && npm run build

# ローカル開発（Emulator）
npm run dev:emulator   # Emulator起動（Auth:9099, Firestore:8080, Functions:5001）
npm run dev            # Vite起動（自動でEmulator接続、テストユーザー自動ログイン）
npm run dev:seed       # シードデータ投入（Emulator Firestore）
```

## 環境設定

- `.envrc` - direnv設定（GH_CONFIG_DIR, CLOUDSDK_ACTIVE_CONFIG_NAME）
- `.env.development` - Emulator接続フラグ（`VITE_USE_EMULATOR=true`）
- `.gitconfig.local` - プロジェクト固有のGit user設定
- GCPプロジェクト: `caremanager-ai-copilot-486212`

## 開発ステージ（2026-02-22更新）

- [x] Stage 1: MVP Foundation（完了）
- [x] Stage 2: Production Readiness（完了）
- [x] Stage 3: Pilot Deployment（完了）
- [ ] Stage 4: Scale & Enhancement（将来）

詳細: [docs/ROADMAP.md](docs/ROADMAP.md) / [ADR 0009](docs/adr/0009-stage-based-development-model.md)

### Stage 3 タスク状況
| 優先度 | タスク | 状態 |
|--------|--------|------|
| P0 | アクセス制御・フィードバックFAB・利用ログ | ✅ |
| P0 | ケアプラン管理基盤・V2・第3表・法定要件修正 | ✅ |
| P1 | #22: 期限アラート / #23: オンボーディング / #24: ダッシュボード | ✅ |
| P2 | #49: プライバシーポリシー / #50: ヘルプページ | ✅ |
| P1 | #53: PWA化・オフラインUX・seedデータ改善 | ✅ |
| P1 | パイロットユーザー登録（管理者UIで管理） | ✅ |

### 本番URL
- アプリ: https://caremanager-ai-copilot-486212.web.app
- ドキュメント: https://yasushihonda-acg.github.io/caremanager-ai-copilot/

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/ROADMAP.md](docs/ROADMAP.md) | 開発ロードマップ（Stage 1-4） |
| [docs/research/care-manager-insights-2025.md](docs/research/care-manager-insights-2025.md) | ケアマネ業務の課題・AI活用ポイント調査（2025-2026） |

## 主要コンポーネント

| パス | 説明 |
|------|------|
| `components/assessment/` | アセスメント（23項目入力・進捗バー・未入力ハイライト） |
| `components/auth/` | 認証（LoginScreen・Google OAuth） |
| `components/careplan/` | ケアプラン管理（第1-3表・V2編集・印刷・ステータス・履歴） |
| `components/clients/` | 利用者管理（一覧・登録・編集・コンテキストバー） |
| `components/common/` | 共通UI（MenuDrawer・FeedbackFAB・OfflineBanner等） |
| `components/dashboard/` | ダッシュボード（期限アラート・件数サマリー） |
| `components/documents/` | 入院時情報連携シート |
| `components/help/` | ヘルプページ（使い方ガイド） |
| `components/meeting/` | サービス担当者会議記録（第4表） |
| `components/monitoring/` | モニタリング記録フォーム・目標評価 |
| `components/privacy/` | プライバシーポリシー・同意確認ダイアログ |
| `components/records/` | 支援経過記録（第5表）・音声入力 |
| `hooks/useCarePlan.ts` | ケアプラン読み込み・自動マイグレーションフック |
| `contexts/ClientContext.tsx` | 利用者コンテキスト（選択・CRUD管理） |
| `functions/src/prompts/` | プロンプト管理・文例データベース |

## 注意事項

- API キーはクライアントに露出させない（Cloud Functions経由）
- 日本リージョン（asia-northeast1）を使用
- 介護情報のため、セキュリティルールを厳格に設定
