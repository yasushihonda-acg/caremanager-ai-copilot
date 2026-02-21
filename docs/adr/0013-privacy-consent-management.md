# ADR 0013: プライバシーポリシー同意管理

## Status
Accepted (2026-02-21)

## Context

利用者の氏名・要介護度・医療情報が Firestore および Vertex AI（Gemini 2.5 Flash）に送信される。
パイロットユーザー展開（Stage 3）の前提として、個人情報の取り扱いについてユーザーの明示的な同意が必要。

主な要件:
- 初回ログイン時に同意確認を行い、未同意ではアプリ機能を利用できないこと（ブロッキングゲート）
- ポリシー更新時に再同意を求められること
- デモモードでは同意フローをスキップできること
- 同意記録はサーバーサイドに保存し、改ざんを防ぐこと

## Decision

### 同意データの保存先

Firestore の既存ユーザードキュメントにフィールドを追加する方式を採用。

```
/users/{careManagerUID}
  privacyConsentVersion: string   // 例: "1.0"
  privacyConsentAt: Timestamp
```

**理由**: 既存の Firestore セキュリティルール `isAuthenticated() && isOwner(userId)` でカバーできる。
新コレクションを追加するとルール変更・デプロイが必要になるため避けた。

### バージョン管理

`components/privacy/privacyContent.ts` に `PRIVACY_POLICY_VERSION` 定数を定義。
ログイン後、Firestore の `privacyConsentVersion` とこの定数を比較し、不一致の場合は再同意を要求する。

```typescript
export const PRIVACY_POLICY_VERSION = '1.0';
```

ポリシー更新時はこの定数を変更してデプロイするだけで全ユーザーに再同意フローが適用される。

### 同意フロー

```
ログイン完了
  → Firestore /users/{uid} を確認
  → privacyConsentVersion が PRIVACY_POLICY_VERSION と一致 → メイン画面
  → 不一致 or 未設定 → PrivacyConsentDialog 表示（スキップ不可）
    → 「全文を読む」→ PrivacyPolicyPage（フルスクリーン）
    → チェックボックス ON + 「同意する」→ Firestore に記録 → メイン画面
    → 「ログアウト」→ サインアウト
```

### デモユーザーのバイパス

`DEMO_USER_UID` に一致する場合は同意チェックをスキップ（自動 consented 扱い）。
デモ環境では個人情報を扱わないため同意ゲートは不要。

### Vertex AI データ送信範囲（ポリシー記載内容）

| API 機能 | 送信データ | 機微度 |
|---------|----------|-------|
| 音声アセスメント解析 | 面談音声（WebM）+ アセスメント23項目 | 高 |
| ケアプラン生成 | アセスメント23項目 + ケアマネ方針 | 高 |
| 目標校正 | 目標テキスト1文 | 低 |

- 送信先: GCP asia-northeast1 Vertex AI（Gemini 2.5 Flash）
- Cloud Functions 経由（API キーをクライアントに露出しない）
- **Vertex AI は顧客データをモデルトレーニングに使用しない**（Google Cloud 利用規約）
- 利用者の氏名・住所等は直接プロンプトに含まれないが、音声に含まれうる旨をポリシーに明記

## Consequences

### Positive
- 初回ログイン時の確実な同意取得（ブロッキングゲート）
- バージョン定数の変更のみでポリシー更新時の再同意フローが動作
- 既存 Firestore ルールを流用でき、ルール変更・デプロイが不要
- デモユーザーの業務フローに影響なし

### Negative
- `privacyConsentAt` のタイムスタンプはサーバー時刻ではなくクライアント時刻（`serverTimestamp()` は使用していない）
  → 法的証拠としての厳格性が必要な場合は `serverTimestamp()` への変更を検討
- 利用者（高齢者の家族等）の代理同意シナリオは未考慮（現在はケアマネ本人のみ対象）

### Future Work
- ポリシー文書の事業者名・連絡先はプレースホルダーのまま（本番展開前に正式情報に更新が必要）
- 法的レビューを受けた正式版ポリシーへの置き換えは Stage 3 展開時
