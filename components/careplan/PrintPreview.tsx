import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { User, CarePlan, AssessmentData } from '../../types';

interface CareManagerInfo {
  name?: string;
  office?: string;
  phone?: string;
  fax?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  plan: CarePlan;
  assessment: AssessmentData;
  careManagerInfo?: CareManagerInfo;
}

/** 日付文字列を元号付き日本語表記に変換（例: 令和6年4月1日）*/
const formatJaDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // 月日まで含めて正確に元号を判定する
  const yyyymmdd = year * 10000 + month * 100 + day;
  let era = '';
  let eraYear = 0;
  if (yyyymmdd >= 20190501) {
    era = '令和';
    eraYear = year - 2018;
  } else if (yyyymmdd >= 19890108) {
    era = '平成';
    eraYear = year - 1988;
  } else if (yyyymmdd >= 19261225) {
    era = '昭和';
    eraYear = year - 1925;
  } else {
    return `${year}年${month}月${day}日`;
  }
  return `${era}${eraYear}年${month}月${day}日`;
};

/** 期間文字列を生成（開始日〜終了日）*/
const formatPeriod = (start?: string, end?: string): string => {
  const s = formatJaDate(start);
  const e = formatJaDate(end);
  if (s && e) return `${s}〜${e}`;
  if (s) return `${s}〜`;
  if (e) return `〜${e}`;
  return '';
};

