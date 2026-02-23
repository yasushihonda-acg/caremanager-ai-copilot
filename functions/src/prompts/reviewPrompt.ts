/**
 * ケアプラン点検プロンプト
 * アセスメントと第2表（ニーズ・目標・サービス）の品質をチェック
 */

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

interface CarePlanNeed {
  content: string;
  longTermGoal: string;
  shortTermGoals: { content: string }[];
  services: { content: string; type: string; frequency: string }[];
}

interface ReviewInput {
  assessment: AssessmentData;
  needs: CarePlanNeed[];
  totalDirectionPolicy?: string;
}

/**
 * ケアプラン点検プロンプトを構築する
 */
export function buildReviewPrompt(input: ReviewInput): string {
  const { assessment, needs, totalDirectionPolicy } = input;

  const needsJson = JSON.stringify(
    needs.map((n, i) => ({
      id: `ニーズ${i + 1}`,
      content: n.content,
      longTermGoal: n.longTermGoal,
      shortTermGoals: n.shortTermGoals.map((g) => g.content),
      services: n.services.map((s) => `[${s.type}] ${s.content}（${s.frequency}）`),
    })),
    null,
    2
  );

  return `あなたは2025年時点の日本の介護保険制度に精通した、第三者評価・実地指導にも精通した熟練ケアマネジャーです。
以下のアセスメント情報とケアプラン（第2表）を照合し、品質を点検してください。

【アセスメント情報（23項目）】
${JSON.stringify(assessment, null, 2)}

【総合的な援助の方針（第1表）】
${totalDirectionPolicy || '（未記入）'}

【ケアプラン第2表（ニーズ・目標・サービス）】
${needsJson}

---

【点検の観点（6項目）】

1. **ゴールデンスレッド（一貫性）**
   - アセスメントで確認された課題・ニーズがケアプランに反映されているか
   - ニーズ → 長期目標 → 短期目標 → サービス内容 の論理的つながり

2. **記載表現の適切性**
   - ニーズ（生活全般の解決すべき課題）: 利用者主語・願望形「〜したい」「〜でいたい」
   - 長期目標: 利用者主語・達成形「〜できる」「〜を維持できる」
   - 短期目標: 具体的行動目標「週◯回〜する」（数値・条件付き）

3. **目標の具体性（SMART原則）**
   - Specific（具体的か）
   - Measurable（測定可能か：週◯回、◯m歩行など）
   - Achievable（達成可能か）
   - Relevant（ニーズと関連しているか）
   - Time-bound（期間・タイムラインが示されているか）

4. **長期目標と短期目標の整合性**
   - 短期目標が長期目標達成への段階的ステップになっているか
   - 短期目標の積み重ねで長期目標に到達できる構造か

5. **サービス内容の妥当性**
   - 設定されたサービスがニーズ・目標に対応しているか
   - 頻度・内容が現実的か
   - 複数のサービスが重複・矛盾していないか

6. **必須項目の充足**
   - ニーズ、長期目標、短期目標が空欄でないか
   - 最低1つのサービスが設定されているか

---

【出力形式】

必ず以下のJSONスキーマに従って出力すること。

\`\`\`json
{
  "overallScore": <整数 0-100>,
  "overallComment": "<総合評価コメント（1-3文）>",
  "items": [
    {
      "category": "<点検カテゴリ名>",
      "target": "<対象（例: ニーズ1, 短期目標2, 全体）>",
      "severity": "<ok|info|warning|error>",
      "message": "<指摘内容>",
      "suggestion": "<改善提案（任意）>"
    }
  ]
}
\`\`\`

severityの基準:
- ok: 問題なし・良好
- info: 参考情報・軽微な確認点
- warning: 要確認・改善を推奨
- error: 法令上の問題・修正が必要

overallScoreの目安:
- 90-100: 優秀・すぐに使用可能
- 75-89: 良好・軽微な修正推奨
- 60-74: 要改善・主要な問題点あり
- 60未満: 大幅な修正が必要

必ずすべての点検観点（6項目）に対して少なくとも1件のitemsエントリを含めること。
問題がない場合も severity: "ok" で記録すること。
itemsは重要度の高いもの（error > warning > info > ok）から並べること。`;
}
