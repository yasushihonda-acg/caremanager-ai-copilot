# PRD: Phase 2 - データ永続化の統合

## 概要
アセスメントとケアプランのデータをFirestoreに保存・読込できるようにし、ユーザーごとにデータを分離する。

## 背景
- `services/firebase.ts`にはFirestore操作関数が実装済み
- `App.tsx`はメモリ内のみでデータを管理しており、リロードで消失
- Phase 1で認証が完了し、ユーザーIDが利用可能

## 要件

### 機能要件

#### FR-1: アセスメント保存
- アセスメント入力後、「保存」ボタンで Firestore に保存
- 自動保存（オプション）: 一定時間入力がない場合に自動保存
- 保存成功/失敗のフィードバック表示

#### FR-2: アセスメント一覧・読込
- 保存済みアセスメント一覧を表示（日付順）
- 選択したアセスメントを読み込んで編集可能に
- アセスメントの削除機能

#### FR-3: ケアプラン保存・読込
- ケアプラン保存機能（ステータス: draft/review/consented/active）
- アセスメントとケアプランの紐付け（assessmentId）
- ケアプラン一覧・読込機能

#### FR-4: 新規作成フロー
- 「新規アセスメント」ボタンで空のフォームを開始
- 既存データがある場合は確認ダイアログ

### 非機能要件

#### NFR-1: データ構造
```
users/{userId}/assessments/{assessmentId}
  - content: Record<string, string>  // 23項目
  - summary: string
  - date: Timestamp
  - createdAt: Timestamp
  - updatedAt: Timestamp

users/{userId}/carePlans/{planId}
  - assessmentId: string
  - dates: { assessment, draft, meeting, consent, delivery }
  - status: 'draft' | 'review' | 'consented' | 'active'
  - longTermGoal: string
  - shortTermGoals: Array<CareGoal>
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

#### NFR-2: セキュリティ
- Firestoreセキュリティルールで自分のデータのみアクセス可能

## UI設計

### アセスメント画面に追加
```
+----------------------------------+
| アセスメント (課題分析)           |
|                                  |
| [新規] [保存] [一覧▼]             |
|                                  |
| (既存のアセスメントフォーム)       |
+----------------------------------+

一覧ドロップダウン:
+---------------------------+
| 2026-01-24 14:30 (最新)   |
| 2026-01-23 10:00          |
| 2026-01-20 15:45          |
+---------------------------+
```

## 実装順序
1. アセスメント保存機能
2. アセスメント一覧・読込
3. ケアプラン保存・読込（Phase 3と合わせて実装）
4. 手動テスト
5. コミット

## 完了条件
- [ ] アセスメントを保存できる
- [ ] 保存済みアセスメントを読み込める
- [ ] ページリロード後もデータが保持される
- [ ] ユーザーごとにデータが分離されている
