# ADR 0002: Vertex AI 統合方式

## ステータス
Accepted

## コンテキスト

「ケアマネのミカタ 2025」では、Gemini 2.5 Flash を使用して音声からアセスメント情報を抽出する機能が必要である。

現在の開発環境では Google AI Studio の API キーを使用しているが、本番環境では以下の課題がある：

1. **セキュリティ**: API キーがクライアントに露出するリスク
2. **費用管理**: 直接アクセスでは利用制限が困難
3. **監査**: 誰がどれだけ使用したかの追跡が困難
4. **リージョン**: Google AI Studio は日本リージョン未対応

## 決定

**Cloud Functions for Firebase** を経由して **Vertex AI** にアクセスする方式を採用する。

### アーキテクチャ

```
[フロントエンド]
      |
      | (Firebase Authentication で認証済み)
      v
[Cloud Functions] ---> [Vertex AI Gemini 2.5 Flash]
      |                      (asia-northeast1)
      | (サービスアカウント認証)
      v
```

### 実装詳細

| 項目 | 設定値 |
|------|--------|
| 関数リージョン | asia-northeast1 |
| Vertex AI リージョン | asia-northeast1 |
| モデル | gemini-2.5-flash-preview-05-20 |
| サービスアカウント | cf-vertex-ai@caremanager-ai-copilot-486212.iam.gserviceaccount.com |
| メモリ | 1GiB |
| タイムアウト | 120秒 |

## 理由

### 1. Cloud Functions 経由を選択した理由

**vs クライアント直接アクセス:**
- API キーの漏洩リスクがない
- Firebase Authentication との統合が容易
- サーバーサイドでの入力検証が可能
- 利用量の制御が可能

**vs Cloud Run:**
- Firebase SDK との統合が密
- 音声解析は Cold Start の影響が軽微（処理に数秒かかるため）
- 設定がシンプル

### 2. サービスアカウントを使用した理由

- Workload Identity により自動認証
- キーファイルの管理が不要
- IAM による細かい権限制御

### 3. 日本リージョン（asia-northeast1）を選択した理由

- データ主権: 介護情報は日本国内での処理が望ましい
- レイテンシ: 日本のユーザー向けに最適化
- Vertex AI Gemini 2.5 Flash が asia-northeast1 で利用可能

## 結果

### 良い点
- API キーがクライアントに露出しない
- Firebase Authentication との統合で認証が簡潔
- 日本リージョンでのデータ処理
- サーバーサイドでの入力検証・エラーハンドリング

### 注意点
- Cloud Functions のコスト（invocation + compute time）
- Cold Start による初回遅延（軽微）
- 音声データのアップロードサイズ制限（Cloud Functions: 10MB）

### コード構成

```
functions/
├── src/
│   ├── index.ts        # エントリーポイント
│   └── vertexAi.ts     # Vertex AI 統合
├── package.json
└── tsconfig.json
```

## 関連 ADR
- ADR 0001: GCP/Firebase プラットフォーム選定
- ADR 0003: Workload Identity Federation 採用
