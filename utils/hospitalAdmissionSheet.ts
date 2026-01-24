/**
 * 入院時情報連携シート生成ユーティリティ
 *
 * アセスメントデータから入院時情報連携シートを自動生成します。
 */

import type { AssessmentData, HospitalAdmissionSheet, CareLevel } from '../types';

export interface UserBasicInfo {
  name: string;
  kana: string;
  birthDate: string;
  gender: '男' | '女';
  address: string;
  phone: string;
  careLevel: CareLevel;
  certificationDate: string;
  certificationExpiry: string;
  insurerNumber: string;
  insuredNumber: string;
}

export interface CareManagerInfo {
  name: string;
  office: string;
  phone: string;
  fax: string;
}

export interface ServiceInfo {
  serviceType: string;
  provider: string;
  frequency: string;
  content: string;
}

/**
 * アセスメントデータから入院時情報連携シートを生成
 */
export function generateHospitalAdmissionSheet(
  assessment: AssessmentData,
  userInfo: UserBasicInfo,
  careManagerInfo: CareManagerInfo,
  emergencyContacts: HospitalAdmissionSheet['emergencyContacts'],
  currentServices: ServiceInfo[],
  additionalInfo?: {
    primaryDoctor?: string;
    primaryHospital?: string;
    allergies?: string;
    medicalAlerts?: string[];
    dietaryRestrictions?: string;
    sleepPattern?: string;
    preferences?: string;
    dischargeIntentions?: string;
  }
): HospitalAdmissionSheet {
  // 年齢計算
  const birthDate = new Date(userInfo.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return {
    // 作成情報
    createdDate: new Date().toISOString().split('T')[0],
    careManagerName: careManagerInfo.name,
    careManagerOffice: careManagerInfo.office,
    careManagerPhone: careManagerInfo.phone,
    careManagerFax: careManagerInfo.fax,

    // 利用者基本情報
    userName: userInfo.name,
    userKana: userInfo.kana,
    birthDate: userInfo.birthDate,
    age,
    gender: userInfo.gender,
    address: userInfo.address,
    phone: userInfo.phone,

    // 介護保険情報
    insurerNumber: userInfo.insurerNumber,
    insuredNumber: userInfo.insuredNumber,
    careLevel: userInfo.careLevel,
    certificationDate: userInfo.certificationDate,
    certificationExpiry: userInfo.certificationExpiry,

    // 家族・緊急連絡先
    emergencyContacts,

    // 医療情報（アセスメントから抽出）
    primaryDoctor: additionalInfo?.primaryDoctor || '',
    primaryHospital: additionalInfo?.primaryHospital || '',
    medicalHistory: [assessment.pastHistory, assessment.healthStatus]
      .filter(Boolean)
      .join('\n'),
    currentMedications: assessment.medication || '',
    allergies: additionalInfo?.allergies || '',
    medicalAlerts: additionalInfo?.medicalAlerts || [],

    // 身体状況（アセスメントから抽出）
    adlSummary: {
      mobility: assessment.adlTransfer || '',
      eating: assessment.adlEating || '',
      toileting: assessment.adlToileting || '',
      bathing: assessment.adlBathing || '',
      dressing: assessment.adlDressing || '',
    },

    // 認知・コミュニケーション
    cognitionLevel: assessment.cognition || '',
    communicationAbility: assessment.communication || '',
    behavioralIssues: extractBehavioralIssues(assessment),

    // 現在の介護サービス
    currentServices: currentServices.map(s => ({
      serviceType: s.serviceType,
      provider: s.provider,
      frequency: s.frequency,
      content: s.content,
    })),

    // 特記事項
    specialNotes: buildSpecialNotes(assessment),
    dietaryRestrictions: additionalInfo?.dietaryRestrictions || assessment.fluidIntake || '',
    sleepPattern: additionalInfo?.sleepPattern || '',
    preferences: additionalInfo?.preferences || '',

    // 退院後の意向
    dischargeIntentions: additionalInfo?.dischargeIntentions || '',
  };
}

/**
 * アセスメントから行動上の問題を抽出
 */
function extractBehavioralIssues(assessment: AssessmentData): string {
  const issues: string[] = [];

  // 認知関連から問題行動を検出
  if (assessment.cognition) {
    const cognitionLower = assessment.cognition.toLowerCase();
    if (cognitionLower.includes('徘徊') || cognitionLower.includes('はいかい')) {
      issues.push('徘徊傾向あり');
    }
    if (cognitionLower.includes('興奮') || cognitionLower.includes('暴言') || cognitionLower.includes('暴力')) {
      issues.push('易興奮性あり');
    }
    if (cognitionLower.includes('拒否')) {
      issues.push('介護拒否傾向あり');
    }
  }

  // 虐待リスク関連
  if (assessment.maltreatmentRisk) {
    issues.push(`注意事項: ${assessment.maltreatmentRisk}`);
  }

  return issues.join('\n');
}

/**
 * アセスメントから特記事項を構築
 */
function buildSpecialNotes(assessment: AssessmentData): string {
  const notes: string[] = [];

  // 皮膚状態
  if (assessment.skinCondition) {
    notes.push(`【皮膚状態】${assessment.skinCondition}`);
  }

  // 口腔状態
  if (assessment.oralHygiene) {
    notes.push(`【口腔状態】${assessment.oralHygiene}`);
  }

  // 水分摂取
  if (assessment.fluidIntake) {
    notes.push(`【水分摂取】${assessment.fluidIntake}`);
  }

  // 環境・その他
  if (assessment.environment) {
    notes.push(`【その他】${assessment.environment}`);
  }

  return notes.join('\n');
}

/**
 * 入院時情報連携シートをテキスト形式で出力（印刷用）
 */
export function formatHospitalAdmissionSheetForPrint(sheet: HospitalAdmissionSheet): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('　　　　　　　　　入院時情報連携シート');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`作成日: ${sheet.createdDate}`);
  lines.push('');
  lines.push('【介護支援専門員情報】');
  lines.push(`  事業所名: ${sheet.careManagerOffice}`);
  lines.push(`  担当者名: ${sheet.careManagerName}`);
  lines.push(`  電話: ${sheet.careManagerPhone}　FAX: ${sheet.careManagerFax}`);
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('【利用者基本情報】');
  lines.push(`  氏名: ${sheet.userName}（${sheet.userKana}）`);
  lines.push(`  生年月日: ${sheet.birthDate}　（${sheet.age}歳）　${sheet.gender}`);
  lines.push(`  住所: ${sheet.address}`);
  lines.push(`  電話: ${sheet.phone}`);
  lines.push('');
  lines.push('【介護保険情報】');
  lines.push(`  保険者番号: ${sheet.insurerNumber}　被保険者番号: ${sheet.insuredNumber}`);
  lines.push(`  要介護度: ${sheet.careLevel}`);
  lines.push(`  認定有効期間: ${sheet.certificationDate} ～ ${sheet.certificationExpiry}`);
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('【緊急連絡先・家族情報】');
  for (const contact of sheet.emergencyContacts) {
    const keyPerson = contact.isKeyPerson ? '★キーパーソン' : '';
    lines.push(`  ${contact.name}（${contact.relationship}）${keyPerson}`);
    lines.push(`    電話: ${contact.phone}`);
  }
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('【医療情報】');
  lines.push(`  主治医: ${sheet.primaryDoctor}`);
  lines.push(`  かかりつけ医療機関: ${sheet.primaryHospital}`);
  lines.push('');
  lines.push('  ＜既往歴・現病歴＞');
  lines.push(`  ${sheet.medicalHistory.replace(/\n/g, '\n  ')}`);
  lines.push('');
  lines.push('  ＜服薬情報＞');
  lines.push(`  ${sheet.currentMedications}`);
  lines.push('');
  if (sheet.allergies) {
    lines.push(`  ＜アレルギー＞ ${sheet.allergies}`);
  }
  if (sheet.medicalAlerts.length > 0) {
    lines.push(`  ＜医療上の注意＞ ${sheet.medicalAlerts.join('、')}`);
  }
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('【ADL（日常生活動作）】');
  lines.push(`  移動: ${sheet.adlSummary.mobility}`);
  lines.push(`  食事: ${sheet.adlSummary.eating}`);
  lines.push(`  排泄: ${sheet.adlSummary.toileting}`);
  lines.push(`  入浴: ${sheet.adlSummary.bathing}`);
  lines.push(`  更衣: ${sheet.adlSummary.dressing}`);
  lines.push('');
  lines.push('【認知・コミュニケーション】');
  lines.push(`  認知機能: ${sheet.cognitionLevel}`);
  lines.push(`  コミュニケーション: ${sheet.communicationAbility}`);
  if (sheet.behavioralIssues) {
    lines.push(`  行動上の注意: ${sheet.behavioralIssues}`);
  }
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('【現在の介護サービス利用状況】');
  if (sheet.currentServices.length > 0) {
    for (const service of sheet.currentServices) {
      lines.push(`  ・${service.serviceType}（${service.provider}）`);
      lines.push(`    ${service.frequency}　${service.content}`);
    }
  } else {
    lines.push('  利用サービスなし');
  }
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('【特記事項・申し送り】');
  if (sheet.specialNotes) {
    lines.push(sheet.specialNotes.split('\n').map(l => `  ${l}`).join('\n'));
  }
  if (sheet.dietaryRestrictions) {
    lines.push(`  食事制限: ${sheet.dietaryRestrictions}`);
  }
  if (sheet.sleepPattern) {
    lines.push(`  睡眠: ${sheet.sleepPattern}`);
  }
  if (sheet.preferences) {
    lines.push(`  本人の好み: ${sheet.preferences}`);
  }
  lines.push('');
  if (sheet.dischargeIntentions) {
    lines.push('【退院後の意向】');
    lines.push(`  ${sheet.dischargeIntentions}`);
  }
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}
