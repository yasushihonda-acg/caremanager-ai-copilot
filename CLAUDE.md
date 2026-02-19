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

## 開発ステージ（2026-02-19更新）

- [x] Stage 1: MVP Foundation（完了）
- [x] Stage 2: Production Readiness（完了）
- [ ] Stage 3: Pilot Deployment（進行中）
- [ ] Stage 4: Scale & Enhancement（将来）

詳細: [docs/ROADMAP.md](docs/ROADMAP.md) / [ADR 0009](docs/adr/0009-stage-based-development-model.md)

### Stage 3 タスク状況
| 優先度 | タスク | 状態 |
|--------|--------|------|
| P0 | アクセス制御（allowed_emails） | ✅ f6788c3 |
| P0 | フィードバックFAB | ✅ f6788c3 |
| P0 | 利用ログ・structured logging | ✅ f6788c3 |
| P0 | Tier 1: ケアプラン管理基盤・V2編集・第3表 | ✅ c78f74d |
| P0 | #18-21: 法定要件・実用性・互換性修正 | ✅ PR#34 マージ・本番デプロイ済 |
| P1 | #22: 認定有効期限・モニタリング期限アラート | ✅ 77116b2 本番デプロイ済 |
| P1 | #23: 初回利用オンボーディング・操作ガイド | ✅ fb5c728 本番デプロイ済 |
| P1 | パイロットユーザー登録（手動） | 🔲 |

### 本番URL
- アプリ: https://caremanager-ai-copilot-486212.web.app
- ドキュメント: https://yasushihonda-acg.github.io/caremanager-ai-copilot/

## GitHub Secrets（設定済み）

```
WIF_PROVIDER: projects/405962110931/locations/global/workloadIdentityPools/github-pool/providers/github-provider
WIF_SERVICE_ACCOUNT: github-actions-deploy@caremanager-ai-copilot-486212.iam.gserviceaccount.com
```

## ADR一覧

| ADR | タイトル |
|-----|----------|
| 0001 | GCP/Firebase プラットフォーム選定 |
| 0002 | Vertex AI 統合方式 |
| 0003 | Workload Identity Federation 採用 |
| 0004 | Firestore スキーマ設計 |
| 0005 | Firebase Authentication with Google OAuth |
| 0006 | Gemini 2.5 Flash Model Selection |
| 0007 | Monitoring & Support Records Schema |
| 0008 | 利用者（Client）ネスト方式のFirestoreスキーマ |
| 0009 | ステージベース開発モデル |
| 0010 | GCPプロジェクト移行 |
| 0011 | 期限アラート定義 |

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/ROADMAP.md](docs/ROADMAP.md) | 開発ロードマップ（Stage 1-4） |
| [docs/research/care-manager-insights-2025.md](docs/research/care-manager-insights-2025.md) | ケアマネ業務の課題・AI活用ポイント調査（2025-2026） |

## 主要コンポーネント

| パス | 説明 |
|------|------|
| `components/clients/` | 利用者管理（一覧・登録・編集・コンテキストバー） |
| `components/careplan/` | ケアプラン管理（第1-3表・V2編集・印刷・ステータス・履歴） |
| `components/monitoring/` | モニタリング記録フォーム・目標評価 |
| `components/records/` | 支援経過記録（第5表）・音声入力 |
| `components/meeting/` | サービス担当者会議記録（第4表） |
| `components/common/FeedbackFAB.tsx` | フィードバック送信FAB（Stage 3） |
| `hooks/useCarePlan.ts` | ケアプラン読み込み・自動マイグレーションフック |
| `contexts/ClientContext.tsx` | 利用者コンテキスト（選択・CRUD管理） |
| `functions/src/prompts/` | プロンプト管理・文例データベース |

## Stage 1 完了サマリ（2026-02-10）

MVP全機能がデモ可能な状態。認証・アセスメント・ケアプラン・モニタリング・支援経過・会議記録・入院時連携・利用者管理を実装。

## 注意事項

- API キーはクライアントに露出させない（Cloud Functions経由）
- 日本リージョン（asia-northeast1）を使用
- 介護情報のため、セキュリティルールを厳格に設定
