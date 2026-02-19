
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

export interface Client {
  id: string;
  name: string;
  kana: string;
  birthDate: string;
  gender: '男' | '女';
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
  phone: string | null;
  insurerNumber: string | null;
  insuredNumber: string | null;
  certificationDate: string | null;
  certificationExpiry: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/** 利用者作成・更新用の型 */
export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>;

/** 後方互換エイリアス */
export type User = Client;

export interface CareGoal {
  id: string;
  content: string;
  status: 'not_started' | 'in_progress' | 'achieved' | 'discontinued';
}

/** サービス内容（第2表） */
export interface CarePlanService {
  id: string;
  content: string;    // サービス内容
  type: string;       // サービス種別
  frequency: string;  // 頻度
}

/** ニーズ別構造（第2表 V2） */
export interface CarePlanNeed {
  id: string;
  content: string;                // ニーズ（生活全般の課題）
  longTermGoal: string;           // 長期目標（6ヶ月〜1年）
  shortTermGoals: CareGoal[];     // 短期目標（既存CareGoal再利用）
  services: CarePlanService[];    // サービス内容
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

  // V2: ニーズ別構造（optional → V1データとの後方互換）
  needs?: CarePlanNeed[];
  totalDirectionPolicy?: string;  // 総合的な援助の方針

  // 第3表: 週間サービス計画表（optional）
  weeklySchedule?: WeeklySchedule;
}

// ------------------------------------------------------------------
// 第3表: 週間サービス計画表
// ------------------------------------------------------------------

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface WeeklyServiceEntry {
  id: string;
  serviceType: string;    // サービス種別
  provider: string;       // 事業所名
  content: string;        // サービス内容
  days: DayOfWeek[];      // 実施曜日
  startTime: string;      // 開始時間 "HH:mm"
  endTime: string;        // 終了時間 "HH:mm"
  frequency: string;      // 頻度メモ
  notes: string;          // 備考
}

export interface WeeklySchedule {
  entries: WeeklyServiceEntry[];
  mainActivities: string; // 主な日常生活上の活動
  weeklyNote: string;     // 週単位以外のサービス
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

// ------------------------------------------------------------------
// Service Coordination Meeting Records (サービス担当者会議の記録 - 第4表)
// 担当者会議の記録・照会内容
// ------------------------------------------------------------------

/** 会議の開催方式 */
export type MeetingFormat =
  | 'in_person'      // 対面開催
  | 'online'         // オンライン開催
  | 'hybrid';        // ハイブリッド

/** 出席者情報 */
export interface MeetingAttendee {
  name: string;           // 氏名
  organization: string;   // 所属事業所
  profession: string;     // 職種（介護福祉士、看護師、PT、OT等）
  attended: boolean;      // 出席したか
  inquiryMethod?: string; // 照会方法（欠席時：電話、FAX、メール等）
  inquiryDate?: string;   // 照会日（欠席時）
  inquiryResponse?: string; // 照会回答内容（欠席時）
}

/** 検討項目 */
export interface MeetingAgendaItem {
  id: string;
  topic: string;          // 検討項目
  discussion: string;     // 検討内容
  conclusion: string;     // 結論
  responsible?: string;   // 担当者/事業所
}

/** サービス担当者会議記録 */
export interface ServiceMeetingRecord {
  id: string;

  // 関連情報
  userId: string;
  carePlanId: string;     // 必須：どのケアプランに関する会議か

  // 会議基本情報
  meetingDate: string;    // 開催日時 (ISO8601)
  meetingLocation: string; // 開催場所
  meetingFormat: MeetingFormat;
  meetingPurpose: string;  // 開催目的（新規、更新、変更、緊急等）

  // 出席者
  attendees: MeetingAttendee[];

  // 利用者・家族の参加
  userAttended: boolean;      // 利用者の出席
  userOpinion: string;        // 利用者の発言・意向
  familyAttended: boolean;    // 家族の出席
  familyOpinion: string;      // 家族の発言・意向

  // 検討内容
  agendaItems: MeetingAgendaItem[];

  // ケアプラン原案の説明・同意
  carePlanExplained: boolean;  // ケアプラン原案を説明したか
  carePlanAgreed: boolean;     // 同意を得たか
  carePlanModifications: string; // 会議を踏まえた修正点

  // 残された課題
  remainingIssues: string;

  // 次回予定
  nextMeetingSchedule: string; // 次回会議予定

  // メタデータ
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** サービス担当者会議記録の作成用 */
export type ServiceMeetingRecordInput = Omit<ServiceMeetingRecord, 'id' | 'createdAt' | 'updatedAt'>;

// ------------------------------------------------------------------
// Hospital Admission Information Sheet (入院時情報連携シート)
// 医療機関との情報連携用
// ------------------------------------------------------------------

/** 入院時情報連携シート */
export interface HospitalAdmissionSheet {
  // 作成情報
  createdDate: string;        // 作成日
  careManagerName: string;    // 担当介護支援専門員
  careManagerOffice: string;  // 居宅介護支援事業所名
  careManagerPhone: string;   // 連絡先電話番号
  careManagerFax: string;     // FAX番号

  // 利用者基本情報
  userName: string;           // 氏名
  userKana: string;           // フリガナ
  birthDate: string;          // 生年月日
  age: number;                // 年齢
  gender: '男' | '女';        // 性別
  address: string;            // 住所
  phone: string;              // 電話番号

  // 介護保険情報
  insurerNumber: string;      // 保険者番号
  insuredNumber: string;      // 被保険者番号
  careLevel: CareLevel;       // 要介護度
  certificationDate: string;  // 認定日
  certificationExpiry: string; // 認定有効期限

  // 家族・緊急連絡先
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    isKeyPerson: boolean;     // キーパーソンか
  }>;

  // 医療情報
  primaryDoctor: string;      // 主治医
  primaryHospital: string;    // かかりつけ医療機関
  medicalHistory: string;     // 既往歴・現病歴
  currentMedications: string; // 服薬情報
  allergies: string;          // アレルギー
  medicalAlerts: string[];    // 医療上の注意事項

  // 身体状況
  adlSummary: {
    mobility: string;         // 移動
    eating: string;           // 食事
    toileting: string;        // 排泄
    bathing: string;          // 入浴
    dressing: string;         // 更衣
  };

  // 認知・コミュニケーション
  cognitionLevel: string;     // 認知機能の状態
  communicationAbility: string; // コミュニケーション能力
  behavioralIssues: string;   // 行動上の問題

  // 現在の介護サービス利用状況
  currentServices: Array<{
    serviceType: string;      // サービス種別
    provider: string;         // 事業所名
    frequency: string;        // 利用頻度
    content: string;          // サービス内容
  }>;

  // 特記事項・申し送り
  specialNotes: string;       // 特記事項
  dietaryRestrictions: string; // 食事制限
  sleepPattern: string;       // 睡眠パターン
  preferences: string;        // 本人の好み・習慣

  // 退院後の意向
  dischargeIntentions: string; // 退院後の生活についての意向
}
