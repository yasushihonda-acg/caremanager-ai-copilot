# ADR 0004: Firestore スキーマ設計

## ステータス
Accepted

## コンテキスト

「ケアマネのミカタ 2025」では、以下のデータを永続化する必要がある：

1. **ユーザー情報**: 認証ユーザーの基本情報
2. **アセスメントデータ**: 23項目アセスメントの記録
3. **ケアプラン**: 作成されたケアプランと目標

現在は IndexedDB によるローカル保存のみで、以下の課題がある：
- デバイス間の同期ができない
- データのバックアップがない
- 複数端末での利用が困難

## 決定

**Firestore** をデータベースとして採用し、以下のスキーマを使用する。

### コレクション構造

```
/users/{userId}
  - email: string
  - displayName: string
  - createdAt: timestamp
  - updatedAt: timestamp

/users/{userId}/assessments/{assessmentId}
  - date: timestamp
  - content: AssessmentData (23項目)
  - summary: string
  - createdAt: timestamp
  - updatedAt: timestamp

/users/{userId}/carePlans/{planId}
  - assessmentId: string (参照)
  - dates: {
      assessment: timestamp,
      draft: timestamp,
      meeting?: timestamp,
      consent?: timestamp,
      delivery?: timestamp
    }
  - status: 'draft' | 'review' | 'consented' | 'active'
  - longTermGoal: string
  - shortTermGoals: CareGoal[]
  - createdAt: timestamp
  - updatedAt: timestamp
```

### AssessmentData（content フィールド）

```typescript
{
  // 1. 基本情報・健康
  serviceHistory: string;     // サービス利用状況
  healthStatus: string;       // 健康状態
  pastHistory: string;        // 既往歴
  skinCondition: string;      // 皮膚・褥瘡
  oralHygiene: string;        // 口腔衛生
  fluidIntake: string;        // 水分摂取

  // 2. ADL
  adlTransfer: string;        // 寝返り・移乗
  adlEating: string;          // 食事
  adlToileting: string;       // 排泄
  adlBathing: string;         // 入浴
  adlDressing: string;        // 着脱

  // 3. IADL
  iadlCooking: string;        // 調理等
  iadlShopping: string;       // 買い物
  iadlMoney: string;          // 金銭管理
  medication: string;         // 服薬

  // 4. 認知・精神
  cognition: string;          // 認知
  communication: string;      // コミュニケーション

  // 5. 社会・環境
  socialParticipation: string;// 社会参加
  residence: string;          // 居住環境
  familySituation: string;    // 家族状況

  // 6. 特別な状況
  maltreatmentRisk: string;   // 虐待リスク

  // 7. その他
  environment: string;        // 総合課題
}
```

## 理由

### 1. サブコレクション方式を選択した理由

**vs フラットコレクション（/assessments/{id}）:**
- ユーザーごとのデータ分離が明確
- セキュリティルールがシンプル
- クエリ効率が良い（ユーザーの全データ取得）

**vs 単一ドキュメント（全データを1ドキュメントに）:**
- ドキュメントサイズ制限（1MB）を回避
- 個別更新が効率的
- 履歴管理が容易

### 2. セキュリティルール設計

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);

      match /assessments/{assessmentId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }

      match /carePlans/{planId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }
    }
  }
}
```

### 3. 将来のマルチテナント対応

現在はシングルテナント設計だが、将来的に以下の拡張が可能：

```
/organizations/{orgId}
  /users/{userId}
    /assessments/{assessmentId}
    /carePlans/{planId}
```

## 結果

### 良い点
- ユーザーごとのデータ分離が明確
- セキュリティルールがシンプル
- Firebase SDK から直接アクセス可能
- スキーマが柔軟（アセスメント項目の変更に対応）

### 注意点
- 読み書き課金のため、効率的なクエリ設計が必要
- 複雑な検索にはインデックス設計が必要
- バックアップ設定が必要（別途設定）

### インデックス（将来追加）

```json
{
  "indexes": [
    {
      "collectionGroup": "assessments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## 関連 ADR
- ADR 0001: GCP/Firebase プラットフォーム選定
