/**
 * ケアプラン生成プロンプト
 * アセスメント情報から第2表（ニーズ・目標・サービス）を生成
 */

import {
  careplanExampleDatabase,
  CarePlanExample,
} from './templates/careplanExamples';

interface AssessmentData {
  serviceHistory?: string;
  healthStatus?: string;
  pastHistory?: string;
  skinCondition?: string;
  oralHygiene?: string;
  fluidIntake?: string;
  adlTransfer?: string;
  adlEating?: string;
  adlToileting?: string;
  adlBathing?: string;
  adlDressing?: string;
  iadlCooking?: string;
  iadlShopping?: string;
  iadlMoney?: string;
  medication?: string;
  cognition?: string;
  communication?: string;
  socialParticipation?: string;
  residence?: string;
  familySituation?: string;
  maltreatmentRisk?: string;
  environment?: string;
}

/**
 * アセスメント情報から関連する疾患カテゴリを推定
 */
function detectDiseaseCategories(assessment: AssessmentData): string[] {
  const categories: string[] = [];
  const text = Object.values(assessment).join(' ').toLowerCase();

  // 認知症関連キーワード
  if (
    text.includes('認知') ||
    text.includes('物忘れ') ||
    text.includes('徘徊') ||
    text.includes('アルツハイマー') ||
    text.includes('見当識')
  ) {
    categories.push('dementia');
  }

  // 脳血管疾患関連キーワード
  if (
    text.includes('脳梗塞') ||
    text.includes('脳出血') ||
    text.includes('片麻痺') ||
    text.includes('半身') ||
    text.includes('嚥下') ||
    text.includes('高次脳')
  ) {
    categories.push('stroke');
  }

  // 骨折・整形外科関連キーワード
  if (
    text.includes('骨折') ||
    text.includes('変形性') ||
    text.includes('関節') ||
    text.includes('腰痛') ||
    text.includes('骨粗鬆')
  ) {
    categories.push('orthopedic');
  }

  // 心疾患関連キーワード
  if (
    text.includes('心不全') ||
    text.includes('心臓') ||
    text.includes('狭心') ||
    text.includes('心筋梗塞') ||
    text.includes('息切れ') ||
    text.includes('むくみ')
  ) {
    categories.push('cardiac');
  }

  // 廃用・フレイル関連キーワード
  if (
    text.includes('廃用') ||
    text.includes('フレイル') ||
    text.includes('筋力低下') ||
    text.includes('体力低下') ||
    text.includes('閉じこもり') ||
    text.includes('活動量')
  ) {
    categories.push('disuse');
  }

  // デフォルトでADL汎用文例も含める
  categories.push('adl_general');

  return [...new Set(categories)];
}

/**
 * 関連する文例を取得（最大10件）
 */
function getRelevantExamples(assessment: AssessmentData): CarePlanExample[] {
  const categoryIds = detectDiseaseCategories(assessment);
  const examples: CarePlanExample[] = [];

  for (const categoryId of categoryIds) {
    const category = careplanExampleDatabase.find((c) => c.id === categoryId);
    if (category) {
      // 各カテゴリから最大3件
      examples.push(...category.examples.slice(0, 3));
    }
  }

  return examples.slice(0, 10);
}

/**
 * 文例をプロンプト用にフォーマット
 */
function formatExamplesForPrompt(examples: CarePlanExample[]): string {
  if (examples.length === 0) return '';

  let formatted = '【参考文例】\n';
  examples.forEach((ex, index) => {
    formatted += `
--- 文例${index + 1} ---
ニーズ: ${ex.needs}
長期目標: ${ex.longTermGoal}
短期目標:
${ex.shortTermGoals.map((g, i) => `  ${i + 1}. ${g}`).join('\n')}
サービス:
${ex.services.map((s) => `  - ${s.content}（${s.type}、${s.frequency}）`).join('\n')}
`;
  });

  return formatted;
}

/**
 * ケアプラン第2表生成用プロンプトを構築
 */
export function buildCarePlanPrompt(
  assessment: AssessmentData,
  instruction: string
): string {
  const relevantExamples = getRelevantExamples(assessment);
  const examplesSection = formatExamplesForPrompt(relevantExamples);

  return `あなたは2025年時点の日本の介護保険制度に精通した熟練ケアマネジャーです。
「適切なケアマネジメント手法」に基づき、居宅サービス計画書（第2表）を作成してください。

【アセスメント情報 (23項目)】
${JSON.stringify(assessment, null, 2)}

【ケアマネジャーの意図・方針】
${instruction || '自立支援・重度化防止を重視'}

${examplesSection}

【作成ルール - 必ず遵守】

1. **ゴールデンスレッドの厳守**
   - アセスメントで特定された課題に直接対応する目標を設定する
   - ニーズ→長期目標→短期目標の論理的つながりを明確にする

2. **自立支援・重度化防止の視点**
   - 「本人が〜できるようになる」「〜の状態を維持する」など前向きな表現
   - 「〜してもらう」ではなく「〜できる」という主体的な表現

3. **目標の具体性 (SMART原則)**
   - 短期目標は評価可能な具体的行動目標にする
   - 「週◯回〜する」「〜を使って〜ができる」など数値・条件を含める
   - 3ヶ月後に達成度を評価できる内容にする

4. **長期目標と短期目標の整合性**
   - 長期目標（6ヶ月〜1年）は包括的な生活の姿
   - 短期目標（3ヶ月程度）は長期目標達成のためのステップ
   - 短期目標を積み重ねると長期目標に到達できる関係性

5. **日本語品質**
   - ケアプランとしてそのまま使用できる専門的な日本語
   - 利用者・家族にも分かりやすい平易な表現
   - 敬語は不要、簡潔な文体

6. **複数のニーズへの対応**
   - アセスメント情報から2〜4つの主要なニーズを特定
   - 各ニーズに対して長期目標・短期目標を設定
   - 優先度の高いニーズから記載

【出力形式】
JSON形式で、以下の構造で出力してください：
{
  "needs": [
    {
      "content": "ニーズ（生活全般の解決すべき課題）",
      "longTermGoal": "長期目標",
      "shortTermGoals": ["短期目標1", "短期目標2"],
      "services": [
        {
          "content": "サービス内容",
          "type": "サービス種別",
          "frequency": "頻度"
        }
      ]
    }
  ],
  "totalDirectionPolicy": "総合的な援助の方針（第1表用、3-4文で簡潔に）"
}`;
}

/**
 * プロンプトの文字数を取得（トークン数の目安）
 */
export function getPromptLength(assessment: AssessmentData, instruction: string): number {
  return buildCarePlanPrompt(assessment, instruction).length;
}
