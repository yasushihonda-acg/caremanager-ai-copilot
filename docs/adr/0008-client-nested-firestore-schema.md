# ADR 0008: 利用者（Client）ネスト方式のFirestoreスキーマ

## ステータス
Accepted (ADR 0004 を拡張)

## コンテキスト

ケアマネージャーは1人あたり35人前後の利用者を担当する。従来のスキーマ（ADR 0004）では `users/{userId}/assessments/{id}` のようにケアマネ直下にデータを配置していたが、複数利用者の管理には利用者単位でのデータ分離が必要となった。

### 検討した選択肢

1. **フラット方式**: 既存コレクションに `clientId` フィールドを追加し `.where('clientId', '==', clientId)` でフィルタ
2. **ネスト方式**: `users/{uid}/clients/{clientId}/assessments/{id}` のようにサブコレクションでネスト

## 決定

**ネスト方式**を採用する。

### 新スキーマ

```
users/{careManagerUID}/
  └── clients/{clientId}/
      ├── (client document: name, kana, careLevel, ...)
      ├── assessments/{assessmentId}
      ├── carePlans/{planId}
      ├── monitoringRecords/{recordId}
      ├── supportRecords/{recordId}
      └── serviceMeetingRecords/{recordId}
```

## 理由

### ネスト方式を選択した理由

| 観点 | フラット方式 | ネスト方式 |
|------|------------|-----------|
| クエリ | 全クエリに `.where('clientId', ==)` 必要 | パスで自動分離 |
| インデックス | 複合インデックス追加が必要 | 不要 |
| セキュリティルール | フィールドレベルの検証が必要 | パスベースで明確 |
| 利用者削除 | 全コレクションを個別クリーンアップ | サブコレクションごと削除可能 |
| 移行コスト | 既存関数に引数追加 + where追加 | 既存関数にパス変更のみ |

### Client型の設計

```typescript
interface Client {
  id: string;
  name: string;
  kana: string;
  birthDate: string;
  gender: '男' | '女';
  careLevel: CareLevel;
  address: string;
  phone?: string;
  medicalAlerts: string[];
  lifeHistory: LifeHistory;
  insurerNumber?: string;
  insuredNumber?: string;
  certificationDate?: string;
  certificationExpiry?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 実装パターン

```typescript
// DRYなパス構築ヘルパー
function clientPath(userId: string, clientId: string): string[] {
  return ['users', userId, 'clients', clientId];
}

// 使用例
doc(db, ...clientPath(userId, clientId), 'assessments', assessmentId)
```

## 結果

### 良い点
- 全データが利用者単位で明確に分離
- セキュリティルールがシンプル（パスベースの認可）
- 将来のデータ移行・削除が容易
- `clientPath()` ヘルパーにより統一的なパス構築

### 注意点
- 旧パスの既存データは自動移行されない（デモ段階のため手動対応）
- `firestore.rules` に旧パスの後方互換ルールを維持中（将来削除可能）
- コレクショングループクエリが必要な場合は別途インデックス設定が必要

## 関連 ADR
- ADR 0004: Firestore スキーマ設計（旧スキーマ、本ADRで拡張）
- ADR 0007: Monitoring & Support Records Schema
