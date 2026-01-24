# ADR 0001: GCP/Firebase プラットフォーム選定

## ステータス
Accepted

## コンテキスト

「ケアマネのミカタ 2025」は、ケアマネージャー向けのAI支援アプリケーションであり、以下の要件を満たす必要がある：

1. **AI機能**: Gemini 2.5 Flash による音声解析・アセスメント支援
2. **認証**: Google認証（介護事業所ではGoogle Workspaceが普及）
3. **データ永続化**: ユーザーごとのアセスメント・ケアプランデータ保存
4. **日本国内データ保存**: 個人情報保護の観点から日本リージョン必須
5. **低コスト**: 初期段階での運用コスト最小化
6. **スケーラビリティ**: 将来的なマルチテナント対応への拡張性

現在の開発環境は Google AI Studio を使用しているが、本番運用には以下の課題がある：
- API キーのクライアント露出リスク
- データ永続化機能なし
- 認証機能なし

## 決定

**GCP + Firebase** をプラットフォームとして採用する。

### アーキテクチャ構成

| コンポーネント | 採用技術 | リージョン |
|---------------|---------|-----------|
| フロントエンド | Firebase Hosting | グローバルCDN |
| バックエンド | Cloud Functions for Firebase | asia-northeast1 |
| データベース | Firestore | asia-northeast1 |
| 認証 | Firebase Authentication | - |
| AI | Vertex AI (Gemini 2.5 Flash) | asia-northeast1 |
| CI/CD | GitHub Actions + Workload Identity | - |
| コンテナ管理 | Artifact Registry | asia-northeast1 |

## 理由

### 1. GCP/Firebase を選択した理由

**vs AWS:**
- Gemini 2.5 との統合が最もシームレス
- Firebase Authentication で Google 認証が容易
- Firestore のリアルタイム同期機能
- Cloud Functions との統合が密

**vs Azure:**
- Gemini は GCP のみでネイティブサポート
- Firebase エコシステムがない

**vs Supabase + Vercel:**
- Vertex AI との統合には GCP が必要
- 認証・DB・関数が単一プラットフォームで完結

### 2. Cloud Functions を選択した理由（vs Cloud Run）

- Firebase SDK との緊密な統合
- コールドスタートの影響が少ない（音声解析は数秒かかるため）
- 開発・デプロイの簡素さ
- 将来的に Cloud Run への移行も可能

### 3. Firestore を選択した理由（vs Cloud SQL）

- サーバーレスで管理不要
- リアルタイム同期が将来的に有用
- Firebase SDK からのダイレクトアクセス可能
- 柔軟なスキーマ（アセスメント項目の変更に対応）

### 4. Workload Identity Federation を選択した理由

- サービスアカウントキーの管理不要
- GitHub Actions との安全な連携
- キーローテーションが不要

## 結果

### 良い点
- 統一されたプラットフォームで管理が容易
- Google認証とFirestoreの統合が自然
- Vertex AI への安全なアクセス（サービスアカウント経由）
- 日本リージョンでのデータ保存が保証

### 注意点
- GCP へのベンダーロックイン
- Firestore の料金モデル（読み書き課金）への注意が必要
- Cloud Functions のコールドスタート（軽微）

### コスト管理施策
- Artifact Registry: 最新2世代のみ保持
- Firestore: 適切なインデックス設計
- Cloud Functions: メモリ・タイムアウト最適化

## 関連 ADR
- ADR 0002: Vertex AI 統合方式
- ADR 0003: Workload Identity Federation 採用
- ADR 0004: Firestore スキーマ設計
