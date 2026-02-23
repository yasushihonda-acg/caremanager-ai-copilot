import React from 'react';
import type { IssueSummarySheet, IssueSummaryRow, CurrentStatus, ImprovementPotential } from '../../types';

interface IssueSummarySheetViewProps {
  sheet: IssueSummarySheet;
  onClose?: () => void;
}

const STATUS_LABELS: Record<CurrentStatus, string> = {
  '自立': '自立',
  '見守り': '見守り',
  '一部介助': '一部介助',
  '全介助': '全介助',
  '支障なし': '支障なし',
  '支障あり': '支障あり',
  '該当なし': '該当なし',
  '': '',
};

const STATUS_COLORS: Record<CurrentStatus, string> = {
  '自立': 'bg-green-100 text-green-800',
  '見守り': 'bg-yellow-100 text-yellow-800',
  '一部介助': 'bg-orange-100 text-orange-800',
  '全介助': 'bg-red-100 text-red-800',
  '支障なし': 'bg-green-100 text-green-800',
  '支障あり': 'bg-red-100 text-red-800',
  '該当なし': 'bg-gray-100 text-gray-600',
  '': '',
};

const IMPROVEMENT_LABELS: Record<ImprovementPotential, string> = {
  '改善': '改善',
  '維持': '維持',
  '悪化': '悪化',
  '': '',
};

const IMPROVEMENT_COLORS: Record<ImprovementPotential, string> = {
  '改善': 'text-blue-700 font-medium',
  '維持': 'text-stone-600',
  '悪化': 'text-red-700 font-medium',
  '': '',
};

