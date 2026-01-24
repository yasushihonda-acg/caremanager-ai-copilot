# 開発ロードマップ - ケアマネのミカタ 2025

> **作成日**: 2026-01-25
>
> **基準ドキュメント**: [care-manager-insights-2025.md](research/care-manager-insights-2025.md)

---

## 現在の実装状況

### 完了済み機能

| 機能 | コンポーネント | 説明 |
|------|--------------|------|
| 音声録音・解析 | `App.tsx` | 30秒間隔のリアルタイム音声解析 |
| 23項目アセスメント抽出 | `geminiService.ts` | Gemini 2.5 Flashによる自動抽出 |
| ケアプラン原案生成 | `geminiService.ts` | 第1表・第2表の自動生成 |
| 印刷プレビュー | `PrintPreview.tsx` | 第1表・第2表の印刷対応 |
| データ永続化 | `firebase.ts` | Firestore保存・読込 |
| 認証 | `LoginScreen.tsx` | Google OAuth認証 |
| モニタリング表示 | `MonitoringView.tsx` | 基本的なモニタリング画面 |

### 現在のアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    フロントエンド (React)                    │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ App.tsx     │ Assessment  │ CarePlan    │ Monitoring      │
│ (メイン)    │ (入力)      │ (生成)      │ (評価)          │
└──────┬──────┴──────┬──────┴──────┬──────┴────────┬────────┘
       │             │             │              │
       ▼             ▼             ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloud Functions for Firebase                    │
│  - analyzeVoice (音声解析)                                  │
│  - generateCarePlan (ケアプラン生成)                        │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Vertex AI (Gemini 2.5 Flash)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ロードマップ

### Phase 1: ケアプラン品質向上（Q1 2026）

#### 1.1 第2表文例の精度向上 [P0] ✅完了

**目的**: ケアプラン第2表の生成品質を向上させ、実務で即使用可能なレベルに

**タスク**:
- [x] 疾患別・状態別の文例データベース構築 → `functions/src/prompts/templates/careplanExamples.ts`
- [x] ケアプラン生成プロンプト改善 → `functions/src/prompts/careplanPrompt.ts`
- [x] V2 API追加（複数ニーズ対応）→ `generateCarePlanV2`
- [ ] ニーズ→長期目標→短期目標の論理的整合性チェック
- [ ] サービス種別・頻度の適切な提案ロジック
- [ ] 文例のバリエーション増加（同じニーズに複数の表現）

**技術的アプローチ**:
```typescript
// プロンプトエンジニアリングの改善
const enhancedPrompt = {
  // 疾患別のコンテキスト追加
  diseaseContext: getDiseaseSpecificGuidelines(assessment),
  // 文例データベースからの参照
  referenceExamples: getRelevantExamples(needs),
  // 整合性検証ルール
  consistencyRules: getCareplanConsistencyRules(),
};
```

**成果指標**:
- 文例の修正率: 現状不明 → 20%以下
- ユーザー満足度: 目標80%以上

---

#### 1.2 アセスメント抽出精度向上 [P0] 🔲進行中

**目的**: 音声からの23項目抽出精度を向上

**タスク**:
- [x] 抽出精度の評価基盤構築 → `tests/assessment/` (2026-01-25)
  - テストケース6件（認知症、脳卒中リハビリ、独居、医療依存、虐待リスク、口腔嚥下）
  - 評価ユーティリティ（フィールド別精度、サマリーレポート）
  - CLIスクリプト `npm run test:eval`
- [ ] 実際のCloud Functions連携テスト
- [ ] 項目別の抽出ルール最適化
- [ ] 未抽出項目のハイライト表示
- [ ] 手動補完のUX改善

**評価コマンド**:
```bash
npm run test:eval              # 全テストケース評価
npm run test:eval -- --case TC001  # 特定ケースのみ
npm run test:eval -- --tag 認知症  # タグでフィルタ
```

**現在の精度（モック評価）**:
- 全体: 86%
- 改善が必要: healthStatus, pastHistory, iadlCooking, environment

**成果指標**:
- 主要項目（ADL/IADL）の抽出率: 目標90%以上

---

### Phase 2: 記録業務効率化（Q1-Q2 2026）

#### 2.1 モニタリング記録テンプレート [P1] ✅完了

**目的**: 月次モニタリング記録作成の効率化

**タスク**:
- [x] モニタリングシートのデータモデル設計 → `types.ts` (MonitoringRecord)
- [x] Firestore CRUD → `services/firebase.ts`
- [x] 評価（達成/継続/見直し）の選択式入力 → `GoalEvaluation.tsx`
- [x] モニタリング入力フォーム → `MonitoringForm.tsx`
- [ ] 前回記録との差分入力UI
- [ ] 定型文テンプレート機能
- [ ] ケアプラン目標との連動表示

**実装済みコンポーネント**:
```
components/monitoring/
├── MonitoringForm.tsx      # モニタリング入力フォーム ✅
├── GoalEvaluation.tsx      # 目標評価コンポーネント ✅
└── index.ts                # エクスポート ✅
```

