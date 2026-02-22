import React, { useState } from 'react';
import { UserPlus, FileText, Wand2, Activity, X } from 'lucide-react';

interface Step {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  content: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: 'ようこそ、ケアマネのミカタへ',
    icon: UserPlus,
    iconColor: 'text-blue-600',
    content: (
      <div className="space-y-3 text-stone-600 text-sm">
        <p>
          はじめに、<strong className="text-stone-800">利用者を登録</strong>しましょう。
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-1">
          <li>トップ画面の「＋ 新規登録」ボタンをタップ</li>
          <li>氏名・生年月日・要介護度などを入力して保存</li>
          <li>利用者一覧から対象者を選択すると業務メニューが表示されます</li>
        </ol>
        <p className="text-xs text-stone-400 mt-2">
          ※ 既存の利用者をタップして選択することもできます。
        </p>
      </div>
    ),
  },
  {
    title: 'アセスメント（課題分析）',
    icon: FileText,
    iconColor: 'text-green-600',
    content: (
      <div className="space-y-3 text-stone-600 text-sm">
        <p>
          利用者を選択後、<strong className="text-stone-800">アセスメントタブ</strong>で
          23項目の課題分析を入力できます。
        </p>
        <ul className="space-y-2 pl-1">
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            健康状態・ADL・IADL など23項目に対応
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            入力後「保存」ボタンでクラウドに自動保存
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            「履歴」ボタンから過去の記録を呼び出せます
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: 'AIケアプラン作成',
    icon: Wand2,
    iconColor: 'text-violet-600',
    content: (
      <div className="space-y-3 text-stone-600 text-sm">
        <p>
          <strong className="text-stone-800">ケアプランタブ</strong>では、
          アセスメント内容をもとに AI がケアプラン原案を自動作成します。
        </p>
        <ul className="space-y-2 pl-1">
          <li className="flex items-start gap-2">
            <span className="text-violet-500 font-bold mt-0.5">✓</span>
            ケアマネの方針（意図）を入力して「作成」をタップ
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-500 font-bold mt-0.5">✓</span>
            生成されたドラフトを確認し「入力欄に反映」
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-500 font-bold mt-0.5">✓</span>
            第1表・第2表・第3表（週間計画）を編集・保存
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: 'モニタリング・支援経過',
    icon: Activity,
    iconColor: 'text-orange-500',
    content: (
      <div className="space-y-3 text-stone-600 text-sm">
        <p>残りのタブでは継続的な支援記録を管理できます。</p>
        <ul className="space-y-2 pl-1">
          <li className="flex items-start gap-2">
            <span className="text-orange-400 font-bold mt-0.5">✓</span>
            <span><strong className="text-stone-700">モニタリング</strong>：月次評価・目標達成状況の記録</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 font-bold mt-0.5">✓</span>
            <span><strong className="text-stone-700">支援経過（第5表）</strong>：日々の支援経過を記録</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 font-bold mt-0.5">✓</span>
            <span><strong className="text-stone-700">担当者会議（第4表）</strong>：会議記録・照会内容を管理</span>
          </li>
        </ul>
        <p className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-lg p-2 mt-3">
          メニュー（右上）から「操作ガイド」を選ぶと、いつでもこの案内を再表示できます。
        </p>
      </div>
    ),
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<Props> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  const handleNext = () => {
    if (isLast) {
      onClose();
      setStep(0);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    setStep(s => s - 1);
  };

  const handleSkip = () => {
    onClose();
    setStep(0);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-stone-50 ${current.iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-stone-800">{current.title}</h2>
          </div>
          <button
            onClick={handleSkip}
            aria-label="スキップ"
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 py-3">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`block h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-blue-600' : 'w-2 bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-2 min-h-[160px]">
          {current.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-5 border-t border-stone-100 mt-2">
          <button
            onClick={handleSkip}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors px-2 py-1"
          >
            スキップ
          </button>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                戻る
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              {isLast ? 'はじめる' : '次へ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
