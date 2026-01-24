# ADR-0005: Firebase Authentication with Google OAuth

## Status
Accepted

## Date
2026-01-25

## Context
ケアマネのミカタでは、ユーザーごとにアセスメント・ケアプランデータを分離して保存する必要がある。これには認証システムが必須である。

### 要件
1. ユーザー識別（uid）によるデータ分離
2. シンプルなログインフロー
3. セキュアな認証
4. Firebase/GCPエコシステムとの統合

### 検討した選択肢

#### A. Firebase Authentication + Google OAuth（採用）
- **Pros:**
  - Firebaseエコシステムとシームレスに統合
  - Google Workspaceユーザーに馴染みやすい
  - セキュリティルールでuidベースの認可が容易
  - 実装が簡単（SDK提供）
- **Cons:**
  - Googleアカウントが必須

#### B. Firebase Authentication + Email/Password
- **Pros:**
  - Googleアカウント不要
- **Cons:**
  - パスワード管理が必要
  - パスワードリセットフローの実装が必要
  - ユーザー体験が複雑

#### C. 独自認証システム
- **Pros:**
  - 完全なカスタマイズ性
- **Cons:**
  - セキュリティリスクが高い
  - 実装コストが大きい
  - Firestoreセキュリティルールとの統合が複雑

## Decision
**Firebase Authentication + Google OAuth** を採用する。

### 理由
1. ケアマネージャーは多くの場合、業務でGoogleアカウントを使用している
2. Firestoreセキュリティルールとの統合が自然
3. 最小限の実装でセキュアな認証が実現可能
4. Cloud Functionsの認証チェックも自動的に行える

## Consequences

### Positive
- `request.auth.uid`でユーザー分離が容易
- ログインフローが1クリックで完了
- セッション管理が自動化される

### Negative
- Googleアカウントがないユーザーは利用不可
- 将来的に他の認証プロバイダー追加時は拡張が必要

## Implementation

### Frontend (AuthContext.tsx)
```typescript
const login = async () => {
  await signInWithPopup(auth, googleProvider);
};
```

### Firestore Security Rules
```javascript
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

### Cloud Functions
```typescript
export const analyzeAssessment = onCall(
  { ... },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }
    // request.auth.uid でユーザー識別
  }
);
```

## References
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- PRD: docs/prd/phase1-authentication.md
