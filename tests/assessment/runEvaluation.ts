#!/usr/bin/env npx ts-node
/**
 * アセスメント抽出精度評価スクリプト
 *
 * 使用方法:
 *   npx ts-node tests/assessment/runEvaluation.ts
 *   npx ts-node tests/assessment/runEvaluation.ts --case TC001
 *   npx ts-node tests/assessment/runEvaluation.ts --tag 認知症
 *
 * 注意:
 * - Cloud Functions の analyzeAssessment エンドポイントが必要
 * - Firebase Authentication が必要（ID トークン）
 */

import { allTestCases, getTestCaseById, getTestCasesByTag, AssessmentTestCase } from './testCases';
import {
  evaluateTestCase,
  summarizeEvaluations,
  formatEvaluationResult,
  formatSummary,
  TestCaseEvaluationResult,
} from './evaluator';
import type { AssessmentData } from '../../types';

// ============================================================
// 設定
// ============================================================

const FUNCTIONS_URL = process.env.FUNCTIONS_URL || 'https://asia-northeast1-caremanager-ai-copilot.cloudfunctions.net';

// ============================================================
// モック抽出（AI呼び出しの代わり）
// ============================================================

/**
 * テスト用のモック抽出関数
 * 実際のAI呼び出しの代わりに、入力テキストから簡易的にキーワードを抽出
 */
function mockExtractAssessment(inputText: string): Partial<AssessmentData> {
  return {
    healthStatus: extractSection(inputText, ['健康状態', '診断', '病気', '疾患']),
    pastHistory: extractSection(inputText, ['既往', '既往歴', '高血圧', '糖尿病']),
    medication: extractSection(inputText, ['服用', '薬', 'アリセプト', 'インスリン']),
    skinCondition: extractSection(inputText, ['皮膚', '褥瘡', '発赤']),
    oralHygiene: extractSection(inputText, ['口腔', '入れ歯', '歯', '舌']),
    fluidIntake: extractSection(inputText, ['水分', '飲水', 'とろみ', '胃ろう']),
    adlTransfer: extractSection(inputText, ['移動', '歩行', '杖', '車椅子', '寝返り']),
    adlEating: extractSection(inputText, ['食事', '食べ', '箸', 'お粥']),
    adlToileting: extractSection(inputText, ['トイレ', '排泄', '失禁']),
    adlBathing: extractSection(inputText, ['入浴', 'お風呂', 'シャワー']),
    adlDressing: extractSection(inputText, ['着替え', '更衣', '服']),
    iadlCooking: extractSection(inputText, ['料理', '調理', '火']),
    iadlShopping: extractSection(inputText, ['買い物', '買物']),
    iadlMoney: extractSection(inputText, ['お金', '計算', '金銭']),
    cognition: extractSection(inputText, ['認知', '見当識', '物忘れ', '記憶']),
    communication: extractSection(inputText, ['会話', 'コミュニケーション', '意思疎通', '文字盤']),
    socialParticipation: extractSection(inputText, ['外出', '社会参加', '閉じこもり', '近所']),
    residence: extractSection(inputText, ['住まい', '住環境', '階建て', 'マンション', '持ち家']),
    familySituation: extractSection(inputText, ['家族', '同居', '奥様', '長男', '介護者']),
    maltreatmentRisk: extractSection(inputText, ['虐待', '年金', '怒鳴り']),
    environment: extractSection(inputText, ['環境', '片付', '手すり']),
    serviceHistory: extractSection(inputText, ['サービス', 'ヘルパー', '訪問看護', '訪問診療']),
  };
}

/**
 * テキストから関連するセクションを抽出
 */
function extractSection(text: string, keywords: string[]): string {
  const lines = text.split('\n');
  const relevantLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (keywords.some(kw => trimmed.includes(kw))) {
      relevantLines.push(trimmed);
    }
  }

  return relevantLines.join('\n');
}

// ============================================================
// 評価実行
// ============================================================

async function runEvaluation(testCases: AssessmentTestCase[]): Promise<TestCaseEvaluationResult[]> {
  const results: TestCaseEvaluationResult[] = [];

  console.log(`\n🔍 ${testCases.length}件のテストケースを評価します...\n`);

  for (const testCase of testCases) {
    console.log(`📋 ${testCase.id}: ${testCase.name}`);

    // モック抽出（将来的にはCloud Functions呼び出しに置き換え）
    const extracted = mockExtractAssessment(testCase.inputText);

    const result = evaluateTestCase(testCase, extracted);
    results.push(result);

    // 結果を即時表示
    const icon = result.passed ? '✅' : '❌';
    console.log(`   ${icon} 精度: ${result.accuracy}% (${result.passedChecks}/${result.totalChecks})`);

    if (!result.passed) {
      const failedFields = result.fieldResults
        .filter(f => !f.passed)
        .map(f => f.field)
        .join(', ');
      console.log(`   ⚠️  失敗フィールド: ${failedFields}`);
    }
  }

  return results;
}

// ============================================================
// メイン
// ============================================================

async function main() {
  const args = process.argv.slice(2);

  let testCases: AssessmentTestCase[] = allTestCases;

  // 引数パース
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--case' && args[i + 1]) {
      const tc = getTestCaseById(args[i + 1]);
      if (tc) {
        testCases = [tc];
      } else {
        console.error(`❌ テストケース ${args[i + 1]} が見つかりません`);
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--tag' && args[i + 1]) {
      testCases = getTestCasesByTag(args[i + 1]);
      if (testCases.length === 0) {
        console.error(`❌ タグ "${args[i + 1]}" に一致するテストケースがありません`);
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--help') {
      console.log(`
アセスメント抽出精度評価スクリプト

使用方法:
  npx ts-node tests/assessment/runEvaluation.ts [オプション]

オプション:
  --case <ID>    特定のテストケースのみ実行（例: TC001）
  --tag <タグ>   特定のタグを持つテストケースのみ実行（例: 認知症）
  --help         このヘルプを表示

利用可能なテストケース:
${allTestCases.map(tc => `  ${tc.id}: ${tc.name} [${tc.tags.join(', ')}]`).join('\n')}
      `);
      process.exit(0);
    }
  }

  console.log('========================================');
  console.log('  アセスメント抽出精度評価');
  console.log('========================================');
  console.log(`評価モード: モック抽出（簡易キーワードマッチング）`);

  const results = await runEvaluation(testCases);

  // 詳細レポート
  console.log('\n----------------------------------------');
  console.log('詳細レポート');
  console.log('----------------------------------------');

  for (const result of results) {
    console.log(formatEvaluationResult(result));
  }

  // サマリー
  if (results.length > 1) {
    const summary = summarizeEvaluations(results);
    console.log(formatSummary(summary));
  }

  // 終了コード
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('エラー:', err);
  process.exit(1);
});
