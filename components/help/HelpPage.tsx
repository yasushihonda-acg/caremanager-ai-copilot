import React, { useState } from 'react';
import {
  X, Mic, FileText, BarChart3, Users, Calendar, ChevronDown,
  Sparkles, BookOpen, AlertCircle, Download, HelpCircle,
  MessageSquare, CheckCircle, ArrowRight, ClipboardList,
  Shield, Printer, Bell, Wand2
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    q: '音声入力はどうやって使いますか？',
    a: (
      <>
        アセスメントタブまたは支援経過タブで<strong>「🎤 録音開始」</strong>ボタンをタップします。
        話し終えたら「停止」を押すと、AIが自動で文字起こし・情報抽出を行います。
        静かな環境でお使いください。
      </>
    ),
  },
  {
    q: 'AIケアプランはどうやって生成しますか？',
    a: (
      <>
        アセスメントを保存後、<strong>ケアプランタブ</strong>を開き「✨ AIでケアプラン原案を生成」ボタンを押します。
        アセスメント内容をもとにニーズ・目標・サービスを自動作成します。内容は自由に編集できます。
      </>
    ),
  },
  {
    q: 'PDFで保存・印刷するには？',
    a: (
      <>
        ケアプランタブ右上の<strong>「印刷 / PDF保存」</strong>ボタンを押すと印刷プレビューが開きます。
        ブラウザの印刷ダイアログで「PDFに保存」を選択してください。
        またはメニュー（☰）→「第1表・第2表 印刷プレビュー」からも同様に操作できます。
      </>
    ),
  },
  {
    q: 'データは自動保存されますか？',
    a: (
      <>
        自動保存は<strong>されません</strong>。
        各タブの「保存」ボタンを押したときのみクラウドに保存されます。
        未保存の変更があるタブには <span className="inline-block w-2 h-2 bg-amber-400 rounded-full align-middle mx-0.5" /> の目印が表示されます。
        タブ切り替え時にも未保存の場合は確認ダイアログが表示されます。
      </>
    ),
  },
  {
    q: 'ヘッダーのアラートアイコンは何ですか？',
    a: (
      <>
        ダッシュボードタブに<strong>期限アラート</strong>が表示されます。
        介護認定の有効期限が近い場合（30日以内）や、モニタリング期限が近い場合に警告が出ます。
        アラートをクリックすると該当する利用者情報に移動します。
      </>
    ),
  },
  {
    q: 'アセスメントの情報が正しく抽出されない場合は？',
    a: (
      <>
        音声入力後に各フィールドを手動で確認・修正できます。
        AIが抽出した項目は<span className="inline-block px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded mx-1">AI</span>バッジが表示されます。
        内容が不正確な場合は直接テキスト入力で上書きしてください。
      </>
    ),
  },
];

const FEATURES = [
  {
    icon: ClipboardList,
    color: 'indigo',
    label: 'アセスメント',
    desc: '23項目の居宅介護支援アセスメント。音声入力→AI解析で記録を効率化。インタビューコパイロットが不足情報をサジェスト。',
    tips: ['🎤 録音ボタンで話しかけるだけ', 'AIが項目を自動抽出', '手動での修正・補完もOK'],
  },
  {
    icon: FileText,
    color: 'blue',
    label: 'ケアプラン（第1・2・3表）',
    desc: 'AIによる原案自動生成。ニーズ・長期目標・短期目標・サービス内容を一括作成。文例データベースから定型文を選択可能。',
    tips: ['✨ AI原案生成ボタンで一括作成', '「文例」から定型文を挿入', '第3表は週間スケジュール管理'],
  },
  {
    icon: BarChart3,
    color: 'emerald',
    label: 'モニタリング',
    desc: '目標達成状況の評価・記録。前回からの差分入力に対応し、変化点を素早く記録。目標評価は4段階で管理。',
    tips: ['差分入力で変化点を素早く記録', '目標評価はワンタップで変更', '履歴で過去記録を確認'],
  },
  {
    icon: BookOpen,
    color: 'amber',
    label: '支援経過（第5表）',
    desc: '音声入力対応の経過記録。月次クイックボタンで定型フォーマットを自動挿入。記録の検索・絞り込みが可能。',
    tips: ['🎤 音声でその場記録', '「月次」ボタンで定型文挿入', '日付・内容でフィルタリング'],
  },
  {
    icon: Users,
    color: 'violet',
    label: 'サービス担当者会議（第4表）',
    desc: '会議記録の作成・管理。参加者・議題・検討内容・結論を構造化して保存。',
    tips: ['参加者リストを一覧管理', '議題ごとに記録を分類', 'PDF印刷で配布資料に'],
  },
];

const colorMap: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700'   },
  emerald:{ bg: 'bg-emerald-50',border: 'border-emerald-200',icon: 'text-emerald-600',badge: 'bg-emerald-100 text-emerald-700'},
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700'  },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
};

