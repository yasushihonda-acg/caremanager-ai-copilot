import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { User, CarePlan, AssessmentData } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  plan: CarePlan;
  assessment: AssessmentData;
}

export const PrintPreview: React.FC<Props> = ({ isOpen, onClose, user, plan, assessment }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ケアプラン印刷</title>
        <style>
          @media print {
            @page { margin: 10mm; size: A4; }
          }
          body {
            font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #1a1a1a;
            margin: 0;
            padding: 20px;
          }
          .page {
            page-break-after: always;
            margin-bottom: 20px;
          }
          .page:last-child {
            page-break-after: auto;
          }
          h1 {
            font-size: 14pt;
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          h2 {
            font-size: 12pt;
            margin: 15px 0 10px;
            padding: 5px;
            background: #f0f0f0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f5f5f5;
            font-weight: bold;
            width: 25%;
          }
          .goal-item {
            margin: 5px 0;
            padding: 5px;
            background: #fafafa;
          }
          .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 9pt;
            color: #666;
          }
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '未設定';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-800">印刷プレビュー</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              印刷
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6 bg-stone-100">
          <div ref={printRef} className="bg-white shadow-lg mx-auto max-w-[210mm] p-8">
            {/* 第1表: 居宅サービス計画書(1) */}
            <div className="page">
              <h1>居宅サービス計画書(1)【第1表】</h1>

              <h2>利用者基本情報</h2>
              <table>
                <tbody>
                  <tr>
                    <th>氏名</th>
                    <td>{user.name}</td>
                    <th>フリガナ</th>
                    <td>{user.kana}</td>
                  </tr>
                  <tr>
                    <th>生年月日</th>
                    <td>{formatDate(user.birthDate)}</td>
                    <th>要介護度</th>
                    <td>{user.careLevel}</td>
                  </tr>
                  <tr>
                    <th>住所</th>
                    <td colSpan={3}>{user.address}</td>
                  </tr>
                </tbody>
              </table>

              <h2>計画作成日程</h2>
              <table>
                <tbody>
                  <tr>
                    <th>アセスメント実施日</th>
                    <td>{formatDate(plan.assessmentDate)}</td>
                  </tr>
                  <tr>
                    <th>原案作成日</th>
                    <td>{formatDate(plan.draftDate)}</td>
                  </tr>
                  <tr>
                    <th>担当者会議開催日</th>
                    <td>{formatDate(plan.meetingDate)}</td>
                  </tr>
                  <tr>
                    <th>利用者同意日</th>
                    <td>{formatDate(plan.consentDate)}</td>
                  </tr>
                </tbody>
              </table>

              <h2>医療上の留意事項</h2>
              <table>
                <tbody>
                  <tr>
                    <td>
                      {user.medicalAlerts.length > 0
                        ? user.medicalAlerts.join('、')
                        : '特になし'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="footer">
                ケアマネのミカタ 出力
              </div>
            </div>

            {/* 第2表: 居宅サービス計画書(2) */}
            <div className="page">
              <h1>居宅サービス計画書(2)【第2表】</h1>

              <h2>長期目標</h2>
              <table>
                <tbody>
                  <tr>
                    <td style={{ minHeight: '60px' }}>
                      {plan.longTermGoal || '未設定'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h2>短期目標</h2>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>No.</th>
                    <th style={{ width: '70%' }}>目標内容</th>
                    <th style={{ width: '25%' }}>ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.shortTermGoals.length > 0 ? (
                    plan.shortTermGoals.map((goal, index) => (
                      <tr key={goal.id}>
                        <td>{index + 1}</td>
                        <td>{goal.content}</td>
                        <td>
                          {goal.status === 'not_started' && '未着手'}
                          {goal.status === 'in_progress' && '取組中'}
                          {goal.status === 'achieved' && '達成'}
                          {goal.status === 'discontinued' && '中止'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3}>短期目標が設定されていません</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <h2>アセスメント概要</h2>
              <table>
                <tbody>
                  <tr>
                    <th>健康状態</th>
                    <td>{assessment.healthStatus || '未入力'}</td>
                  </tr>
                  <tr>
                    <th>既往歴</th>
                    <td>{assessment.pastHistory || '未入力'}</td>
                  </tr>
                  <tr>
                    <th>服薬状況</th>
                    <td>{assessment.medication || '未入力'}</td>
                  </tr>
                  <tr>
                    <th>認知機能</th>
                    <td>{assessment.cognition || '未入力'}</td>
                  </tr>
                  <tr>
                    <th>ADL（入浴）</th>
                    <td>{assessment.adlBathing || '未入力'}</td>
                  </tr>
                  <tr>
                    <th>ADL（排泄）</th>
                    <td>{assessment.adlToileting || '未入力'}</td>
                  </tr>
                  <tr>
                    <th>家族状況</th>
                    <td>{assessment.familySituation || '未入力'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="footer">
                ケアマネのミカタ 出力
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