export const PrintPreview: React.FC<Props> = ({ isOpen, onClose, user, plan, assessment: _assessment, careManagerInfo }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const planCreationDate = formatJaDate(plan.planCreationDate ?? plan.draftDate);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>居宅サービス計画書</title>
        <style>
          @media print {
            @page { margin: 8mm; size: A4 portrait; }
            @page sheet2 { size: A4 landscape; margin: 8mm; }
            @page sheet3 { size: A4 landscape; margin: 8mm; }
            .sheet2 { page: sheet2; }
            .sheet3 { page: sheet3; }
          }
          * { box-sizing: border-box; }
          body {
            font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
            font-size: 9pt;
            line-height: 1.4;
            color: #1a1a1a;
            margin: 0;
            padding: 8px;
          }
          .page-break {
            page-break-before: always;
            padding-top: 8px;
          }
          /* シートタイトルエリア */
          .sheet-title-area {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 4px;
          }
          .sheet-title {
            font-size: 13pt;
            font-weight: bold;
            text-align: center;
            flex: 1;
          }
          .sheet-meta {
            font-size: 7.5pt;
            text-align: right;
            white-space: nowrap;
            min-width: 130px;
          }
          /* 第1表・第2表 共通テーブル */
          .form-table {
            width: 100%;
            border-collapse: collapse;
          }
          .form-table th,
          .form-table td {
            border: 1px solid #333;
            padding: 4px 6px;
            vertical-align: top;
            font-size: 9pt;
          }
          .form-table th {
            background: #f0f0f0;
            font-weight: bold;
            white-space: nowrap;
          }
          .form-table .tall-cell {
            height: 56px;
          }
          .form-table .xl-cell {
            height: 72px;
          }
          /* 丸囲み（選択済み）*/
          .sel {
            display: inline-block;
            border: 1.5px solid #333;
            border-radius: 9999px;
            padding: 0 4px;
            font-weight: bold;
          }
          .note-text {
            font-size: 7pt;
            color: #666;
          }
          /* 第2表ニーズテーブル */
          .needs-table {
            width: 100%;
            border-collapse: collapse;
          }
          .needs-table th,
          .needs-table td {
            border: 1px solid #333;
            padding: 3px 4px;
            vertical-align: top;
            font-size: 8pt;
          }
          .needs-table th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
            white-space: normal;
          }
          .needs-table .center { text-align: center; }
          .needs-table .small { font-size: 7pt; }
          /* ヘッダー行（第2表） */
          .sheet2-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 9pt;
          }
          /* 注釈 */
          .footnote {
            font-size: 7.5pt;
            color: #444;
            margin-top: 4px;
          }
          /* フッター */
          .sheet-footer {
            text-align: right;
            font-size: 7pt;
            color: #aaa;
            margin-top: 6px;
          }
          /* 第3表 */
          .weekly-table {
            width: 100%;
            border-collapse: collapse;
          }
          .weekly-table th,
          .weekly-table td {
            border: 1px solid #333;
            padding: 3px 4px;
            vertical-align: top;
            font-size: 8pt;
          }
          .weekly-table th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .weekly-table .day-mark { text-align: center; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  /* ---- 選択肢表示ヘルパー ---- */
  const SelectOption: React.FC<{ value: string | undefined; options: string[] }> = ({ value, options }) => (
    <>
      {options.map((opt, i) => (
        <React.Fragment key={opt}>
          {i > 0 && '・'}
          <span className={value === opt ? 'sel' : ''}
                style={value === opt ? { display: 'inline-block', border: '1.5px solid #333', borderRadius: '9999px', padding: '0 4px', fontWeight: 'bold' } : {}}>
            {opt}
          </span>
        </React.Fragment>
      ))}
    </>
  );

  /* ---- 第2表ニーズテーブル行生成 ---- */
  const renderNeedsRows = () => {
    if (plan.needs && plan.needs.length > 0) {
      return plan.needs.flatMap((need) => {
        const rowCount = Math.max(need.shortTermGoals.length, need.services.length, 1);
        const ltPeriod = formatPeriod(need.longTermGoalStartDate, need.longTermGoalEndDate);
        return Array.from({ length: rowCount }, (_, i) => {
          const stGoal = need.shortTermGoals[i];
          const svc = need.services[i];
          const stPeriod = stGoal ? formatPeriod(stGoal.startDate, stGoal.endDate) : '';
          const svcPeriod = svc ? formatPeriod(svc.startDate, svc.endDate) : '';
          return (
            <tr key={`${need.id}-${i}`}>
              {i === 0 && (
                <>
                  <td rowSpan={rowCount} style={{ verticalAlign: 'top', width: '20%' }}>{need.content}</td>
                  <td rowSpan={rowCount} style={{ verticalAlign: 'top', width: '12%' }}>{need.longTermGoal}</td>
                  <td rowSpan={rowCount} style={{ verticalAlign: 'top', width: '8%', fontSize: '7.5pt' }}>{ltPeriod}</td>
                </>
              )}
              <td style={{ width: '11%' }}>{stGoal?.content ?? ''}</td>
              <td style={{ width: '7%', fontSize: '7.5pt' }}>{stPeriod}</td>
              <td style={{ width: '14%' }}>{svc?.content ?? ''}</td>
              <td style={{ width: '4%', textAlign: 'center' }}>{svc?.insuranceCovered !== false ? '○' : ''}</td>
              <td style={{ width: '10%' }}>{svc?.provider ?? ''}</td>
              <td style={{ width: '7%' }}>{svc?.frequency ?? ''}</td>
              <td style={{ width: '7%', fontSize: '7.5pt' }}>{svcPeriod}</td>
            </tr>
          );
        });
      });
    }
    // V1フォールバック
    const rowCount = Math.max(plan.shortTermGoals.length, 1);
    return Array.from({ length: rowCount }, (_, i) => {
      const stGoal = plan.shortTermGoals[i];
      const stPeriod = stGoal ? formatPeriod(stGoal.startDate, stGoal.endDate) : '';
      return (
        <tr key={i}>
          {i === 0 && (
            <>
              <td rowSpan={rowCount} style={{ verticalAlign: 'top', width: '20%' }}></td>
              <td rowSpan={rowCount} style={{ verticalAlign: 'top', width: '12%' }}>{plan.longTermGoal}</td>
              <td rowSpan={rowCount} style={{ verticalAlign: 'top', width: '8%', fontSize: '7.5pt' }}>
                {formatPeriod(plan.longTermGoalStartDate, plan.longTermGoalEndDate)}
              </td>
            </>
          )}
          <td style={{ width: '11%' }}>{stGoal?.content ?? ''}</td>
          <td style={{ width: '7%', fontSize: '7.5pt' }}>{stPeriod}</td>
          <td style={{ width: '14%' }}></td>
          <td style={{ width: '4%', textAlign: 'center' }}></td>
          <td style={{ width: '10%' }}></td>
          <td style={{ width: '7%' }}></td>
          <td style={{ width: '7%', fontSize: '7.5pt' }}></td>
        </tr>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <div>
            <h2 className="text-lg font-bold text-stone-800">印刷プレビュー</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              PDFとして保存するには: 印刷ダイアログ →「送信先」を「PDFに保存」に変更
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              印刷 / PDF保存
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        </div>

        {/* プレビューコンテンツ */}
        <div className="flex-1 overflow-auto p-6 bg-stone-100">
          <div ref={printRef} className="space-y-6">

            {/* ========== 第1表: 居宅サービス計画書（1） ========== */}
            <div className="bg-white shadow-md mx-auto p-6" style={{ maxWidth: '210mm', fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif', fontSize: '10pt' }}>

              {/* タイトルエリア */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                <div style={{ width: '20%' }}></div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
                  居宅サービス計画書（１）
                </div>
                <div style={{ width: '25%', textAlign: 'right', fontSize: '8pt' }}>
                  作成年月日　{planCreationDate}<br />第１表
                </div>
              </div>

              {/* 本体テーブル */}
              <table className="form-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>

                  {/* 保険者番号 / 被保険者番号 */}
                  <tr>
                    <th style={{ width: '18%', border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>保険者番号</th>
                    <td style={{ width: '20%', border: '1px solid #333', padding: '4px 6px' }}>{user.insurerNumber ?? ''}</td>
                    <th style={{ width: '18%', border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>被保険者番号</th>
                    <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{user.insuredNumber ?? ''}</td>
                  </tr>

                  {/* 利用者名 / 生年月日 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>利用者名</th>
                    <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{user.name}　様</td>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>生年月日</th>
                    <td style={{ border: '1px solid #333', padding: '4px 6px' }}>
                      {formatJaDate(user.birthDate)}　{user.gender}
                    </td>
                  </tr>

                  {/* 住所 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>住所</th>
                    <td colSpan={3} style={{ border: '1px solid #333', padding: '4px 6px' }}>{user.address}</td>
                  </tr>

                  {/* 居宅サービス計画作成者氏名 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>居宅サービス計画作成者氏名</th>
                    <td colSpan={3} style={{ border: '1px solid #333', padding: '4px 6px' }}>{careManagerInfo?.name ?? ''}</td>
                  </tr>

                  {/* 居宅介護支援事業者・事業所名及び所在地 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'normal', wordBreak: 'keep-all' }}>居宅介護支援事業者・<br />事業所名及び所在地</th>
                    <td colSpan={3} style={{ border: '1px solid #333', padding: '4px 6px' }}>{careManagerInfo?.office ?? ''}</td>
                  </tr>

                  {/* 計画作成（変更）日 / 初回計画作成日 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'normal', wordBreak: 'keep-all' }}>居宅サービス計画作成<br />（変更）日</th>
                    <td style={{ border: '1px solid #333', padding: '4px 6px' }}>
                      {formatJaDate(plan.planCreationDate ?? plan.draftDate)}
                    </td>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'normal', wordBreak: 'keep-all' }}>初回居宅サービス<br />計画作成日</th>
                    <td style={{ border: '1px solid #333', padding: '4px 6px' }}>
                      {formatJaDate(plan.firstPlanDate)}
                    </td>
                  </tr>

                  {/* 初回・紹介・継続 / 認定済・申請中 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>初回・紹介・継続</th>
                    <td style={{ border: '1px solid #333', padding: '4px 6px' }}>
                      <SelectOption value={plan.planType} options={['初回', '紹介', '継続']} />
                      <span style={{ fontSize: '7.5pt', color: '#666' }}>（いずれかに○）</span>
                    </td>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>認定済・申請中</th>
                    <td style={{ border: '1px solid #333', padding: '4px 6px' }}>
                      <SelectOption value={plan.certificationStatus} options={['認定済', '申請中']} />
                      <span style={{ fontSize: '7.5pt', color: '#666' }}>（いずれかに○）</span>
                    </td>
                  </tr>

                  {/* 要介護状態区分 / 認定の有効期間 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>要介護状態区分</th>
                    <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{user.careLevel}</td>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>認定の有効期間</th>
                    <td style={{ border: '1px solid #333', padding: '4px 6px' }}>
                      {formatJaDate(user.certificationDate)}　〜　{formatJaDate(user.certificationExpiry)}
                    </td>
                  </tr>

                  {/* 利用者及び家族の生活に関する意向を踏まえた課題分析の結果 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'normal', wordBreak: 'keep-all', fontSize: '8.5pt' }}>
                      利用者及び家族の生活に関する意向を踏まえた課題分析の結果
                    </th>
                    <td colSpan={3} style={{ border: '1px solid #333', padding: '6px', minHeight: '64px', verticalAlign: 'top' }}>
                      {plan.userIntention && <div>本人：{plan.userIntention}</div>}
                      {plan.familyIntention && <div style={{ marginTop: '4px' }}>家族等：{plan.familyIntention}</div>}
                    </td>
                  </tr>

                  {/* 認定審査会の意見及びサービスの種類の指定 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'normal', wordBreak: 'keep-all', fontSize: '8.5pt' }}>
                      認定審査会の意見及びサービスの種類の指定
                    </th>
                    <td colSpan={3} style={{ border: '1px solid #333', padding: '6px', minHeight: '36px', verticalAlign: 'top' }}>
                      {plan.reviewOpinion ?? 'なし'}
                    </td>
                  </tr>

                  {/* 総合的な援助の方針 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>総合的な援助の方針</th>
                    <td colSpan={3} style={{ border: '1px solid #333', padding: '6px', minHeight: '80px', verticalAlign: 'top' }}>
                      {plan.totalDirectionPolicy ?? ''}
                    </td>
                  </tr>

                  {/* 生活援助中心型の算定理由 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', whiteSpace: 'normal', wordBreak: 'keep-all', fontSize: '8.5pt' }}>
                      生活援助中心型の算定理由
                    </th>
                    <td colSpan={3} style={{ border: '1px solid #333', padding: '4px 6px' }}>
                      <span style={plan.lifeAssistanceReason === '1' ? { display: 'inline-block', border: '1.5px solid #333', borderRadius: '9999px', padding: '0 4px', fontWeight: 'bold' } : {}}>
                        ①一人暮らし
                      </span>

                      <span style={plan.lifeAssistanceReason === '2' ? { display: 'inline-block', border: '1.5px solid #333', borderRadius: '9999px', padding: '0 4px', fontWeight: 'bold' } : {}}>
                        ②家族等が障害・疾病等
                      </span>

                      <span style={plan.lifeAssistanceReason === '3' ? { display: 'inline-block', border: '1.5px solid #333', borderRadius: '9999px', padding: '0 4px', fontWeight: 'bold' } : {}}>
                        ③その他（{plan.lifeAssistanceReason === '3' ? (plan.lifeAssistanceReasonOther ?? '') : '　　　　　'}）
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>

              <div style={{ textAlign: 'right', fontSize: '7pt', color: '#aaa', marginTop: '6px' }}>
                ケアマネのミカタ 出力
              </div>
            </div>

            {/* ========== 第2表: 居宅サービス計画書（2） ========== */}
            <div
              className="sheet2 bg-white shadow-md mx-auto p-6"
              style={{ maxWidth: '297mm', fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif', fontSize: '9pt' }}
            >
              {/* タイトルエリア */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4px' }}>
                <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>居宅サービス計画書（２）</div>
                <div style={{ fontSize: '7.5pt', textAlign: 'right' }}>
                  作成年月日　{planCreationDate}<br />第２表
                </div>
              </div>

              {/* 利用者名 / ケアマネ名ヘッダー */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '9pt' }}>
                <div>利用者名　<strong>{user.name}</strong>　様</div>
                <div>居宅サービス計画作成者氏名　{careManagerInfo?.name ?? ''}</div>
              </div>

              {/* ニーズ・目標・援助内容テーブル */}
              <table className="needs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '20%', verticalAlign: 'middle' }}>
                      生活全般の解決すべき課題（ニーズ）
                    </th>
                    <th colSpan={2} style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', textAlign: 'center' }}>
                      目標
                    </th>
                    <th colSpan={2} style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', textAlign: 'center' }}>
                      目標
                    </th>
                    <th colSpan={5} style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', textAlign: 'center' }}>
                      援助内容
                    </th>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '12%' }}>（長期目標）</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '8%' }}>期間</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '11%' }}>（短期目標）</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '7%' }}>期間</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '14%' }}>サービス内容</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '4%' }}>※1</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '10%' }}>※2（事業所）</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '7%' }}>頻度</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '7%' }}>期間</th>
                  </tr>
                </thead>
                <tbody>
                  {renderNeedsRows()}
                </tbody>
              </table>

              {/* 注釈 */}
              <div style={{ fontSize: '7.5pt', color: '#444', marginTop: '4px' }}>
                ※1　保険給付の対象となるサービスについて記入する場合には、○印で囲む。<br />
                ※2　当該サービス内容に対応したサービス種別及び当該サービスを担当する者等を記入する。
              </div>

              <div style={{ textAlign: 'right', fontSize: '7pt', color: '#aaa', marginTop: '6px' }}>
                ケアマネのミカタ 出力
              </div>
            </div>

            {/* ========== 第3表: 週間サービス計画表 ========== */}
            {plan.weeklySchedule && (plan.weeklySchedule.entries.length > 0 || plan.weeklySchedule.mainActivities || plan.weeklySchedule.weeklyNote) && (
              <div
                className="sheet3 bg-white shadow-md mx-auto p-6"
                style={{ maxWidth: '297mm', fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif', fontSize: '9pt' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>週間サービス計画表</div>
                  <div style={{ fontSize: '7.5pt', textAlign: 'right' }}>第３表</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '9pt' }}>
                  <div>利用者名　<strong>{user.name}</strong>　様</div>
                  <div>居宅サービス計画作成者氏名　{careManagerInfo?.name ?? ''}</div>
                </div>

                {plan.weeklySchedule.mainActivities && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '2px' }}>主な日常生活上の活動</div>
                    <div style={{ border: '1px solid #333', padding: '6px', fontSize: '9pt' }}>
                      {plan.weeklySchedule.mainActivities}
                    </div>
                  </div>
                )}

                {plan.weeklySchedule.entries.length > 0 && (
                  <table className="weekly-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '12%' }}>サービス種別</th>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '15%' }}>事業所名</th>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '20%' }}>サービス内容</th>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '6%', textAlign: 'center' }}>月</th>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '6%', textAlign: 'center' }}>火</th>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '6%', textAlign: 'center' }}>水</th>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '6%', textAlign: 'center' }}>木</th>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '6%', textAlign: 'center' }}>金</th>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '6%', textAlign: 'center' }}>土</th>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '6%', textAlign: 'center' }}>日</th>
                        <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '11%' }}>時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.weeklySchedule.entries.map((entry) => (
                        <tr key={entry.id}>
                          <td style={{ border: '1px solid #333', padding: '3px 4px' }}>{entry.serviceType}</td>
                          <td style={{ border: '1px solid #333', padding: '3px 4px' }}>{entry.provider}</td>
                          <td style={{ border: '1px solid #333', padding: '3px 4px' }}>{entry.content}{entry.frequency ? `（${entry.frequency}）` : ''}</td>
                          {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(d => (
                            <td key={d} style={{ border: '1px solid #333', padding: '3px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                              {entry.days.includes(d) ? '●' : ''}
                            </td>
                          ))}
                          <td style={{ border: '1px solid #333', padding: '3px 4px' }}>
                            {entry.startTime && entry.endTime ? `${entry.startTime}〜${entry.endTime}` : entry.startTime || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {plan.weeklySchedule.weeklyNote && (
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '2px' }}>週単位以外のサービス</div>
                    <div style={{ border: '1px solid #333', padding: '6px', fontSize: '9pt' }}>
                      {plan.weeklySchedule.weeklyNote}
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'right', fontSize: '7pt', color: '#aaa', marginTop: '6px' }}>
                  ケアマネのミカタ 出力
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
