import { CarePlan, CarePlanNeed, ValidationResult, AssessmentData } from '../types';

/**
 * Validates the "Golden Thread" of dates for a Care Plan.
 * Rule: Assessment <= Draft <= Meeting <= Consent
 */
export const validateCarePlanDates = (plan: Partial<CarePlan>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Helper to parse YYYY-MM-DD
  const parse = (d?: string) => (d ? new Date(d).getTime() : 0);

  const assess = parse(plan.assessmentDate);
  const draft = parse(plan.draftDate);
  const meeting = parse(plan.meetingDate);
  const consent = parse(plan.consentDate);

  // 1. Assessment vs Draft
  if (assess && draft) {
    if (assess > draft) {
      errors.push('【法的不整合】原案作成日はアセスメント日と同日か、それ以降である必要があります。');
    }
  } else if (draft && !assess) {
    errors.push('原案作成にはアセスメントが必須です。');
  }

  // 2. Draft vs Meeting
  if (draft && meeting) {
    if (draft > meeting) {
      errors.push('【法的不整合】担当者会議は原案作成日以降に開催する必要があります。');
    }
  }

  // 3. Meeting vs Consent
  if (meeting && consent) {
    if (meeting > consent) {
      errors.push('【法的不整合】利用者同意は担当者会議以降に得る必要があります。');
    }
  }

  // Warnings (Best Practice)
  if (assess && draft) {
    const diffTime = Math.abs(draft - assess);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      warnings.push('【注意】アセスメントから30日以上経過しています。状況変化がないか確認してください。');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates "ニーズ→目標" consistency (Golden Thread: Needs → Goals → Services).
 */
export const validateNeedsGoalConsistency = (plan: Partial<CarePlan>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const needs: CarePlanNeed[] | undefined = plan.needs;

  // V1プラン（needs未設定）はwarningのみ
  if (!needs || needs.length === 0) {
    warnings.push('【推奨】AIケアプラン作成（V2）でニーズ別構造を自動生成することができます。');
    return { isValid: true, errors, warnings };
  }

  needs.forEach((need, index) => {
    const label = `ニーズ${index + 1}`;

    if (!need.content || need.content.trim() === '') {
      errors.push(`【${label}】ニーズの内容が空です。`);
    }

    if (!need.longTermGoal || need.longTermGoal.trim() === '') {
      errors.push(`【${label}】長期目標が未設定です。`);
    }

    if (!need.shortTermGoals || need.shortTermGoals.length === 0) {
      errors.push(`【${label}】短期目標が1つも設定されていません。`);
    }

    if (!need.services || need.services.length === 0) {
      warnings.push(`【${label}】サービス内容が設定されていません。`);
    }
  });

  // トップレベル目標とneeds[0]の長期目標の不一致確認
  if (
    needs.length > 0 &&
    plan.longTermGoal &&
    needs[0].longTermGoal &&
    plan.longTermGoal !== needs[0].longTermGoal
  ) {
    warnings.push('【注意】第1表の長期目標と第2表ニーズ1の長期目標が一致していません。');
  }

  // 孤立した短期目標の確認（needsに紐付かない目標）
  if (plan.shortTermGoals && plan.shortTermGoals.length > 0) {
    const allNeedGoalIds = new Set(
      needs.flatMap(n => n.shortTermGoals.map(g => g.id))
    );
    const orphaned = plan.shortTermGoals.filter(g => !allNeedGoalIds.has(g.id));
    if (orphaned.length > 0) {
      warnings.push(
        `【注意】いずれのニーズにも紐付いていない短期目標が${orphaned.length}件あります（${orphaned.map(g => g.content).join('、')}）。`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validates both date order (Golden Thread of dates) and needs-goal consistency.
 * Use this as the primary validation function instead of validateCarePlanDates alone.
 */
export const validateCarePlanFull = (plan: Partial<CarePlan>): ValidationResult => {
  const dateResult = validateCarePlanDates(plan);
  const needsResult = validateNeedsGoalConsistency(plan);

  return {
    isValid: dateResult.isValid && needsResult.isValid,
    errors: [...dateResult.errors, ...needsResult.errors],
    warnings: [...dateResult.warnings, ...needsResult.warnings],
  };
};

/**
 * Checks BCP readiness based on current date.
 */
export const checkBCPStatus = (): 'Green' | 'Yellow' | 'Red' => {
  // Mock logic: In a real app, this would check the last training date from DB.
  // Assuming strict requirement of training every 6 months.
  return 'Yellow'; // Example status
};

/**
 * Logic Engine for "Appropriate Care Management Method" (適切なケアマネジメント手法)
 * Analyzes assessment data and returns suggestions for care planning and further assessment.
 */
export const getCareManagementSuggestions = (data: AssessmentData): string[] => {
  const suggestions: string[] = [];

  // Rule 1: Cerebrovascular Disease (脳血管疾患)
  // Checks for keywords in past history
  if (data.pastHistory.includes('脳血管') || data.pastHistory.includes('脳卒中') || data.pastHistory.includes('麻痺')) {
    suggestions.push('【脳血管疾患】麻痺の部位・程度、嚥下機能、および再発予防（血圧管理等）の状況を確認してください。');
  }

  // Rule 2: Dementia (認知症)
  // Checks cognition status or history
  if (data.cognition.includes('認知症') || data.pastHistory.includes('認知症')) {
    suggestions.push('【認知症】BPSD（徘徊・火の不始末・暴言等）の有無、服薬管理状況、およびご家族の介護負担・レスパイトの必要性を確認してください。');
  }

  // Rule 3: Heavy Care Needs in ADL (Toileting/Bathing)
  const heavyCareKeywords = ['全介助', 'オムツ', '清拭'];
  if (heavyCareKeywords.some(k => data.adlToileting.includes(k) || data.adlBathing.includes(k))) {
    suggestions.push('【重度身体介護】皮膚トラブル（褥瘡・発赤）の有無、および主介護者の身体的負担（腰痛等）を確認してください。');
  }

  // Rule 4: Social Isolation Risk
  if (data.familySituation.includes('独居') && (data.socialParticipation.includes('閉じこもり') || data.socialParticipation.includes('拒否'))) {
    suggestions.push('【社会的孤立】緊急時の連絡体制、栄養状態（食生活）、および見守りサービスの導入検討を確認してください。');
  }

  // Rule 5: Fall Risk
  if (data.pastHistory.includes('骨折') || data.adlTransfer.includes('転倒')) {
    suggestions.push('【転倒リスク】家屋環境（段差・手すり）、履物、およびリハビリテーションによる身体機能維持の必要性を検討してください。');
  }

  return suggestions;
};
