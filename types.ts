
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
