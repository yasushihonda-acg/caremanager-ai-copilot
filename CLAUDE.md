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

# エミュレータ起動
npm run emulators
```

## 環境設定

- `.envrc` - direnv設定（GH_CONFIG_DIR, CLOUDSDK_ACTIVE_CONFIG_NAME）
- `.gitconfig.local` - プロジェクト固有のGit user設定
- GCPプロジェクト: `caremanager-ai-copilot`

## 現在のステータス

### 完了済み（2026-01-25）
- [x] GCPプロジェクト作成・API有効化
- [x] Firebase初期設定（Hosting, Functions, Firestore）
- [x] Vertex AI統合（Cloud Functions実装）
- [x] Workload Identity Federation設定
- [x] ADR作成（0001-0007）
- [x] フロントエンドのFirebase連携コード
- [x] GitHub Secrets設定（WIF_PROVIDER, WIF_SERVICE_ACCOUNT）
- [x] Firebase ConsoleでGoogle認証有効化
- [x] Tailwind CSS v4 セットアップ
- [x] CI/CD パイプライン動作確認
- [x] 本番デプロイ完了
- [x] 認証フローのUI統合（Googleログイン/ログアウト）
- [x] アセスメントデータ永続化（Firestore保存・読込）
- [x] ケアプランタブ有効化・保存機能
- [x] 印刷プレビュー機能（第1表・第2表）
- [x] Gemini 2.5 Flash 安定版モデルに更新
- [x] 第2表文例データベース（6疾患カテゴリ、30+文例）
- [x] ケアプラン生成プロンプト改善（V2 API）
- [x] モニタリング記録データモデル・フォーム実装
- [x] 支援経過記録（第5表）データモデル・音声入力実装
- [x] アセスメント抽出テストケース（6シナリオ、Vitest）
- [x] サービス担当者会議記録（第4表）データモデル
- [x] 入院時情報連携シート自動生成
- [x] コンポーネント構造リファクタリング
- [x] UI統合（モニタリング・支援経過タブをApp.tsxに追加）
- [x] GitHub Pagesドキュメントサイト作成

### 本番URL
- アプリ: https://caremanager-ai-copilot.web.app
- ドキュメント: https://yasushihonda-acg.github.io/caremanager-ai-copilot/

## GitHub Secrets（設定済み）

```
WIF_PROVIDER: projects/624222634250/locations/global/workloadIdentityPools/github-pool/providers/github-provider
WIF_SERVICE_ACCOUNT: github-actions-deploy@caremanager-ai-copilot.iam.gserviceaccount.com
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

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/ROADMAP.md](docs/ROADMAP.md) | 開発ロードマップ（Phase 1-4） |
| [docs/research/care-manager-insights-2025.md](docs/research/care-manager-insights-2025.md) | ケアマネ業務の課題・AI活用ポイント調査（2025-2026） |

## 主要コンポーネント

| パス | 説明 |
|------|------|
| `components/monitoring/` | モニタリング記録フォーム・目標評価 |
| `components/records/` | 支援経過記録（第5表）・音声入力 |
| `functions/src/prompts/` | プロンプト管理・文例データベース |

## Phase 1 完了タスク（2026-01-25）

| 優先度 | タスク | 状態 |
|--------|--------|------|
| P0 | 第2表文例データベース構築 | ✅ |
| P0 | ケアプラン生成プロンプト改善 | ✅ |
| P0 | アセスメント抽出テストケース作成 | ✅ |
| P1 | モニタリング記録データモデル・フォーム | ✅ |
| P1 | 支援経過記録データモデル・音声入力 | ✅ |
| P2 | サービス担当者会議記録データモデル | ✅ |
| P2 | 入院時情報連携シート自動生成 | ✅ |
| Infra | コンポーネント構造のリファクタリング | ✅ |

## 次のフェーズ候補

- UI統合（新コンポーネントをApp.tsxに組み込み）
- AI抽出精度の実地テスト
- サービス担当者会議フォーム実装
- 給付管理サポート機能（Phase 4）

## 注意事項

- API キーはクライアントに露出させない（Cloud Functions経由）
- 日本リージョン（asia-northeast1）を使用
- 介護情報のため、セキュリティルールを厳格に設定
