import React, { useState } from 'react';
import { Shield, ExternalLink, Loader2, LogOut } from 'lucide-react';
import { PRIVACY_POLICY_VERSION, PRIVACY_POLICY_DATE } from './privacyContent';

interface Props {
  onConsent: () => Promise<void>;
  onShowPolicy: () => void;
  onLogout: () => void;
  isSaving: boolean;
}

export const PrivacyConsentDialog: React.FC<Props> = ({ onConsent, onShowPolicy, onLogout, isSaving }) => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base">プライバシーポリシーへの同意</h2>
              <p className="text-stone-400 text-xs">v{PRIVACY_POLICY_VERSION}　{PRIVACY_POLICY_DATE}</p>
            </div>
          </div>
          <p className="text-stone-300 text-sm leading-relaxed">
            本サービスを利用するには、個人情報の取り扱いについてご確認・同意が必要です。
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Summary */}
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">主な内容</p>
            {[
              '利用者の氏名・アセスメント・ケアプラン等の情報をFirebaseに保存します',
              'AI機能（音声解析・ケアプラン生成等）使用時に、GCP Vertex AIにデータを送信します',
              'Vertex AIはお客様のデータをモデルのトレーニングに使用しません（Google Cloud利用規約）',
              '処理は日本国内リージョン（asia-northeast1: 東京）で行われます',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold text-sm shrink-0 mt-0.5">✓</span>
                <p className="text-xs text-stone-600 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          {/* Full Policy Link */}
          <button
            onClick={onShowPolicy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            プライバシーポリシー全文を読む
          </button>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative shrink-0 mt-0.5">
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                checked
                  ? 'bg-stone-800 border-stone-800'
                  : 'border-stone-300 bg-white group-hover:border-stone-400'
              }`}>
                {checked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-stone-700 leading-relaxed">
              プライバシーポリシーの内容を確認し、個人情報の取り扱いについて同意します
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={onConsent}
            disabled={!checked || isSaving}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              checked && !isSaving
                ? 'bg-stone-800 text-white hover:bg-stone-700 shadow-sm'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              '同意してサービスを利用する'
            )}
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-stone-400 hover:text-stone-600 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
};
