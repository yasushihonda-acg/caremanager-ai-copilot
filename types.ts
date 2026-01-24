
// ------------------------------------------------------------------
// Domain Models based on 2025 Japanese Long-Term Care Standards
// ------------------------------------------------------------------

export enum CareLevel {
  SUPPORT_1 = '要支援1',
  SUPPORT_2 = '要支援2',
  CARE_1 = '要介護1',
  CARE_2 = '要介護2',
  CARE_3 = '要介護3',
  CARE_4 = '要介護4',
  CARE_5 = '要介護5',
}

export interface User {
  id: string;
  name: string;
  kana: string;
  birthDate: string;
  careLevel: CareLevel;
  lifeHistory: {
    hobbies: string[];
    previousOccupation: string;
    topicsToAvoid: string[]; // NG Words
    importantMemories: string;
  };
  // Risk Management Fields
  medicalAlerts: string[]; // e.g., "Pacemaker", "Penicillin Allergy", "Infection Risk"
  address: string;
}

export interface CareGoal {
  id: string;
  content: string;
  status: 'not_started' | 'in_progress' | 'achieved' | 'discontinued';
}

export interface CarePlan {
  id: string;
  userId: string;
  status: 'draft' | 'review' | 'consented' | 'active';
  
  // Critical Dates for "Golden Thread" Enforcement
  assessmentDate: string; // アセスメント日
  draftDate: string;      // 原案作成日
  meetingDate: string;    // 担当者会議日
  consentDate: string;    // 利用者同意日
  deliveryDate: string;   // 交付日
  
  longTermGoal: string;
  shortTermGoals: CareGoal[];
}

// ------------------------------------------------------------------
// Updated Assessment Data Structure
// Compliant with "Standard Items for Needs Analysis" (23 Items)
// ------------------------------------------------------------------
export interface AssessmentData {
  // 1. 基本情報・健康
  serviceHistory: string;     // サービス利用状況 (New: Item 23 Compliance)
  healthStatus: string;       // 健康状態
  pastHistory: string;        // 既往歴
  skinCondition: string;      // 皮膚・褥瘡 (New: Item 23 Compliance)
  oralHygiene: string;        // 口腔衛生 (New: Item 23 Compliance)
  fluidIntake: string;        // 水分摂取 (New: Item 23 Compliance)

  // 2. ADL (身体機能・起居動作)
  adlTransfer: string;        // 寝返り・起き上がり・移乗・移動
  adlEating: string;          // 食事
  adlToileting: string;       // 排泄
  adlBathing: string;         // 入浴・整容
  adlDressing: string;        // 衣服着脱 (New: Item 23 Compliance)
  
  // 3. IADL (生活機能)
  iadlCooking: string;        // 調理・洗濯・掃除
  iadlShopping: string;       // 買い物
  iadlMoney: string;          // 金銭管理
  medication: string;         // 服薬管理
  
  // 4. 認知・精神
  cognition: string;          // 認知能力・意思決定能力
  communication: string;      // 意思疎通

  // 5. 社会・環境
  socialParticipation: string;// 社会参加・対人関係
  residence: string;          // 居住環境
  familySituation: string;    // 家族状況・介護力
  
  // 6. 特別な状況
  maltreatmentRisk: string;   // 虐待の兆候
  
  // 7. その他
  environment: string;        // 特記事項・総合的な課題
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AppSettings {
  fontSize: 'normal' | 'large';
  highContrast: boolean;
}

// ------------------------------------------------------------------
// Monitoring Records (モニタリング記録)
// 月次モニタリングの記録データ
// ------------------------------------------------------------------

/** 目標の評価状態 */
export type GoalEvaluationStatus =
  | 'achieved'      // 達成
  | 'progressing'   // 改善傾向
  | 'unchanged'     // 変化なし
  | 'declined'      // 悪化傾向
  | 'not_evaluated'; // 未評価

/** 個別目標の評価 */
export interface GoalEvaluation {
  goalId: string;
  goalContent: string;  // 目標の内容（参照用）
  status: GoalEvaluationStatus;
  observation: string;  // 観察内容・変化の詳細
}

/** サービス利用状況 */
export interface ServiceUsageRecord {
  serviceType: string;    // サービス種別
  provider: string;       // 事業所名
  plannedFrequency: string; // 計画上の頻度
  actualUsage: string;    // 実際の利用状況
  remarks: string;        // 備考
}

/** モニタリング記録 */
export interface MonitoringRecord {
  id: string;

  // 関連情報
  carePlanId: string;
  userId: string;

  // 日付情報
  recordDate: string;     // 記録作成日 (ISO8601)
  visitDate: string;      // モニタリング訪問日 (ISO8601)
  visitMethod: 'home_visit' | 'online' | 'phone'; // 訪問方法

  // 目標評価
  goalEvaluations: GoalEvaluation[];

  // 全体評価
  overallCondition: string;      // 利用者の全体的な状態
  healthChanges: string;         // 健康状態の変化
  livingConditionChanges: string; // 生活状況の変化

  // サービス利用状況
  serviceUsageRecords: ServiceUsageRecord[];
  serviceUsageSummary: string;   // サービス利用状況の総括

  // 利用者・家族の意向
  userOpinion: string;           // 利用者の意見
  familyOpinion: string;         // 家族の意見

  // 今後の対応
  needsPlanRevision: boolean;    // ケアプラン見直しの必要性
  revisionReason: string;        // 見直しが必要な理由
  nextActions: string;           // 今後の対応・申し送り
  nextMonitoringDate: string;    // 次回モニタリング予定日

  // メタデータ
  createdBy: string;             // 作成者ID
  createdAt: string;             // 作成日時 (ISO8601)
  updatedAt: string;             // 更新日時 (ISO8601)
}

/** モニタリング記録の作成用（IDなし） */
export type MonitoringRecordInput = Omit<MonitoringRecord, 'id' | 'createdAt' | 'updatedAt'>;

// ------------------------------------------------------------------
// Support Records (支援経過記録 - 第5表)
// 日々の支援経過を記録
// ------------------------------------------------------------------

/** 支援経過の種別 */
export type SupportRecordType =
  | 'phone_call'        // 電話連絡
  | 'home_visit'        // 訪問
  | 'office_visit'      // 来所
  | 'service_coordination' // サービス調整
  | 'meeting'           // 会議
  | 'document'          // 書類作成・送付
  | 'other';            // その他

/** 支援経過記録 */
export interface SupportRecord {
  id: string;

  // 関連情報
  userId: string;
  carePlanId?: string;   // 関連するケアプランID（任意）

  // 記録内容（いつ・誰が・誰に・どのように・何を）
  recordDate: string;    // 記録日時 (ISO8601)
  recordType: SupportRecordType;

  // 誰が
  actor: string;         // 対応者（ケアマネ名など）

  // 誰に・誰と
  counterpart: string;   // 相手方（利用者本人、家族、事業所名など）

  // どのように・何を
  content: string;       // 内容

  // 結果・対応
  result: string;        // 結果・対応内容

  // メタデータ
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** 支援経過記録の作成用 */
export type SupportRecordInput = Omit<SupportRecord, 'id' | 'createdAt' | 'updatedAt'>;
