import React, { useRef } from 'react';
import type { HospitalAdmissionSheet } from '../../types';

interface HospitalAdmissionSheetViewProps {
  sheet: HospitalAdmissionSheet;
  onClose?: () => void;
}

export const HospitalAdmissionSheetView: React.FC<HospitalAdmissionSheetViewProps> = ({
  sheet,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white min-h-screen">
      {/* 印刷時に非表示のヘッダー */}
      <div className="print:hidden sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold">入院時情報連携シート</h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            印刷
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              閉じる
            </button>
          )}
        </div>
      </div>

      {/* 印刷対象のコンテンツ */}
      <div ref={printRef} className="p-8 max-w-4xl mx-auto print:p-4 print:max-w-none">
        {/* ヘッダー */}
        <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-bold">入院時情報連携シート</h1>
          <p className="text-sm text-gray-600 mt-2">作成日: {sheet.createdDate}</p>
        </div>

        {/* ケアマネ情報 */}
        <section className="mb-6 p-4 bg-gray-50 rounded print:bg-white print:border">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">介護支援専門員情報</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">事業所名:</span> {sheet.careManagerOffice}</div>
            <div><span className="font-medium">担当者名:</span> {sheet.careManagerName}</div>
            <div><span className="font-medium">電話:</span> {sheet.careManagerPhone}</div>
            <div><span className="font-medium">FAX:</span> {sheet.careManagerFax}</div>
          </div>
        </section>

        {/* 利用者基本情報 */}
        <section className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">利用者基本情報</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="col-span-2">
              <span className="font-medium">氏名:</span> {sheet.userName}（{sheet.userKana}）
            </div>
            <div>
              <span className="font-medium">生年月日:</span> {sheet.birthDate}（{sheet.age}歳）
            </div>
            <div>
              <span className="font-medium">性別:</span> {sheet.gender}
            </div>
            <div className="col-span-2">
              <span className="font-medium">住所:</span> {sheet.address}
            </div>
            <div>
              <span className="font-medium">電話:</span> {sheet.phone}
            </div>
          </div>
        </section>

        {/* 介護保険情報 */}
        <section className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">介護保険情報</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">保険者番号:</span> {sheet.insurerNumber}</div>
            <div><span className="font-medium">被保険者番号:</span> {sheet.insuredNumber}</div>
            <div><span className="font-medium">要介護度:</span> {sheet.careLevel}</div>
            <div>
              <span className="font-medium">認定有効期間:</span> {sheet.certificationDate} ～ {sheet.certificationExpiry}
            </div>
          </div>
        </section>

        {/* 緊急連絡先 */}
        <section className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">緊急連絡先・家族情報</h2>
          <div className="space-y-2 text-sm">
            {sheet.emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 rounded print:bg-white">
                <span className="font-medium">{contact.name}</span>
                <span className="text-gray-600">（{contact.relationship}）</span>
                <span>{contact.phone}</span>
                {contact.isKeyPerson && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">キーパーソン</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 医療情報 */}
        <section className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">医療情報</h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-medium">主治医:</span> {sheet.primaryDoctor || '―'}</div>
              <div><span className="font-medium">かかりつけ:</span> {sheet.primaryHospital || '―'}</div>
            </div>
            <div>
              <p className="font-medium">既往歴・現病歴:</p>
              <p className="whitespace-pre-wrap p-2 bg-gray-50 rounded print:bg-white">{sheet.medicalHistory || '―'}</p>
            </div>
            <div>
              <p className="font-medium">服薬情報:</p>
              <p className="whitespace-pre-wrap p-2 bg-gray-50 rounded print:bg-white">{sheet.currentMedications || '―'}</p>
            </div>
            {sheet.allergies && (
              <div className="p-2 bg-red-50 rounded print:bg-white print:border print:border-red-200">
                <span className="font-medium text-red-700">アレルギー:</span> {sheet.allergies}
              </div>
            )}
            {sheet.medicalAlerts.length > 0 && (
              <div className="p-2 bg-yellow-50 rounded print:bg-white print:border print:border-yellow-200">
                <span className="font-medium text-yellow-700">医療上の注意:</span> {sheet.medicalAlerts.join('、')}
              </div>
            )}
          </div>
        </section>

        {/* ADL */}
        <section className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">ADL（日常生活動作）</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-gray-50 rounded print:bg-white">
              <span className="font-medium">移動:</span> {sheet.adlSummary.mobility || '―'}
            </div>
            <div className="p-2 bg-gray-50 rounded print:bg-white">
              <span className="font-medium">食事:</span> {sheet.adlSummary.eating || '―'}
            </div>
            <div className="p-2 bg-gray-50 rounded print:bg-white">
              <span className="font-medium">排泄:</span> {sheet.adlSummary.toileting || '―'}
            </div>
            <div className="p-2 bg-gray-50 rounded print:bg-white">
              <span className="font-medium">入浴:</span> {sheet.adlSummary.bathing || '―'}
            </div>
            <div className="p-2 bg-gray-50 rounded print:bg-white">
              <span className="font-medium">更衣:</span> {sheet.adlSummary.dressing || '―'}
            </div>
          </div>
        </section>

        {/* 認知・コミュニケーション */}
        <section className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">認知・コミュニケーション</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">認知機能:</span>
              <p className="p-2 bg-gray-50 rounded print:bg-white">{sheet.cognitionLevel || '―'}</p>
            </div>
            <div>
              <span className="font-medium">コミュニケーション:</span>
              <p className="p-2 bg-gray-50 rounded print:bg-white">{sheet.communicationAbility || '―'}</p>
            </div>
            {sheet.behavioralIssues && (
              <div className="p-2 bg-orange-50 rounded print:bg-white print:border print:border-orange-200">
                <span className="font-medium text-orange-700">行動上の注意:</span>
                <p className="whitespace-pre-wrap">{sheet.behavioralIssues}</p>
              </div>
            )}
          </div>
        </section>

        {/* 現在のサービス利用状況 */}
        <section className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">現在の介護サービス利用状況</h2>
          {sheet.currentServices.length > 0 ? (
            <div className="space-y-2 text-sm">
              {sheet.currentServices.map((service, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded print:bg-white">
                  <div className="font-medium">{service.serviceType}（{service.provider}）</div>
                  <div className="text-gray-600">{service.frequency} / {service.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">利用サービスなし</p>
          )}
        </section>

        {/* 特記事項 */}
        <section className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1">特記事項・申し送り</h2>
          <div className="space-y-2 text-sm">
            {sheet.specialNotes && (
              <div className="whitespace-pre-wrap p-2 bg-gray-50 rounded print:bg-white">{sheet.specialNotes}</div>
            )}
            {sheet.dietaryRestrictions && (
              <div><span className="font-medium">食事制限:</span> {sheet.dietaryRestrictions}</div>
            )}
            {sheet.sleepPattern && (
              <div><span className="font-medium">睡眠:</span> {sheet.sleepPattern}</div>
            )}
            {sheet.preferences && (
              <div><span className="font-medium">本人の好み:</span> {sheet.preferences}</div>
            )}
          </div>
        </section>

        {/* 退院後の意向 */}
        {sheet.dischargeIntentions && (
          <section className="mb-6 p-4 border rounded bg-blue-50 print:bg-white">
            <h2 className="text-lg font-semibold mb-2 border-b pb-1">退院後の意向</h2>
            <p className="text-sm whitespace-pre-wrap">{sheet.dischargeIntentions}</p>
          </section>
        )}

        {/* フッター */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
          <p>この情報は入院時の円滑な情報連携のために作成されました。</p>
          <p>ご不明な点がございましたら、上記介護支援専門員までご連絡ください。</p>
        </div>
      </div>

      {/* 印刷用スタイル */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:border {
            border: 1px solid #e5e7eb !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default HospitalAdmissionSheetView;
