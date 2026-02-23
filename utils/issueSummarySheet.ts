/**
 * 課題整理総括表（様式1-2）生成ユーティリティ
 *
 * アセスメントデータから課題整理総括表を自動生成します。
 * 状況の事実はアセスメントテキストから取得し、
 * 現在の状況・改善可能性はキーワードマッチングで推定します。
 */

import type {
  AssessmentData,
  CurrentStatus,
  ImprovementPotential,
  IssueSummaryRow,
  IssueSummarySheet,
} from '../types';

/** 状況テキストから現在の状況（ADL分類）を推定 */
export function inferAdlStatus(text: string): CurrentStatus {
  if (!text || text.trim() === '') return '';
  const t = text;
  if (t.includes('全介助')) return '全介助';
  if (t.includes('一部介助') || t.includes('部分介助') || t.includes('介助が必要')) return '一部介助';
  if (t.includes('見守り') || t.includes('声かけ') || t.includes('監視')) return '見守り';
  if (
    t.includes('自立') ||
    t.includes('問題なし') ||
    t.includes('自分で') ||
    t.includes('自己') ||
    t.includes('できている')
  )
    return '自立';
  return '';
}

/** 状況テキストから現在の状況（健康・社会項目: 支障なし/支障あり）を推定 */
export function inferHealthStatus(text: string): CurrentStatus {
  if (!text || text.trim() === '') return '';
  if (
    text.includes('問題なし') ||
    text.includes('支障なし') ||
    text.includes('良好') ||
    text.includes('安定') ||
    text.includes('特になし')
  )
    return '支障なし';
  if (text.trim().length > 0) return '支障あり';
  return '';
}

/** テキストから改善/維持の可能性を推定 */
export function inferImprovementPotential(text: string): ImprovementPotential {
  if (!text || text.trim() === '') return '';
  const t = text;
  if (
    t.includes('改善') ||
    t.includes('向上') ||
    t.includes('回復') ||
    t.includes('リハビリ') ||
    t.includes('訓練')
  )
    return '改善';
  if (
    t.includes('悪化') ||
    t.includes('低下') ||
    t.includes('進行') ||
    t.includes('難しい') ||
    t.includes('困難')
  )
    return '悪化';
  if (text.trim().length > 0) return '維持';
  return '';
}

/** テキストから阻害要因キーワードを抽出 */
export function extractBarrierFactor(text: string): string {
  if (!text || text.trim() === '') return '';

  const barrierKeywords = [
    '筋力低下', '筋力の低下', '体力低下', 'バランス障害', '麻痺', '拘縮', '変形', '疼痛', '痛み',
    '骨折', '骨粗鬆症', '関節痛', '視力低下', '聴力低下', '嚥下障害',
    '認知機能低下', '認知症', '判断力低下', '記憶力低下',
    '意欲低下', '抑うつ', '不安', '恐怖', '拒否',
    '段差', '手すりなし', '環境', '住環境', '狭い', '整備されていない',
    '家族不在', '独居', '介護力不足', '家族負担', '支援不足',
    '疾患', '疾病', '病気', '障害', '麻痺',
  ];

  const found: string[] = [];
  for (const keyword of barrierKeywords) {
    if (text.includes(keyword) && !found.includes(keyword)) {
      found.push(keyword);
    }
  }

  // キーワードが見つからない場合でも、内容があれば先頭30文字を返す
  if (found.length === 0 && text.trim().length > 0) {
    return text.length > 30 ? text.substring(0, 30) + '…' : text;
  }

  return found.slice(0, 3).join('、');
}