function StatusBadge({ status }: { status: CurrentStatus }) {
  if (!status) return <span className="text-gray-300">—</span>;
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function ImprovementBadge({ potential }: { potential: ImprovementPotential }) {
  if (!potential) return <span className="text-gray-300">—</span>;
  return (
    <span className={`text-xs ${IMPROVEMENT_COLORS[potential]}`}>
      {IMPROVEMENT_LABELS[potential]}
    </span>
  );
}

/** カテゴリでグループ化した行を描画 */
const TableSection: React.FC<{ category: string; rows: IssueSummaryRow[] }> = ({ category, rows }) => {
  return (
    <>
      {rows.map((row, idx) => (
        <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-white">
          {idx === 0 && (
            <td
              rowSpan={rows.length}
              className="border border-gray-300 px-2 py-1 text-xs font-medium text-center align-middle bg-gray-50 print:bg-gray-50 whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', width: '2rem' }}
            >
              {category}
            </td>
          )}
          <td className="border border-gray-300 px-2 py-1 text-xs font-medium whitespace-nowrap align-top">
            {row.item}
          </td>
          <td className="border border-gray-300 px-2 py-1 text-xs text-center align-top">
            <StatusBadge status={row.currentStatus} />
          </td>
          <td className="border border-gray-300 px-2 py-1 text-xs align-top min-w-[100px]">
            {row.situationFact || <span className="text-gray-300">—</span>}
          </td>
          <td className="border border-gray-300 px-2 py-1 text-xs align-top min-w-[80px]">
            {row.barrierFactor || <span className="text-gray-300">—</span>}
          </td>
          <td className="border border-gray-300 px-2 py-1 text-xs text-center align-top">
            <ImprovementBadge potential={row.improvementPotential} />
          </td>
          <td className="border border-gray-300 px-2 py-1 text-xs align-top min-w-[80px] print:min-w-[60px]">
            {row.userFamilyIntent || ''}
          </td>
          <td className="border border-gray-300 px-2 py-1 text-xs align-top min-w-[80px] print:min-w-[60px]">
            {row.needs || ''}
          </td>
          <td className="border border-gray-300 px-2 py-1 text-xs align-top min-w-[60px]">
            {row.remarks || ''}
          </td>
        </tr>
      ))}
    </>
  );
}

export const IssueSummarySheetView: React.FC<IssueSummarySheetViewProps> = ({ sheet, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  // カテゴリ別にグループ化
  const grouped: Record<string, IssueSummaryRow[]> = {};
  for (const row of sheet.rows) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push(row);
  }

  const categoryOrder = [
    '健康管理',
    'ADL（日常生活動作）',
    'IADL（手段的日常生活動作）',
    '認知・精神',
    '社会・環境',
    '特別な状況',
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* 印刷時非表示のヘッダー */}
      <div className="print:hidden sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold">課題整理総括表</h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            印刷
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            >
              閉じる
            </button>
          )}
        </div>
      </div>

      {/* 印刷対象コンテンツ */}
      <div className="p-6 max-w-full mx-auto print:p-2">
        {/* タイトル・基本情報 */}
        <div className="text-center mb-4 print:mb-2">
          <h1 className="text-xl font-bold print:text-base">課題整理総括表</h1>
          <p className="text-xs text-gray-500 mt-1">
            ※アセスメント情報を基に自動生成。内容を確認・加筆のうえご使用ください。
          </p>
        </div>

        {/* ヘッダー情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-sm border border-gray-300 p-3 rounded print:rounded-none print:mb-2">
          <div>
            <span className="text-gray-500 text-xs">利用者氏名</span>
            <p className="font-medium">{sheet.userName}</p>
            <p className="text-xs text-gray-500">{sheet.userKana}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">要介護度</span>
            <p className="font-medium">{sheet.careLevel}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">担当介護支援専門員</span>
            <p className="font-medium">{sheet.careManagerName}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">事業所</span>
            <p className="font-medium text-xs">{sheet.careManagerOffice}</p>
          </div>
          <div className="col-span-2 md:col-span-4">
            <span className="text-gray-500 text-xs">作成日</span>
            <span className="ml-2 text-sm">{sheet.createdDate}</span>
          </div>
        </div>

        {/* 課題整理総括表 本体 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs border border-gray-300 print:text-[9px]">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-100">
                <th
                  className="border border-gray-300 px-2 py-1 text-left whitespace-nowrap"
                  style={{ width: '2rem' }}
                >
                  分類
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left whitespace-nowrap" style={{ minWidth: '5rem' }}>
                  項目
                </th>
                <th className="border border-gray-300 px-2 py-1 text-center whitespace-nowrap" style={{ width: '4.5rem' }}>
                  現在の状況
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left" style={{ minWidth: '100px' }}>
                  状況の事実
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left" style={{ minWidth: '80px' }}>
                  自立した日常生活の阻害要因
                </th>
                <th className="border border-gray-300 px-2 py-1 text-center whitespace-nowrap" style={{ width: '3.5rem' }}>
                  改善/<br />維持の<br />可能性
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left" style={{ minWidth: '80px' }}>
                  利用者及び<br />家族の意向
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left" style={{ minWidth: '80px' }}>
                  生活全般の<br />解決すべき課題<br />（ニーズ）
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left" style={{ minWidth: '60px' }}>
                  備考
                </th>
              </tr>
            </thead>
            <tbody>
              {categoryOrder.map((category) => {
                const rows = grouped[category];
                if (!rows || rows.length === 0) return null;
                return <TableSection key={category} category={category} rows={rows} />;
              })}
            </tbody>
          </table>
        </div>

        {/* 注意書き（印刷用） */}
        <div className="mt-4 text-xs text-gray-400 print:mt-2">
          <p>※ 現在の状況・阻害要因・改善/維持の可能性はアセスメントテキストから自動推定しています。ケアマネジャーが確認・修正のうえ使用してください。</p>
          <p>※ 「利用者及び家族の意向」「生活全般の解決すべき課題（ニーズ）」はケアマネジャーが記入してください。</p>
        </div>

        {/* 署名欄（印刷用） */}
        <div className="print:block hidden mt-6 grid grid-cols-3 gap-4 border-t pt-4">
          <div>
            <p className="text-xs text-gray-500 mb-4">利用者確認：</p>
            <div className="border-b border-gray-400 h-8"></div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-4">家族確認：</p>
            <div className="border-b border-gray-400 h-8"></div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-4">担当者：</p>
            <div className="border-b border-gray-400 h-8"></div>
          </div>
        </div>
      </div>

      {/* 印刷スタイル */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
        }
      `}</style>
    </div>
  );
};
