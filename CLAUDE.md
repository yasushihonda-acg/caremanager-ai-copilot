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

### 完了済み（2026-01-24）
- [x] GCPプロジェクト作成・API有効化
- [x] Firebase初期設定（Hosting, Functions, Firestore）
- [x] Vertex AI統合（Cloud Functions実装）
- [x] Workload Identity Federation設定
- [x] ADR作成（0001-0004）
- [x] フロントエンドのFirebase連携コード
- [x] GitHub Secrets設定（WIF_PROVIDER, WIF_SERVICE_ACCOUNT）
- [x] Firebase ConsoleでGoogle認証有効化
- [x] Tailwind CSS v4 セットアップ
- [x] CI/CD パイプライン動作確認
- [x] 本番デプロイ完了

### 本番URL
https://caremanager-ai-copilot.web.app

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

## 注意事項

- API キーはクライアントに露出させない（Cloud Functions経由）
- 日本リージョン（asia-northeast1）を使用
- 介護情報のため、セキュリティルールを厳格に設定