export const HelpPage: React.FC<Props> = ({ onClose }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-stone-50 overflow-hidden">
      {/* Sticky Top Bar */}
      <div className="shrink-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-stone-800 text-base">使い方ガイド</span>
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
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-blue-500/10 border border-blue-400/20" />
          <div className="absolute top-8 right-16 w-20 h-20 rounded-full bg-blue-400/10 border border-blue-300/10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-stone-600/30" style={{ transform: 'translate(-30%, 30%)' }} />

          <div className="relative max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs text-blue-200 font-medium mb-4">
              <Sparkles className="w-3 h-3" />
              AI支援ツール
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug mb-3">
              ケアマネの<span className="text-blue-400">ミカタ</span><br />
              <span className="text-stone-300 text-xl font-normal">使い方ガイド</span>
            </h1>
            <p className="text-stone-400 text-sm leading-relaxed max-w-lg">
              AI を活用してアセスメント・ケアプラン・記録業務を効率化するツールです。
              このガイドでは基本的な使い方と主な機能を説明します。
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-6 pb-20 space-y-8">

          {/* Quick Start */}
          <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-stone-100">
              <h2 className="font-bold text-stone-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">→</span>
                クイックスタート
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">3ステップで記録業務を開始</p>
            </div>
            <div className="divide-y divide-stone-50">
              {[
                { step: 1, icon: Users,         color: 'text-emerald-600 bg-emerald-50', label: '利用者を登録・選択',   desc: '左上の利用者メニューから新規登録、またはリストから既存の利用者を選択します。' },
                { step: 2, icon: ClipboardList, color: 'text-indigo-600 bg-indigo-50',  label: 'アセスメントで情報収集', desc: '「アセスメント」タブを開き、音声入力またはテキスト入力で23項目を記録します。AIが内容を自動抽出します。' },
                { step: 3, icon: Wand2,         color: 'text-blue-600 bg-blue-50',      label: 'AI原案でケアプラン作成', desc: '「ケアプラン」タブで「AIでケアプラン原案を生成」ボタンを押します。内容を確認・編集して保存します。' },
              ].map(({ step, icon: Icon, color, label, desc }) => (
                <div key={step} className="flex items-start gap-4 px-5 py-4">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${color}`}>
                      <Icon className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
                    </div>
                    <span className="text-[10px] font-bold text-stone-400">STEP {step}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-800 text-sm">{label}</p>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="font-bold text-stone-800 mb-3 flex items-center gap-2 px-1">
              <span className="w-1 h-5 bg-blue-600 rounded-full inline-block" />
              主な機能
            </h2>
            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, color, label, desc, tips }) => {
                const c = colorMap[color];
                return (
                  <div key={label} className={`bg-white rounded-xl border ${c.border} shadow-sm overflow-hidden`}>
                    <div className={`flex items-center gap-3 px-4 py-3 ${c.bg} border-b ${c.border}`}>
                      <div className={`p-1.5 rounded-lg bg-white/70 ${c.icon}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-stone-800 text-sm">{label}</span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-stone-600 leading-relaxed mb-3">{desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tips.map(tip => (
                          <span key={tip} className={`text-[11px] px-2 py-0.5 rounded-full ${c.badge} font-medium`}>
                            {tip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tips & Shortcuts */}
          <section className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm px-5 py-5">
            <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
              <Bell className="w-4.5 h-4.5 text-amber-500" style={{ width: '1.125rem', height: '1.125rem' }} />
              知っておくと便利なこと
            </h2>
            <ul className="space-y-3">
              {[
                { icon: '💾', text: '保存はボタンを押したとき だけ。未保存タブには 🟡 が表示されます。タブ移動時に確認ダイアログが出ます。' },
                { icon: '🔔', text: 'ダッシュボードで認定期限・モニタリング期限のアラートを確認できます。期限30日前から警告が出ます。' },
                { icon: '📄', text: '印刷プレビューでケアプランをPDF保存できます。ブラウザの印刷ダイアログで「PDFに保存」を選んでください。' },
                { icon: '📚', text: 'ケアプランの「文例」ボタンから定型文を一括挿入できます。6カテゴリ・30件の文例があります。' },
                { icon: '🧭', text: '初回は操作ガイド（ツアー）が自動表示されます。メニュー→「操作ガイド」でいつでも再表示できます。' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="text-lg shrink-0 leading-none mt-0.5">{icon}</span>
                  <p className="text-xs text-stone-700 leading-relaxed">{text}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="font-bold text-stone-800 mb-3 flex items-center gap-2 px-1">
              <span className="w-1 h-5 bg-amber-500 rounded-full inline-block" />
              よくある質問
            </h2>
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden divide-y divide-stone-100">
              {FAQS.map((faq, i) => (
                <div key={i}>
                  <button
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-stone-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-sm font-medium text-stone-800 leading-snug">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-stone-600 leading-relaxed bg-stone-50/60 border-t border-stone-100">
                      <div className="pt-3">{faq.a}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Feedback */}
          <section className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl text-white px-5 py-5">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold mb-1">ご意見・バグ報告</h2>
                <p className="text-sm text-stone-300 leading-relaxed">
                  画面右下の <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">💬 フィードバック</span> ボタンからご意見・バグ報告を送れます。
                  いただいたフィードバックは改善に活用します。
                </p>
              </div>
            </div>
          </section>

          {/* Version */}
          <p className="text-center text-xs text-stone-400 pb-2">
            ケアマネのミカタ 2025 — Stage 3: Pilot Edition<br />
            <span className="text-stone-300">AI技術提供: Google</span>
          </p>
        </div>
      </div>
    </div>
  );
};
