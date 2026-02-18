# ADR 0010: GCPプロジェクト移行

## ステータス
Accepted

## コンテキスト

旧GCPプロジェクト（`caremanager-ai-copilot`、オーナー: `hy.unimail.11@gmail.com`）の課金が無効化され、デプロイやCloud Functions実行が不可能になった。

プロジェクトの継続運用のため、ACGアカウント（`yasushi.honda@aozora-cg.com`）所有の新プロジェクトへの移行が必要となった。

## 決定

新GCPプロジェクト `caremanager-ai-copilot-486212` にインフラ・コード・CI/CDを全面移行する。

### 移行マッピング

| 項目 | 旧 | 新 |
|------|-----|-----|
| Project ID | `caremanager-ai-copilot` | `caremanager-ai-copilot-486212` |
| Project Number | `624222634250` | `405962110931` |
| Owner | `hy.unimail.11@gmail.com` | `yasushi.honda@aozora-cg.com` |
| Hosting URL | `caremanager-ai-copilot.web.app` | `caremanager-ai-copilot-486212.web.app` |

### 移行対象

1. **Firebase**: Hosting, Authentication, Firestore（asia-northeast1）
2. **Cloud Functions**: analyzeAssessment, refineCareGoal, generateCarePlanDraft, generateCarePlanV2
3. **IAM**: cf-vertex-ai SA, github-actions-deploy SA
4. **CI/CD**: Workload Identity Federation, GitHub Secrets
5. **コード**: Firebase config（14ファイル）

### 移行しないもの

- Firestoreの既存データ（デモ段階で少量のためシードスクリプトで再投入）
- npmパッケージ名（`caremanager-ai-copilot`のまま）
- GitHubリポジトリ名
- gcloud CLI設定名（`CLOUDSDK_ACTIVE_CONFIG_NAME`）

## 理由

### 1. アカウント統一

- 開発・運用を `yasushi.honda@aozora-cg.com`（ACG）に一本化
- 課金管理の簡素化

### 2. データ移行の省略

- Stage 1（MVP）段階でデモデータのみ
- シードスクリプト（`scripts/seed.ts`）で再投入可能
- Firestoreセキュリティルール・インデックスはコードで管理

## 結果

### 良い点
- 課金管理が一元化され運用が簡素化
- 新プロジェクトでクリーンな状態からスタート
- 旧プロジェクトの不要リソースを引き継がない

### 注意点
- 本番URLが変更（ブックマーク等の更新が必要）
- 旧プロジェクトのFirestoreデータは移行されない
- GitHub Secretsの手動更新が必要

## 関連 ADR
- ADR 0001: GCP/Firebase プラットフォーム選定
- ADR 0003: Workload Identity Federation 採用
