import { describe, it, expect } from 'vitest';
import { buildReviewPrompt } from '../../functions/src/prompts/reviewPrompt';

const mockAssessment = {
  serviceHistory: 'デイサービス週3回利用中',
  healthStatus: '高血圧・糖尿病あり',
  pastHistory: '脳梗塞（2020年）',
  adlTransfer: '一部介助で可能',
  adlEating: '自立',
  adlBathing: '全介助',
  cognition: '認知症の診断あり',
  familySituation: '娘が同居、介護力あり',
};

const mockNeeds = [
  {
    content: '入浴時に全介助が必要だが、自宅での入浴を続けたい',
    longTermGoal: '安全に入浴できる環境を整え、清潔を保ちながら自宅生活を継続できる',
    shortTermGoals: [
      { content: '週2回の訪問介護による入浴介助を受ける' },
    ],
    services: [
      { content: '入浴介助・身体整容', type: '訪問介護', frequency: '週2回' },
    ],
  },
];

// ========================================
// buildReviewPrompt テスト
// ========================================

describe('buildReviewPrompt', () => {
  it('プロンプト文字列が生成される', () => {
    const prompt = buildReviewPrompt({ assessment: mockAssessment, needs: mockNeeds });
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('アセスメント情報がプロンプトに含まれる', () => {
    const prompt = buildReviewPrompt({ assessment: mockAssessment, needs: mockNeeds });
    expect(prompt).toContain('高血圧・糖尿病あり');
    expect(prompt).toContain('認知症の診断あり');
  });

  it('ニーズ情報がプロンプトに含まれる', () => {
    const prompt = buildReviewPrompt({ assessment: mockAssessment, needs: mockNeeds });
    expect(prompt).toContain('入浴時に全介助が必要');
    expect(prompt).toContain('週2回の訪問介護による入浴介助');
  });

  it('totalDirectionPolicyが指定された場合にプロンプトに含まれる', () => {
    const prompt = buildReviewPrompt({
      assessment: mockAssessment,
      needs: mockNeeds,
      totalDirectionPolicy: '在宅生活継続を最優先とし、家族への負担軽減を図る',
    });
    expect(prompt).toContain('在宅生活継続を最優先');
  });

  it('totalDirectionPolicyが未指定の場合は（未記入）と表示', () => {
    const prompt = buildReviewPrompt({ assessment: mockAssessment, needs: mockNeeds });
    expect(prompt).toContain('（未記入）');
  });

  it('6つの点検観点がプロンプトに含まれる', () => {
    const prompt = buildReviewPrompt({ assessment: mockAssessment, needs: mockNeeds });
    expect(prompt).toContain('ゴールデンスレッド');
    expect(prompt).toContain('記載表現');
    expect(prompt).toContain('SMART');
    expect(prompt).toContain('長期目標と短期目標の整合性');
    expect(prompt).toContain('サービス内容の妥当性');
    expect(prompt).toContain('必須項目の充足');
  });

  it('JSONスキーマ出力形式がプロンプトに含まれる', () => {
    const prompt = buildReviewPrompt({ assessment: mockAssessment, needs: mockNeeds });
    expect(prompt).toContain('overallScore');
    expect(prompt).toContain('overallComment');
    expect(prompt).toContain('items');
    expect(prompt).toContain('severity');
  });

  it('severity の選択肢が明記されている', () => {
    const prompt = buildReviewPrompt({ assessment: mockAssessment, needs: mockNeeds });
    expect(prompt).toContain('ok|info|warning|error');
  });

  it('複数ニーズを正しくシリアライズする', () => {
    const multiNeeds = [
      ...mockNeeds,
      {
        content: '食事は自立しているが、栄養管理が難しい',
        longTermGoal: 'バランスの良い食事を継続できる',
        shortTermGoals: [{ content: '管理栄養士による栄養相談を月1回受ける' }],
        services: [{ content: '栄養相談', type: '居宅療養管理指導', frequency: '月1回' }],
      },
    ];
    const prompt = buildReviewPrompt({ assessment: mockAssessment, needs: multiNeeds });
    expect(prompt).toContain('ニーズ1');
    expect(prompt).toContain('ニーズ2');
    expect(prompt).toContain('食事は自立しているが、栄養管理が難しい');
  });

  it('空のニーズ配列でもエラーにならない', () => {
    const prompt = buildReviewPrompt({ assessment: mockAssessment, needs: [] });
    expect(typeof prompt).toBe('string');
  });
});
