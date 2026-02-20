import React from 'react';
import { X, Shield } from 'lucide-react';
import { POLICY_SECTIONS, PRIVACY_POLICY_DATE, PRIVACY_POLICY_VERSION } from './privacyContent';

interface Props {
  onClose: () => void;
}

export const PrivacyPolicyPage: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-stone-50 overflow-hidden">
      {/* Sticky Top Bar */}
      <div className="shrink-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-stone-600" />
          <span className="font-bold text-stone-800 text-base">プライバシーポリシー</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          aria-label="閉じる"
        >
          <X className="w-5 h-5 text-stone-500" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900 text-white px-6 pt-10 pb-14 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-stone-500/10 border border-stone-400/20" />
          <div className="absolute top-8 right-16 w-20 h-20 rounded-full bg-stone-400/10 border border-stone-300/10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-stone-600/30" style={{ transform: 'translate(-30%, 30%)' }} />

          <div className="relative max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-500/20 border border-stone-400/30 rounded-full text-xs text-stone-200 font-medium mb-4">
              <Shield className="w-3 h-3" />
              個人情報保護方針
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug mb-3">
              プライバシー<span className="text-stone-300">ポリシー</span>
            </h1>
            <p className="text-stone-400 text-sm leading-relaxed max-w-lg">
              「ケアマネのミカタ」における個人情報・利用者情報の取り扱いについて説明します。
            </p>
            <p className="text-stone-500 text-xs mt-3">
              バージョン {PRIVACY_POLICY_VERSION}　最終更新: {PRIVACY_POLICY_DATE}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-6 pb-20 space-y-4">
          {POLICY_SECTIONS.map((section) => (
            <div key={section.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-stone-100">
                <h2 className="font-bold text-stone-800 text-sm">{section.title}</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm text-stone-600 leading-relaxed">{p}</p>
                ))}
                {section.items && section.items.length > 0 && (
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-600 leading-relaxed">
                        <span className="text-stone-400 shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.subSections && section.subSections.map((sub, si) => (
                  <div key={si} className="mt-3">
                    <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wide mb-2">{sub.title}</h3>
                    {sub.paragraphs.map((p, i) => (
                      <p key={i} className="text-sm text-stone-600 leading-relaxed mb-2">{p}</p>
                    ))}
                    {sub.items && sub.items.length > 0 && (
                      <ul className="space-y-1.5">
                        {sub.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-stone-600 leading-relaxed">
                            <span className="text-stone-400 shrink-0 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="text-center text-xs text-stone-400 pb-2">
            ケアマネのミカタ 2025 — プライバシーポリシー v{PRIVACY_POLICY_VERSION}<br />
            <span className="text-stone-300">最終更新: {PRIVACY_POLICY_DATE}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
