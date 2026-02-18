# ADR 0003: Workload Identity Federation 採用

## ステータス
Accepted

## コンテキスト

GitHub Actions から Firebase/GCP にデプロイする際、認証方法を決定する必要がある。

従来の方法：
1. **サービスアカウントキー（JSON）**: GitHub Secrets にキーファイルを保存
2. **Firebase CI Token**: `firebase login:ci` で生成したトークンを使用

これらの方法には以下の課題がある：
- キーのローテーション管理が必要
- キー漏洩時のリスク
- 有効期限の管理

## 決定

**Workload Identity Federation** を採用する。

### 設定

| 項目 | 値 |
|------|-----|
| Workload Identity Pool | `github-pool` |
| OIDC Provider | `github-provider` |
| Issuer URI | `https://token.actions.githubusercontent.com` |
| Service Account | `github-actions-deploy@caremanager-ai-copilot-486212.iam.gserviceaccount.com` |
| Attribute Condition | `assertion.repository_owner=='yasushihonda-acg'` |

### GitHub Secrets

```
WIF_PROVIDER: projects/405962110931/locations/global/workloadIdentityPools/github-pool/providers/github-provider
WIF_SERVICE_ACCOUNT: github-actions-deploy@caremanager-ai-copilot-486212.iam.gserviceaccount.com
```

### サービスアカウント権限

| 権限 | 用途 |
|------|------|
| `roles/firebase.admin` | Firebase 全般のデプロイ |
| `roles/artifactregistry.admin` | コンテナイメージ管理 |
| `roles/cloudbuild.builds.builder` | Cloud Build 実行 |
| `roles/cloudfunctions.admin` | Cloud Functions デプロイ |
| `roles/run.admin` | Cloud Run 管理 |
| `roles/iam.serviceAccountUser` | サービスアカウント利用 |

## 理由

### 1. セキュリティ

**vs サービスアカウントキー:**
- 長期間有効なクレデンシャルを保存しない
- GitHub Actions の OIDC トークンは短命（有効期限あり）
- キーローテーションが不要

### 2. 運用性

- GitHub リポジトリとの紐付けが自動
- `attribute.repository_owner` で組織レベルの制限が可能
- Secrets の更新が不要

### 3. 監査

- Cloud Audit Logs で認証元を追跡可能
- GitHub Actions の実行と GCP 操作が紐付く

## 結果

### 良い点
- キーファイルの管理が不要
- 自動的なトークンローテーション
- リポジトリレベルでのアクセス制御
- 監査ログでの追跡が容易

### 注意点
- 初期設定がやや複雑
- プロジェクト番号が必要（405962110931）
- GitHub Actions のワークフローに `id-token: write` 権限が必要

### GitHub Actions ワークフロー例

```yaml
jobs:
  deploy:
    permissions:
      contents: read
      id-token: write  # 必須

    steps:
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
```

## 関連 ADR
- ADR 0001: GCP/Firebase プラットフォーム選定
