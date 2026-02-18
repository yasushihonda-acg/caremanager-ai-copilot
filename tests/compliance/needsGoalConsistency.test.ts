import { describe, it, expect } from 'vitest';
import { validateNeedsGoalConsistency, validateCarePlanFull } from '../../services/complianceService';
import type { CarePlan, CarePlanNeed } from '../../types';

const makeNeed = (overrides: Partial<CarePlanNeed> = {}): CarePlanNeed => ({
  id: 'n1',
  content: '安全に自宅で生活したい',
  longTermGoal: '転倒なく自宅で過ごせる',
  shortTermGoals: [
    { id: 'g1', content: '週2回リハビリに参加する', status: 'in_progress' },
  ],
  services: [
    { id: 's1', content: '訪問リハビリ', type: 'リハビリ', frequency: '週2回' },
  ],
  ...overrides,
});

const makeV2Plan = (needsOverride?: CarePlanNeed[]): Partial<CarePlan> => ({
  id: 'p1',
  userId: 'u1',
  status: 'draft',
  assessmentDate: '2025-01-01',
  draftDate: '2025-01-10',
  meetingDate: '',
  consentDate: '',
  deliveryDate: '',
  longTermGoal: '転倒なく自宅で過ごせる',
  shortTermGoals: [
    { id: 'g1', content: '週2回リハビリに参加する', status: 'in_progress' },
  ],
  needs: needsOverride ?? [makeNeed()],
});

describe('validateNeedsGoalConsistency', () => {
  it('V1プラン（needs未設定）→ valid + 推奨warning', () => {
    const result = validateNeedsGoalConsistency({ longTermGoal: '自宅で暮らしたい', shortTermGoals: [] });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('AI');
  });

  it('完全なV2プラン → valid（エラーなし）', () => {
    const result = validateNeedsGoalConsistency(makeV2Plan());
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('ニーズ内容が空 → error', () => {
    const result = validateNeedsGoalConsistency(makeV2Plan([makeNeed({ content: '' })]));
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('ニーズの内容が空'))).toBe(true);
  });

  it('長期目標が未設定 → error', () => {
    const result = validateNeedsGoalConsistency(makeV2Plan([makeNeed({ longTermGoal: '' })]));
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('長期目標が未設定'))).toBe(true);
  });

  it('短期目標がゼロ → error', () => {
    const result = validateNeedsGoalConsistency(makeV2Plan([makeNeed({ shortTermGoals: [] })]));
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('短期目標が1つも'))).toBe(true);
  });

  it('サービス未設定 → warning（errorではない）', () => {
    const result = validateNeedsGoalConsistency(makeV2Plan([makeNeed({ services: [] })]));
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some(w => w.includes('サービス内容が設定されていません'))).toBe(true);
  });

  it('トップレベル長期目標とneeds[0]の不一致 → warning', () => {
    const plan = makeV2Plan();
    const mismatch = { ...plan, longTermGoal: '別の目標' };
    const result = validateNeedsGoalConsistency(mismatch);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.includes('長期目標'))).toBe(true);
  });

  it('孤立した短期目標（needsに紐付かない）→ warning', () => {
    const plan = makeV2Plan();
    // needsのg1と同じIDを使っているので孤立ゼロ → orphaned goalを追加
    const planWithOrphan = {
      ...plan,
      shortTermGoals: [
        ...(plan.shortTermGoals ?? []),
        { id: 'orphan1', content: '孤立した目標', status: 'in_progress' as const },
      ],
    };
    const result = validateNeedsGoalConsistency(planWithOrphan);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.includes('紐付いていない短期目標'))).toBe(true);
  });
});

describe('validateCarePlanFull', () => {
  it('日付OK + V2完全プラン → valid', () => {
    const result = validateCarePlanFull(makeV2Plan());
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('日付エラー + V2完全プラン → invalid（日付エラーが含まれる）', () => {
    const plan = {
      ...makeV2Plan(),
      assessmentDate: '2025-02-01',
      draftDate: '2025-01-01', // 原案 < アセスメント → 不正
    };
    const result = validateCarePlanFull(plan);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('法的不整合'))).toBe(true);
  });

  it('V1プラン + 日付OK → valid + warnings', () => {
    const plan: Partial<CarePlan> = {
      assessmentDate: '2025-01-01',
      draftDate: '2025-01-10',
      longTermGoal: '自宅で暮らしたい',
      shortTermGoals: [],
    };
    const result = validateCarePlanFull(plan);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.includes('AI'))).toBe(true);
  });
});
