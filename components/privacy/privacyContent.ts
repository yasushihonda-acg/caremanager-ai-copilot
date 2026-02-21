// プライバシーポリシーバージョン管理
export const PRIVACY_POLICY_VERSION = '1.0';
export const PRIVACY_POLICY_DATE = '2026年2月21日';

export interface PolicySectionData {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
  subSections?: { title: string; paragraphs: string[]; items?: string[] }[];
}

export const POLICY_SECTIONS: PolicySectionData[] = [
  {
    id: 'overview',
    title: '1. 基本方針',
    paragraphs: [
      '「ケアマネのミカタ」（以下「本アプリ」）は、ケアマネージャーの業務効率化を支援するためのAI支援アプリケーションです。',
      '本アプリの提供者（以下「当方」）は、利用者の個人情報および利用者が本アプリに入力するすべての情報（以下「ご利用者様情報」）の取り扱いを適切に行い、プライバシーの保護に努めます。',
    ],
  },
  {
    id: 'collected-data',
    title: '2. 収集する情報',
    paragraphs: ['本アプリは、以下の情報を収集します。'],
    subSections: [
      {
        title: 'アカウント情報',
        paragraphs: [],
        items: [
          'Googleアカウントのメールアドレス・表示名（Firebase Authentication経由）',
          'ケアマネジャー情報（氏名・事業所名・連絡先、任意入力）',
        ],
      },
      {
        title: 'ご利用者様情報（入力データ）',
        paragraphs: [],
        items: [
          '利用者の氏名・要介護度・住所等の基本情報',
          '23項目アセスメント情報（健康状態・ADL・認知機能・家族状況等）',
          'ケアプラン（第1〜3表）の内容',
          'モニタリング記録・支援経過記録（第5表）',
          'サービス担当者会議記録（第4表）',
          '音声入力データ（アセスメント・支援経過タブでの録音）',
        ],
      },
      {
        title: '利用ログ',
        paragraphs: [],
        items: [
          '機能の利用状況（AI生成回数、エラー発生状況等）',
          'これらはサービス改善のために収集し、個人を特定する情報は含みません',
        ],
      },
    ],
  },
  {
    id: 'ai-data-transfer',
    title: '3. AIへのデータ送信について（重要）',
    paragraphs: [
      '本アプリは、以下の機能においてGoogle Cloud Platform（GCP）上のVertex AI（Gemini 2.5 Flash）にデータを送信します。',
    ],
    subSections: [
      {
        title: '送信されるデータと機能',
        paragraphs: [],
        items: [
          '【音声アセスメント解析】 面談の録音音声（WebM形式）およびアセスメントの途中経過データ',
          '【ケアプラン原案生成】 アセスメント23項目の内容・ケアマネジャーの方針メモ',
          '【目標文の自動校正】 ケアプランの目標テキスト（1文単位）',
        ],
      },
      {
        title: 'データ保護に関する重要事項',
        paragraphs: [],
        items: [
          'データはCloud Functions（サーバーサイド）経由で送信され、APIキーはクライアント（ブラウザ）に露出しません',
          '処理先のリージョンは日本国内（asia-northeast1: 東京）です',
          'Google Cloudは、企業向けVertex AIサービスにおいて、お客様のデータをGoogleのAIモデルのトレーニングに使用しません（Google Cloud利用規約による）',
          '利用者の氏名・住所等の直接識別情報は、原則としてプロンプトに含まれません。ただし、音声入力の場合、会話内容によっては個人を特定できる情報が含まれる可能性があります',
        ],
      },
    ],
  },
  {
    id: 'data-storage',
    title: '4. データの保存・管理',
    paragraphs: [],
    items: [
      '入力データはGoogle Firebase（Firestoreデータベース）に保存されます。保存先リージョンは日本国内（asia-northeast1）です',
      'データへのアクセスは、認証済みの本人のみに制限されています（Firestoreセキュリティルールによる制御）',
      'パイロット期間中は、当方の運営担当者が技術的なサポート目的でデータを参照する場合があります',
    ],
  },
  {
    id: 'data-usage',
    title: '5. 情報の利用目的',
    paragraphs: ['収集した情報は、以下の目的にのみ使用します。'],
    items: [
      '本アプリのサービス提供（AI解析・ケアプラン生成・記録管理）',
      'サービスの改善・不具合修正',
      'セキュリティ管理・不正利用防止',
      'ユーザーサポート対応',
    ],
  },
  {
    id: 'data-sharing',
    title: '6. 第三者提供',
    paragraphs: [
      '当方は、以下の場合を除き、収集した情報を第三者に提供・開示しません。',
    ],
    items: [
      'ご本人の同意がある場合',
      '法令に基づき開示が求められる場合',
      'AIサービス提供に必要な範囲でのGoogle Cloud Platform（GCP）への送信（上記「3. AIへのデータ送信について」に記載の範囲内）',
    ],
  },
  {
    id: 'user-rights',
    title: '7. ユーザーの権利',
    paragraphs: ['本アプリをご利用の方は、以下の権利を有します。'],
    items: [
      'ご自身のデータの確認・修正・削除の要求',
      '本サービスの利用停止（アカウント削除）の要求',
      'データ処理に関する問い合わせ',
    ],
  },
  {
    id: 'security',
    title: '8. セキュリティ',
    paragraphs: [],
    items: [
      'すべての通信はHTTPS（TLS暗号化）で保護されます',
      'Firebaseセキュリティルールにより、認証済みユーザー本人のデータのみアクセス可能です',
      'Google WorkloadIdentity Federation（WIF）によりCI/CDパイプラインの認証情報を安全に管理しています',
    ],
  },
  {
    id: 'pilot-period',
    title: '9. パイロット期間の特記事項',
    paragraphs: [
      '現在、本アプリはパイロット（試験運用）期間中です。この期間中は以下の点にご注意ください。',
    ],
    items: [
      'サービスの仕様・機能は予告なく変更される場合があります',
      '本番運用に先立ち、動作確認・改善の過程でサービスが一時停止する場合があります',
      '収集データはパイロット終了後も原則として保持されます。削除を希望される場合は下記連絡先にご連絡ください',
    ],
  },
  {
    id: 'contact',
    title: '10. お問い合わせ',
    paragraphs: [
      '個人情報の取り扱いに関するお問い合わせは、以下の連絡先にご連絡ください。',
      '事業者名: （仮称）あおぞらケアグループ株式会社',
      '連絡先メールアドレス: [連絡先メールアドレス]',
    ],
  },
  {
    id: 'revision',
    title: '11. ポリシーの改定',
    paragraphs: [
      '本ポリシーは、法令改正・サービス変更等に伴い改定される場合があります。重要な変更がある場合は、アプリ内通知または再同意確認によりお知らせします。',
    ],
  },
];