/** アセスメントデータから課題整理総括表の行を生成 */
function buildRows(assessment: AssessmentData): IssueSummaryRow[] {
  const rows: IssueSummaryRow[] = [
    // 健康状態
    {
      id: 'healthStatus',
      category: '健康管理',
      item: '健康状態',
      currentStatus: inferHealthStatus(assessment.healthStatus),
      situationFact: assessment.healthStatus || '',
      barrierFactor: extractBarrierFactor(assessment.healthStatus),
      improvementPotential: inferImprovementPotential(assessment.healthStatus),
      userFamilyIntent: '',
      needs: '',
      remarks: assessment.pastHistory ? `既往歴: ${assessment.pastHistory}` : '',
    },
    {
      id: 'skinCondition',
      category: '健康管理',
      item: '皮膚・褥瘡',
      currentStatus: inferHealthStatus(assessment.skinCondition),
      situationFact: assessment.skinCondition || '',
      barrierFactor: extractBarrierFactor(assessment.skinCondition),
      improvementPotential: inferImprovementPotential(assessment.skinCondition),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'oralHygiene',
      category: '健康管理',
      item: '口腔衛生',
      currentStatus: inferHealthStatus(assessment.oralHygiene),
      situationFact: assessment.oralHygiene || '',
      barrierFactor: extractBarrierFactor(assessment.oralHygiene),
      improvementPotential: inferImprovementPotential(assessment.oralHygiene),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'fluidIntake',
      category: '健康管理',
      item: '水分摂取',
      currentStatus: inferHealthStatus(assessment.fluidIntake),
      situationFact: assessment.fluidIntake || '',
      barrierFactor: extractBarrierFactor(assessment.fluidIntake),
      improvementPotential: inferImprovementPotential(assessment.fluidIntake),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    // ADL
    {
      id: 'adlTransfer',
      category: 'ADL（日常生活動作）',
      item: '移乗・移動',
      currentStatus: inferAdlStatus(assessment.adlTransfer),
      situationFact: assessment.adlTransfer || '',
      barrierFactor: extractBarrierFactor(assessment.adlTransfer),
      improvementPotential: inferImprovementPotential(assessment.adlTransfer),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'adlEating',
      category: 'ADL（日常生活動作）',
      item: '食事',
      currentStatus: inferAdlStatus(assessment.adlEating),
      situationFact: assessment.adlEating || '',
      barrierFactor: extractBarrierFactor(assessment.adlEating),
      improvementPotential: inferImprovementPotential(assessment.adlEating),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'adlToileting',
      category: 'ADL（日常生活動作）',
      item: '排泄',
      currentStatus: inferAdlStatus(assessment.adlToileting),
      situationFact: assessment.adlToileting || '',
      barrierFactor: extractBarrierFactor(assessment.adlToileting),
      improvementPotential: inferImprovementPotential(assessment.adlToileting),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'adlBathing',
      category: 'ADL（日常生活動作）',
      item: '入浴・整容',
      currentStatus: inferAdlStatus(assessment.adlBathing),
      situationFact: assessment.adlBathing || '',
      barrierFactor: extractBarrierFactor(assessment.adlBathing),
      improvementPotential: inferImprovementPotential(assessment.adlBathing),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'adlDressing',
      category: 'ADL（日常生活動作）',
      item: '衣服着脱',
      currentStatus: inferAdlStatus(assessment.adlDressing),
      situationFact: assessment.adlDressing || '',
      barrierFactor: extractBarrierFactor(assessment.adlDressing),
      improvementPotential: inferImprovementPotential(assessment.adlDressing),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    // IADL
    {
      id: 'iadlCooking',
      category: 'IADL（手段的日常生活動作）',
      item: '調理・洗濯・掃除',
      currentStatus: inferAdlStatus(assessment.iadlCooking),
      situationFact: assessment.iadlCooking || '',
      barrierFactor: extractBarrierFactor(assessment.iadlCooking),
      improvementPotential: inferImprovementPotential(assessment.iadlCooking),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'iadlShopping',
      category: 'IADL（手段的日常生活動作）',
      item: '買い物',
      currentStatus: inferAdlStatus(assessment.iadlShopping),
      situationFact: assessment.iadlShopping || '',
      barrierFactor: extractBarrierFactor(assessment.iadlShopping),
      improvementPotential: inferImprovementPotential(assessment.iadlShopping),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'iadlMoney',
      category: 'IADL（手段的日常生活動作）',
      item: '金銭管理',
      currentStatus: inferAdlStatus(assessment.iadlMoney),
      situationFact: assessment.iadlMoney || '',
      barrierFactor: extractBarrierFactor(assessment.iadlMoney),
      improvementPotential: inferImprovementPotential(assessment.iadlMoney),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'medication',
      category: 'IADL（手段的日常生活動作）',
      item: '服薬管理',
      currentStatus: inferAdlStatus(assessment.medication),
      situationFact: assessment.medication || '',
      barrierFactor: extractBarrierFactor(assessment.medication),
      improvementPotential: inferImprovementPotential(assessment.medication),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    // 認知・精神
    {
      id: 'cognition',
      category: '認知・精神',
      item: '認知能力・意思決定',
      currentStatus: inferHealthStatus(assessment.cognition),
      situationFact: assessment.cognition || '',
      barrierFactor: extractBarrierFactor(assessment.cognition),
      improvementPotential: inferImprovementPotential(assessment.cognition),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'communication',
      category: '認知・精神',
      item: 'コミュニケーション',
      currentStatus: inferHealthStatus(assessment.communication),
      situationFact: assessment.communication || '',
      barrierFactor: extractBarrierFactor(assessment.communication),
      improvementPotential: inferImprovementPotential(assessment.communication),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    // 社会・環境
    {
      id: 'socialParticipation',
      category: '社会・環境',
      item: '社会参加・対人関係',
      currentStatus: inferHealthStatus(assessment.socialParticipation),
      situationFact: assessment.socialParticipation || '',
      barrierFactor: extractBarrierFactor(assessment.socialParticipation),
      improvementPotential: inferImprovementPotential(assessment.socialParticipation),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'residence',
      category: '社会・環境',
      item: '居住環境',
      currentStatus: inferHealthStatus(assessment.residence),
      situationFact: assessment.residence || '',
      barrierFactor: extractBarrierFactor(assessment.residence),
      improvementPotential: inferImprovementPotential(assessment.residence),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'familySituation',
      category: '社会・環境',
      item: '家族状況・介護力',
      currentStatus: inferHealthStatus(assessment.familySituation),
      situationFact: assessment.familySituation || '',
      barrierFactor: extractBarrierFactor(assessment.familySituation),
      improvementPotential: inferImprovementPotential(assessment.familySituation),
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    // 特別な状況・その他
    {
      id: 'maltreatmentRisk',
      category: '特別な状況',
      item: '虐待・権利擁護',
      currentStatus: assessment.maltreatmentRisk ? '支障あり' : '',
      situationFact: assessment.maltreatmentRisk || '',
      barrierFactor: extractBarrierFactor(assessment.maltreatmentRisk),
      improvementPotential: '',
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
    {
      id: 'environment',
      category: '特別な状況',
      item: '特記事項・総合的な課題',
      currentStatus: '',
      situationFact: assessment.environment || '',
      barrierFactor: '',
      improvementPotential: '',
      userFamilyIntent: '',
      needs: '',
      remarks: '',
    },
  ];

  return rows;
}

/** クライアント基本情報 */
export interface IssueSummaryClientInfo {
  name: string;
  kana: string;
  careLevel: string;
}

/** ケアマネ情報 */
export interface IssueSummaryManagerInfo {
  name: string;
  office: string;
}

/** アセスメントデータから課題整理総括表を生成 */
export function generateIssueSummarySheet(
  assessment: AssessmentData,
  clientInfo: IssueSummaryClientInfo,
  managerInfo: IssueSummaryManagerInfo
): IssueSummarySheet {
  return {
    createdDate: new Date().toISOString().split('T')[0],
    userName: clientInfo.name,
    userKana: clientInfo.kana,
    careLevel: clientInfo.careLevel,
    careManagerName: managerInfo.name,
    careManagerOffice: managerInfo.office,
    rows: buildRows(assessment),
  };
}
