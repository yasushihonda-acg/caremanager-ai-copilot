# ADR-0007: モニタリング記録・支援経過記録スキーマ設計

## Status
Accepted

## Date
2026-01-25

## Context
ケアマネジャーは月次でモニタリング訪問を行い、ケアプランの実施状況を評価する義務がある。また、日々の支援経過を第5表に記録する必要がある。これらの記録業務を効率化するため、適切なデータモデルを設計する必要がある。

### 要件
1. モニタリング記録（運営基準に準拠）
   - 月1回以上の訪問記録
   - 目標ごとの評価（達成/継続/見直し）
   - サービス利用状況の確認
   - ケアプラン見直しの必要性判断

2. 支援経過記録（第5表）
   - いつ・誰が・誰に・どのように・何を
   - 運営基準減算を防ぐための確実な記録

3. 2024年改定対応
   - オンラインモニタリングの対応（2ヶ月に1回は訪問必須）

## Decision

### 1. モニタリング記録（MonitoringRecord）

```typescript
interface MonitoringRecord {
  id: string;
  carePlanId: string;
  userId: string;

  // 日付・方法
  recordDate: string;
  visitDate: string;
  visitMethod: 'home_visit' | 'online' | 'phone';

  // 目標評価
  goalEvaluations: GoalEvaluation[];

  // 全体評価
  overallCondition: string;
  healthChanges: string;
  livingConditionChanges: string;

  // サービス利用状況
  serviceUsageRecords: ServiceUsageRecord[];
  serviceUsageSummary: string;

  // 意向
  userOpinion: string;
  familyOpinion: string;

  // 今後の対応
  needsPlanRevision: boolean;
  revisionReason: string;
  nextActions: string;
  nextMonitoringDate: string;

  // メタデータ
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. 支援経過記録（SupportRecord）

```typescript
interface SupportRecord {
  id: string;
  userId: string;
  carePlanId?: string;

  recordDate: string;
  recordType: 'phone_call' | 'home_visit' | 'office_visit' |
              'service_coordination' | 'meeting' | 'document' | 'other';

  actor: string;        // 誰が
  counterpart: string;  // 誰に
  content: string;      // 何を
  result: string;       // 結果

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3. Firestoreコレクション構造

```
users/{userId}/
├── monitoringRecords/{recordId}
└── supportRecords/{recordId}
```

### 4. 目標評価の状態遷移

```
not_evaluated（未評価）
    ↓
┌───────────────┬───────────────┬───────────────┐
↓               ↓               ↓               ↓
achieved    progressing    unchanged      declined
（達成）    （改善傾向）   （変化なし）   （悪化傾向）
```

## Consequences

### Positive
- 運営基準に準拠した記録が可能
- ケアプランの目標と連動した評価が可能
- 音声入力との統合が容易な構造
- オンラインモニタリングに対応

### Negative
- データ量が増加（ストレージコスト）
- 古い記録のアーカイブ戦略が必要

## Implementation Notes

### インデックス
```json
{
  "collectionGroup": "monitoringRecords",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "visitDate", "order": "DESCENDING" }
  ]
}
```

### セキュリティルール
- 自分のデータのみアクセス可能（isOwner）
- 認証必須

## References
- [ADR-0004: Firestore スキーマ設計](0004-firestore-schema.md)
- [docs/research/care-manager-insights-2025.md](../research/care-manager-insights-2025.md)