**データモデル追加**:
```typescript
interface MonitoringRecord {
  id: string;
  carePlanId: string;
  recordDate: string;
  visitDate: string;

  // 目標ごとの評価
  goalEvaluations: {
    goalId: string;
    status: 'achieved' | 'progressing' | 'unchanged' | 'declined';
    observation: string;
  }[];

  // 全体評価
  overallStatus: string;
  serviceUsageStatus: string;
  nextActions: string;

  // メタデータ
  createdAt: string;
  updatedAt: string;
}
```

---

#### 2.2 支援経過記録の音声入力 [P1] ✅完了

**目的**: 日々の支援経過記録を音声で効率的に入力

**タスク**:
- [x] 支援経過記録のデータモデル設計 → `types.ts` (SupportRecord)
- [x] Firestore CRUD → `services/firebase.ts`
- [x] 音声入力コンポーネント → `VoiceRecordInput.tsx` (Web Speech API)
- [x] 支援経過記録入力フォーム → `SupportRecordForm.tsx`
- [x] 記録一覧表示 → `SupportRecordList.tsx`
- [x] 定型文テンプレート（5種類）
- [ ] 音声入力→構造化変換（いつ/誰が/誰に/どのように）の自動整形
- [ ] 運営基準に沿った記録形式への自動整形
- [ ] 記録検索機能

**実装済みコンポーネント**:
```
components/records/
├── SupportRecordForm.tsx   # 支援経過記録入力 ✅
├── SupportRecordList.tsx   # 記録一覧 ✅
├── VoiceRecordInput.tsx    # 音声入力コンポーネント ✅
└── index.ts                # エクスポート ✅
```

---

### Phase 3: 連携機能強化（Q2 2026）

#### 3.1 サービス担当者会議支援 [P2] ✅一部完了

**目的**: 会議の事前準備・議事録作成を効率化

**タスク**:
- [x] 会議記録（第4表）のデータモデル設計 → `types.ts` (ServiceMeetingRecord)
- [x] Firestore CRUD → `services/firebase.ts`
- [ ] 検討事項の事前整理テンプレート
- [ ] 会議音声からの議事録自動生成
- [ ] 欠席者照会の記録管理
- [ ] 会議記録入力フォームUI

**実装済みデータモデル**:
```typescript
interface ServiceMeetingRecord {
  id: string;
  carePlanId: string;
  meetingDate: string;
  attendees: MeetingAttendee[];
  agendaItems: MeetingAgendaItem[];
  absenteeConsultations: AbsenteeConsultation[];
  // ...
}
```

---

#### 3.2 入院時情報連携支援 [P2] ✅完了

**目的**: 医療機関との情報連携を効率化

**タスク**:
- [x] 入院時情報連携シートの自動生成 → `utils/hospitalAdmissionSheet.ts`
- [x] アセスメント情報からの要約抽出 → `generateHospitalAdmissionSheet()`
- [x] 表示コンポーネント → `components/documents/HospitalAdmissionSheetView.tsx`
- [x] App.tsxへのUI統合 → PR #2 (2026-01-25)
- [ ] PDF出力機能（将来対応）

---

### Phase 4: 業務全体最適化（Q3 2026）

#### 4.1 給付管理サポート [P3]

**目的**: 月初の給付管理業務を支援

**タスク**:
- [ ] サービス利用票（第6表・第7表）の管理
- [ ] 支給限度額の自動計算・警告
- [ ] 実績との突合チェック

---

## 技術的な改善事項

### コードベースの整理

```
現状の構成:
├── App.tsx (1ファイルに多くの機能)
├── components/ (6ファイル)
└── services/ (3ファイル)

改善後の構成:
├── App.tsx
├── components/
│   ├── assessment/       # アセスメント関連
│   ├── careplan/         # ケアプラン関連
│   ├── monitoring/       # モニタリング関連
│   ├── records/          # 各種記録関連
│   └── common/           # 共通コンポーネント
├── services/
├── hooks/                # カスタムフック
├── utils/                # ユーティリティ
└── constants/            # 定数・文例データ
```

### プロンプト管理の改善

```
functions/src/
├── prompts/
│   ├── assessment.ts     # アセスメント抽出プロンプト
│   ├── careplan.ts       # ケアプラン生成プロンプト
│   ├── monitoring.ts     # モニタリング支援プロンプト
│   └── templates/        # 文例テンプレート
└── vertexAi.ts
```

---

## マイルストーン

| マイルストーン | 目標日 | 主要成果物 |
|--------------|--------|-----------|
| M1: ケアプラン品質向上 | 2026-02-28 | 第2表精度向上、アセスメント精度向上 |
| M2: モニタリング対応 | 2026-03-31 | モニタリング記録機能、支援経過記録 |
| M3: 会議・連携支援 | 2026-05-31 | 担当者会議支援、入院時連携 |
| M4: 業務全体対応 | 2026-07-31 | 給付管理サポート |

---

## リスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| Gemini APIの仕様変更 | 機能停止 | バージョン固定、エラーハンドリング強化 |
| 法改正への対応遅れ | 実務で使えない | ADRでの変更追跡、定期的な制度確認 |
| データ量増加 | コスト増、パフォーマンス低下 | Firestoreインデックス最適化、古いデータのアーカイブ |

---

## 参考資料

- [ADR一覧](adr/)
- [ケアマネ業務調査レポート](research/care-manager-insights-2025.md)
- [Firestore スキーマ設計](adr/0004-firestore-schema.md)
