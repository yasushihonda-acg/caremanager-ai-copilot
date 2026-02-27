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
const formatPeriod = (start?: string | null, end?: string | null): string => {
  const s = formatJaDate(start);
  const e = formatJaDate(end);
  if (s && e) return `${s}〜${e}`;
  if (s) return `${s}〜`;
  if (e) return `〜${e}`;
  return '';
};

/** 要介護状態区分の表示（公式様式通り 要介護１〜５ with 選択を○囲み）*/
const CARE_LEVELS = ['要介護１', '要介護２', '要介護３', '要介護４', '要介護５'];
const CARE_LEVEL_MAP: Record<string, string> = {
  '要介護1': '要介護１',
  '要介護2': '要介護２',
  '要介護3': '要介護３',
  '要介護4': '要介護４',
  '要介護5': '要介護５',
};

export const PrintPreview: React.FC<Props> = ({ isOpen, onClose, user, plan, assessment: _assessment, careManagerInfo }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const planDate = formatJaDate(plan.planCreationDate ?? plan.draftDate);
  const currentCareLevel = CARE_LEVEL_MAP[user.careLevel] ?? user.careLevel;

  // ---- 印刷用HTMLの共通スタイル ----
  const PRINT_STYLES = `
    @media print {
      @page { margin: 8mm; size: A4 landscape; }
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
      padding: 6px;
    }
    .page-break { page-break-before: always; padding-top: 6px; }

    /* 第1表・共通テーブル */
    .f-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .f-table th, .f-table td {
      border: 1px solid #333;
      padding: 3px 5px;
      vertical-align: top;
      font-size: 8.5pt;
    }
    .f-table th { background: #f0f0f0; font-weight: bold; }

    /* 第1表 ヘッダーエリア */
    .s1-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 3px;
    }
    .s1-tag {
      border: 1px solid #333;
      padding: 1px 6px;
      font-size: 9pt;
      font-weight: bold;
      white-space: nowrap;
    }
    .s1-title { font-size: 14pt; font-weight: bold; text-align: center; flex: 1; }
    .s1-meta { text-align: right; font-size: 8pt; white-space: nowrap; min-width: 140px; }
    .s1-insurer { display: flex; gap: 12px; justify-content: flex-end; font-size: 8pt; margin-bottom: 2px; }

    /* 丸囲み選択済み */
    .sel {
      display: inline-block;
      border: 1.5px solid #333;
      border-radius: 9999px;
      padding: 0 4px;
      font-weight: bold;
    }

    /* 第2表 */
    .s2-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 3px;
    }
    .n-table { width: 100%; border-collapse: collapse; }
    .n-table th, .n-table td {
      border: 1px solid #333;
      padding: 2px 3px;
      vertical-align: top;
      font-size: 7.5pt;
    }
    .n-table th { background: #f0f0f0; font-weight: bold; text-align: center; }
    .footnote { font-size: 7pt; color: #444; margin-top: 3px; }

    /* 第3表 */
    .w-table { width: 100%; border-collapse: collapse; }
    .w-table th, .w-table td {
      border: 1px solid #333;
      padding: 2px 3px;
      vertical-align: top;
      font-size: 7.5pt;
    }
    .w-table th { background: #f0f0f0; font-weight: bold; text-align: center; }
  `;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>居宅サービス計画書</title><style>${PRINT_STYLES}</style></head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  /* ---- 選択肢 丸囲み表示 ---- */
  const Sel: React.FC<{ current: string | undefined; value: string }> = ({ current, value }) => {
    const selected = current === value;
    return (
      <span
        style={selected ? { display: 'inline-block', border: '1.5px solid #333', borderRadius: '9999px', padding: '0 4px', fontWeight: 'bold' } : {}}
      >
        {value}
      </span>
    );
  };

  /* ---- 第2表データ行生成 ---- */
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
                  <td rowSpan={rowCount} style={{ ...TD2, width: '16%' }}>{need.content}</td>
                  <td rowSpan={rowCount} style={{ ...TD2, width: '14%' }}>{need.longTermGoal}</td>
                  <td rowSpan={rowCount} style={{ ...TD2, width: '8%', fontSize: '7pt' }}>{ltPeriod}</td>
                </>
              )}
              <td style={{ ...TD2, width: '12%' }}>{stGoal?.content ?? ''}</td>
              <td style={{ ...TD2, width: '7%', fontSize: '7pt' }}>{stPeriod}</td>
              <td style={{ ...TD2, width: '13%' }}>{svc?.content ?? ''}</td>
              <td style={{ ...TD2, width: '3%', textAlign: 'center' }}>{svc?.insuranceCovered !== false ? '○' : ''}</td>
              <td style={{ ...TD2, width: '10%' }}>{svc?.type ?? ''}</td>
              <td style={{ ...TD2, width: '7%' }}>{svc?.provider ?? ''}</td>
              <td style={{ ...TD2, width: '5%' }}>{svc?.frequency ?? ''}</td>
              <td style={{ ...TD2, width: '5%', fontSize: '7pt' }}>{svcPeriod}</td>
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
              <td rowSpan={rowCount} style={{ ...TD2, width: '16%' }}></td>
              <td rowSpan={rowCount} style={{ ...TD2, width: '14%' }}>{plan.longTermGoal}</td>
              <td rowSpan={rowCount} style={{ ...TD2, width: '8%', fontSize: '7pt' }}>
                {formatPeriod(plan.longTermGoalStartDate, plan.longTermGoalEndDate)}
              </td>
            </>
          )}
          <td style={{ ...TD2, width: '12%' }}>{stGoal?.content ?? ''}</td>
          <td style={{ ...TD2, width: '7%', fontSize: '7pt' }}>{stPeriod}</td>
          <td style={{ ...TD2, width: '13%' }}></td>
          <td style={{ ...TD2, width: '3%', textAlign: 'center' }}></td>
          <td style={{ ...TD2, width: '10%' }}></td>
          <td style={{ ...TD2, width: '7%' }}></td>
          <td style={{ ...TD2, width: '5%' }}></td>
          <td style={{ ...TD2, width: '5%', fontSize: '7pt' }}></td>
        </tr>
      );
    });
  };

  /* ---- 共通インラインスタイル定義 ---- */
  const TH: React.CSSProperties = {
    border: '1px solid #333', padding: '3px 5px', background: '#f0f0f0',
    fontWeight: 'bold', verticalAlign: 'top', fontSize: '8.5pt',
  };
  const TD: React.CSSProperties = {
    border: '1px solid #333', padding: '3px 5px', verticalAlign: 'top', fontSize: '8.5pt',
  };
  // 第2表データセル用（罫線込み）
  const TD2: React.CSSProperties = {
    border: '1px solid #333', padding: '2px 3px', verticalAlign: 'top', fontSize: '7.5pt',
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1280px] max-h-[90vh] overflow-hidden flex flex-col">

        {/* ---- モーダルヘッダー ---- */}
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
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        </div>

        {/* ---- プレビュー本体 ---- */}
        <div className="flex-1 overflow-auto p-6 bg-stone-100">
          <div ref={printRef} className="space-y-6">

            {/* ══════════════════════════════════════════
                第1表: 居宅サービス計画書（１）
                ══════════════════════════════════════════ */}
            <div
              className="bg-white shadow-md mx-auto p-4"
              style={{ maxWidth: '297mm', minHeight: '194mm', fontFamily: '"Hiragino Kaku Gothic ProN","Hiragino Sans",Meiryo,sans-serif', fontSize: '9pt' }}
            >
              {/* === 第1表ヘッダーエリア === */}
              {/* 保険者番号・被保険者番号（上部） */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '3px', fontSize: '8pt' }}>
                <span>保険者番号　{user.insurerNumber ?? '　　　　　　　　'}</span>
                <span>被保険者番号　{user.insuredNumber ?? '　　　　　　　　　　'}</span>
              </div>

              {/* タイトル行：第1表 ラベル | タイトル | 作成年月日 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ border: '1px solid #333', padding: '1px 6px', fontSize: '9pt', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  第１表
                </div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
                  居宅サービス計画書（１）
                </div>
                <div style={{ textAlign: 'right', fontSize: '8pt', whiteSpace: 'nowrap', minWidth: '140px' }}>
                  作成年月日　{planDate}
                </div>
              </div>

              {/* 第2行：初回・紹介・継続 / 認定済・申請中（右寄せ） */}
              <div style={{ textAlign: 'right', fontSize: '8.5pt', marginBottom: '4px' }}>
                <Sel current={plan.planType} value="初回" />・
                <Sel current={plan.planType} value="紹介" />・
                <Sel current={plan.planType} value="継続" />
                <span style={{ marginLeft: '16px' }}>
                  <Sel current={plan.certificationStatus} value="認定済" />・
                  <Sel current={plan.certificationStatus} value="申請中" />
                </span>
              </div>

              {/* === 第1表 本体テーブル === */}
              <table className="f-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '33%' }} />
                </colgroup>
                <tbody>

                  {/* 行1: 利用者名（フリガナ）/ 生年月日・性別 / 住所 */}
                  <tr>
                    <th style={TH}>利用者名</th>
                    <td style={TD}>
                      {user.kana && <div style={{ fontSize: '7pt', color: '#555', marginBottom: '1px' }}>{user.kana}</div>}
                      {user.name}　殿
                    </td>
                    <th style={TH}>生年月日</th>
                    <td style={TD}>{formatJaDate(user.birthDate)}　{user.gender}</td>
                    <th style={TH}>住所</th>
                    <td style={TD}>{user.address}</td>
                  </tr>

                  {/* 行2: 居宅サービス計画作成者氏名 */}
                  <tr>
                    <th style={TH}>居宅サービス計画作成者氏名</th>
                    <td colSpan={5} style={TD}>{careManagerInfo?.name ?? ''}</td>
                  </tr>

                  {/* 行3: 居宅介護支援事業者・事業所名及び所在地 */}
                  <tr>
                    <th style={{ ...TH, fontSize: '8pt' }}>
                      居宅介護支援事業者・<br />事業所名及び所在地
                    </th>
                    <td colSpan={5} style={TD}>{careManagerInfo?.office ?? ''}</td>
                  </tr>

                  {/* 行4: 居宅サービス計画作成（変更）日 / 初回居宅サービス計画作成日 */}
                  <tr>
                    <th style={{ ...TH, fontSize: '8pt' }}>
                      居宅サービス計画作成（変更）日
                    </th>
                    <td style={{ ...TD, whiteSpace: 'nowrap' }}>{formatJaDate(plan.planCreationDate ?? plan.draftDate)}</td>
                    <th style={{ ...TH, fontSize: '7pt' }}>
                      初回居宅サービス<br />計画作成日
                    </th>
                    <td colSpan={3} style={{ ...TD, whiteSpace: 'nowrap' }}>{formatJaDate(plan.firstPlanDate)}</td>
                  </tr>

                  {/* 行5: 認定日 / 認定の有効期間 */}
                  <tr>
                    <th style={TH}>認定日</th>
                    <td style={{ ...TD, whiteSpace: 'nowrap' }}>{formatJaDate(user.certificationDate)}</td>
                    <th style={TH}>認定の有効期間</th>
                    <td colSpan={3} style={TD}>
                      {formatJaDate(user.certificationDate)}　〜　{formatJaDate(user.certificationExpiry)}
                    </td>
                  </tr>

                  {/* 行6: 要介護状態区分（要介護1〜5 選択を○囲み） */}
                  <tr>
                    <th style={TH}>要介護状態区分</th>
                    <td colSpan={5} style={TD}>
                      {CARE_LEVELS.map((level, i) => (
                        <React.Fragment key={level}>
                          {i > 0 && '　'}
                          <span
                            style={currentCareLevel === level
                              ? { display: 'inline-block', border: '1.5px solid #333', borderRadius: '9999px', padding: '0 4px', fontWeight: 'bold' }
                              : {}}
                          >
                            {level}
                          </span>
                        </React.Fragment>
                      ))}
                    </td>
                  </tr>

                  {/* 行7: 利用者及び家族の生活に対する意向を踏まえた課題分析の結果 */}
                  <tr>
                    <th style={{ ...TH, whiteSpace: 'normal', wordBreak: 'keep-all', fontSize: '8pt' }}>
                      利用者及び家族の生活に対する意向を踏まえた課題分析の結果
                    </th>
                    <td colSpan={5} style={{ ...TD, minHeight: '64px' }}>
                      {plan.userIntention && <div>本人：{plan.userIntention}</div>}
                      {plan.familyIntention && <div style={{ marginTop: '3px' }}>家族等：{plan.familyIntention}</div>}
                    </td>
                  </tr>

                  {/* 行8: 介護認定審査会の意見及びサービスの種類の指定 */}
                  <tr>
                    <th style={{ ...TH, whiteSpace: 'normal', wordBreak: 'keep-all', fontSize: '8pt' }}>
                      介護認定審査会の意見及びサービスの種類の指定
                    </th>
                    <td colSpan={5} style={{ ...TD, minHeight: '36px' }}>
                      {plan.reviewOpinion ?? 'なし'}
                    </td>
                  </tr>

                  {/* 行9: 総合的な援助の方針 */}
                  <tr>
                    <th style={TH}>総合的な援助の方針</th>
                    <td colSpan={5} style={{ ...TD, minHeight: '72px' }}>
                      {plan.totalDirectionPolicy ?? ''}
                    </td>
                  </tr>

                  {/* 行10: 生活援助中心型の算定理由 */}
                  <tr>
                    <th style={{ ...TH, whiteSpace: 'normal', wordBreak: 'keep-all', fontSize: '8pt' }}>
                      生活援助中心型の算定理由
                    </th>
                    <td colSpan={5} style={TD}>
                      <span
                        style={plan.lifeAssistanceReason === '1'
                          ? { display: 'inline-block', border: '1.5px solid #333', borderRadius: '9999px', padding: '0 4px', fontWeight: 'bold' }
                          : {}}
                      >
                        １．一人暮らし
                      </span>
                      {'　'}
                      <span
                        style={plan.lifeAssistanceReason === '2'
                          ? { display: 'inline-block', border: '1.5px solid #333', borderRadius: '9999px', padding: '0 4px', fontWeight: 'bold' }
                          : {}}
                      >
                        ２．家族等が障害、疾病等
                      </span>
                      {'　'}
                      <span
                        style={plan.lifeAssistanceReason === '3'
                          ? { display: 'inline-block', border: '1.5px solid #333', borderRadius: '9999px', padding: '0 4px', fontWeight: 'bold' }
                          : {}}
                      >
                        ３．その他（{plan.lifeAssistanceReason === '3' ? (plan.lifeAssistanceReasonOther ?? '') : '　　　　　　　　'}）
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>

              <div style={{ textAlign: 'right', fontSize: '7pt', color: '#aaa', marginTop: '4px' }}>
                ケアマネのミカタ 出力
              </div>
            </div>

            {/* ══════════════════════════════════════════
                第2表: 居宅サービス計画書（２）
                ══════════════════════════════════════════ */}
            <div
              className="sheet2 bg-white shadow-md mx-auto p-4"
              style={{ maxWidth: '297mm', minHeight: '194mm', fontFamily: '"Hiragino Kaku Gothic ProN","Hiragino Sans",Meiryo,sans-serif', fontSize: '9pt' }}
            >
              {/* === 第2表ヘッダーエリア === */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ border: '1px solid #333', padding: '1px 6px', fontSize: '9pt', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  第２表
                </div>
                <div style={{ fontSize: '13pt', fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
                  居宅サービス計画書（２）
                </div>
                <div style={{ textAlign: 'right', fontSize: '8pt', whiteSpace: 'nowrap', minWidth: '140px' }}>
                  作成年月日　{planDate}
                </div>
              </div>
              <div style={{ fontSize: '9pt', marginBottom: '4px' }}>
                利用者名　<strong>{user.name}</strong>　殿
              </div>

              {/* === 第2表 ニーズ・目標・援助内容テーブル（公式様式準拠） === */}
              <table className="n-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  {/* 1段目ヘッダー: ニーズ | 目標(colSpan=4) | 援助内容(colSpan=6) */}
                  <tr>
                    <th rowSpan={2} style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '16%', verticalAlign: 'middle', fontSize: '7.5pt' }}>
                      生活全般の解決すべき課題（ニーズ）
                    </th>
                    <th colSpan={4} style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', textAlign: 'center', fontSize: '7.5pt' }}>
                      目標
                    </th>
                    <th colSpan={6} style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', textAlign: 'center', fontSize: '7.5pt' }}>
                      援助内容
                    </th>
                  </tr>
                  {/* 2段目ヘッダー: 長期目標 | 期間 | 短期目標 | 期間 | サービス内容 | ※1 | サービス種別 | ※２ | 頻度 | 期間 */}
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '14%', fontSize: '7.5pt' }}>長期目標</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '8%', fontSize: '7.5pt' }}>期間</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '12%', fontSize: '7.5pt' }}>短期目標</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '7%', fontSize: '7.5pt' }}>期間</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '13%', fontSize: '7.5pt' }}>サービス内容</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '3%', fontSize: '7.5pt' }}>※１</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '10%', fontSize: '7.5pt' }}>サービス種別</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '7%', fontSize: '7.5pt' }}>※２</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '5%', fontSize: '7.5pt' }}>頻度</th>
                    <th style={{ border: '1px solid #333', padding: '3px 4px', background: '#f0f0f0', width: '5%', fontSize: '7.5pt' }}>期間</th>
                  </tr>
                </thead>
                <tbody>
                  {renderNeedsRows()}
                </tbody>
              </table>

              {/* 注釈 */}
              <div style={{ fontSize: '7pt', color: '#444', marginTop: '3px' }}>
                ※１　「保険給付の対象となるかどうかの区分」について、保険給付対象内サービスについては○印を付す。<br />
                ※２　「当該サービス提供を行う事業所」について記入する。
              </div>

              <div style={{ textAlign: 'right', fontSize: '7pt', color: '#aaa', marginTop: '4px' }}>
                ケアマネのミカタ 出力
              </div>
            </div>

            {/* ══════════════════════════════════════════
                第3表: 週間サービス計画表
                ══════════════════════════════════════════ */}
            {plan.weeklySchedule && (plan.weeklySchedule.entries.length > 0 || plan.weeklySchedule.mainActivities || plan.weeklySchedule.weeklyNote) && (
              <div
                className="sheet3 bg-white shadow-md mx-auto p-4"
                style={{ maxWidth: '297mm', minHeight: '194mm', fontFamily: '"Hiragino Kaku Gothic ProN","Hiragino Sans",Meiryo,sans-serif', fontSize: '9pt' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <div style={{ border: '1px solid #333', padding: '1px 6px', fontSize: '9pt', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    第３表
                  </div>
                  <div style={{ fontSize: '13pt', fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
                    週間サービス計画表
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '8pt', whiteSpace: 'nowrap', minWidth: '140px' }}>
                    作成年月日　{planDate}
                  </div>
                </div>
                <div style={{ fontSize: '9pt', marginBottom: '4px' }}>
                  利用者名　<strong>{user.name}</strong>　殿
                </div>

                {plan.weeklySchedule.mainActivities && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '8.5pt', marginBottom: '2px' }}>主な日常生活上の活動</div>
                    <div style={{ border: '1px solid #333', padding: '4px 6px', fontSize: '8.5pt' }}>
                      {plan.weeklySchedule.mainActivities}
                    </div>
                  </div>
                )}

                {plan.weeklySchedule.entries.length > 0 && (
                  <table className="w-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #333', padding: '2px 4px', background: '#f0f0f0', width: '12%' }}>サービス種別</th>
                        <th style={{ border: '1px solid #333', padding: '2px 4px', background: '#f0f0f0', width: '15%' }}>事業所名</th>
                        <th style={{ border: '1px solid #333', padding: '2px 4px', background: '#f0f0f0', width: '20%' }}>サービス内容</th>
                        {(['月', '火', '水', '木', '金', '土', '日'] as const).map(d => (
                          <th key={d} style={{ border: '1px solid #333', padding: '2px 4px', background: '#f0f0f0', width: '5%', textAlign: 'center' }}>{d}</th>
                        ))}
                        <th style={{ border: '1px solid #333', padding: '2px 4px', background: '#f0f0f0', width: '11%' }}>時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.weeklySchedule.entries.map((entry) => (
                        <tr key={entry.id}>
                          <td style={{ border: '1px solid #333', padding: '2px 4px' }}>{entry.serviceType}</td>
                          <td style={{ border: '1px solid #333', padding: '2px 4px' }}>{entry.provider}</td>
                          <td style={{ border: '1px solid #333', padding: '2px 4px' }}>
                            {entry.content}{entry.frequency ? `（${entry.frequency}）` : ''}
                          </td>
                          {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(d => (
                            <td key={d} style={{ border: '1px solid #333', padding: '2px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                              {entry.days.includes(d) ? '●' : ''}
                            </td>
                          ))}
                          <td style={{ border: '1px solid #333', padding: '2px 4px' }}>
                            {entry.startTime && entry.endTime ? `${entry.startTime}〜${entry.endTime}` : entry.startTime || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {plan.weeklySchedule.weeklyNote && (
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '8.5pt', marginBottom: '2px' }}>週単位以外のサービス</div>
                    <div style={{ border: '1px solid #333', padding: '4px 6px', fontSize: '8.5pt' }}>
                      {plan.weeklySchedule.weeklyNote}
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'right', fontSize: '7pt', color: '#aaa', marginTop: '4px' }}>
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
