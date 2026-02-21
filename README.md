# ケアマネのミカタ 2025

ケアマネージャー向けAI支援アプリケーション

## 概要

- **Gemini 2.5 Flash** による音声解析・アセスメント支援
- **23項目アセスメント**の自動抽出
- **ケアプラン原案**の自動生成
- **第1表・第2表**の印刷プレビュー

## 本番URL

https://caremanager-ai-copilot-486212.web.app

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 19 + TypeScript + Vite |
| スタイリング | Tailwind CSS v4 |
| バックエンド | Cloud Functions for Firebase |
| データベース | Firestore |
| 認証 | Firebase Authentication (Google) |
| AI | Vertex AI Gemini 2.5 Flash |
| CI/CD | GitHub Actions + Workload Identity |

## ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# Cloud Functions開発
cd functions && npm install && npm run build

# エミュレータ起動
npm run dev:emulator
```

## ドキュメント

- [CLAUDE.md](./CLAUDE.md) - プロジェクトルール・クイックリファレンス
- [docs/adr/](./docs/adr/) - Architecture Decision Records
- [docs/prd/](./docs/prd/) - Product Requirements Documents

## ライセンス

Private - All rights reserved
