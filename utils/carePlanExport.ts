/**
 * ケアプランCSVエクスポートユーティリティ
 *
 * 第2表（居宅サービス計画書）・第3表（週間サービス計画表）を
 * CSV形式でエクスポートし、他の介護ソフトへの転記を支援します。
 *
 * フォーマット: UTF-8 BOM付き、CRLF改行（Excel互換）
 */
import type { CarePlan } from '../types';

// 曜日の日本語ラベル
const DAY_LABELS: Record<string, string> = {
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
  sun: '日',
};

const GOAL_STATUS_LABELS: Record<string, string> = {
  not_started: '未開始',
  in_progress: '実施中',
  achieved: '達成',
  discontinued: '中止',
};

/** 1セルのCSVエスケープ処理 */
function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** 行配列からCSV文字列を生成（CRLF改行） */
function buildCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/**
 * 第2表（居宅サービス計画書）をCSV形式に変換します。
 *
 * フォーマット: 1サービスを1行として展開し、ニーズ・目標を各行に付与。
 * 複数の短期目標がある場合は「・」で結合して1列に収めます。
 * V1データ（needsなし）の場合は shortTermGoals を行として出力します。
 *
 * @param plan ケアプランデータ
 * @param clientName 利用者氏名（1列目に出力）
 */
export function exportTable2AsCsv(plan: CarePlan, clientName: string): string {
  const rows: string[][] = [];

  rows.push([
    '利用者名',
    'ニーズ（生活全般の課題）',
    '長期目標',
    '長期目標開始日',
    '長期目標終了日',
    '短期目標',
    'サービス種別',
    'サービス内容',
    '頻度',
  ]);

  const needs = plan.needs ?? [];

  if (needs.length === 0) {
    // V1フォールバック: ニーズ構造なし → longTermGoal + shortTermGoals を使用
    for (const goal of plan.shortTermGoals) {
      rows.push([
        clientName,
        '',
        plan.longTermGoal,
        plan.longTermGoalStartDate ?? '',
        plan.longTermGoalEndDate ?? '',
        `${goal.content}（${GOAL_STATUS_LABELS[goal.status] ?? goal.status}）`,
        '',
        '',
        '',
      ]);
    }
    if (plan.shortTermGoals.length === 0) {
      rows.push([clientName, '', plan.longTermGoal, '', '', '', '', '', '']);
    }
    return buildCsv(rows);
  }

  for (const need of needs) {
    const shortTermGoalSummary = need.shortTermGoals
      .map((g) => `${g.content}（${GOAL_STATUS_LABELS[g.status] ?? g.status}）`)
      .join('・');

    if (need.services.length === 0) {
      // サービスなし → ニーズ行のみ出力
      rows.push([
        clientName,
        need.content,
        need.longTermGoal,
        need.longTermGoalStartDate ?? '',
        need.longTermGoalEndDate ?? '',
        shortTermGoalSummary,
        '',
        '',
        '',
      ]);
      continue;
    }

    for (const service of need.services) {
      rows.push([
        clientName,
        need.content,
        need.longTermGoal,
        need.longTermGoalStartDate ?? '',
        need.longTermGoalEndDate ?? '',
        shortTermGoalSummary,
        service.type,
        service.content,
        service.frequency,
      ]);
    }
  }

  return buildCsv(rows);
}

/**
 * 第3表（週間サービス計画表）をCSV形式に変換します。
 *
 * フォーマット: 1エントリを1行として展開。曜日は○/空白で表示。
 *
 * @param plan ケアプランデータ
 * @param clientName 利用者氏名（1列目に出力）
 */
export function exportTable3AsCsv(plan: CarePlan, clientName: string): string {
  const rows: string[][] = [];

  rows.push([
    '利用者名',
    'サービス種別',
    '事業所名',
    'サービス内容',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
    '日',
    '開始時間',
    '終了時間',
    '頻度',
    '備考',
  ]);

  const schedule = plan.weeklySchedule;
  if (!schedule || schedule.entries.length === 0) {
    return buildCsv(rows);
  }

  for (const entry of schedule.entries) {
    const days = (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((d) =>
      entry.days.includes(d) ? '○' : ''
    );

    rows.push([
      clientName,
      entry.serviceType,
      entry.provider,
      entry.content,
      ...days,
      entry.startTime,
      entry.endTime,
      entry.frequency,
      entry.notes,
    ]);
  }

  return buildCsv(rows);
}

/**
 * CSVコンテンツをファイルとしてダウンロードします（UTF-8 BOM付き）。
 *
 * @param content CSV文字列
 * @param filename ダウンロードファイル名
 */
export function downloadCsv(content: string, filename: string): void {
  const bom = '\uFEFF'; // UTF-8 BOM（Excel互換）
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 利用者名・日付からCSVファイル名を生成します。
 * 例: "山田太郎_第2表_20260223.csv"
 *
 * @param clientName 利用者氏名
 * @param tableNumber 表番号（"第2表" など）
 */
export function buildCsvFilename(clientName: string, tableNumber: string): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = clientName.replace(/[/\\:*?"<>|]/g, '_');
  return `${safeName}_${tableNumber}_${today}.csv`;
}

/** 曜日ラベルの公開（テスト用） */
export { DAY_LABELS, GOAL_STATUS_LABELS };
