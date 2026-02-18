/**
 * アセスメント抽出テストケース
 *
 * 各テストケースは以下の構造:
 * - id: テストケースID
 * - name: テストケース名
 * - description: 説明
 * - inputText: 会話のテキスト表現（音声入力をシミュレート）
 * - expectedExtractions: 期待される抽出結果
 * - priority: 抽出の重要度（必須/重要/任意）
 */

import type { AssessmentData } from '../../types';

export interface ExpectedExtraction {
  field: keyof AssessmentData;
  shouldContain?: string[];     // この文字列を含むべき
  shouldNotContain?: string[];  // この文字列を含むべきでない
  shouldNotBeEmpty?: boolean;   // 空でないべき
}

export interface AssessmentTestCase {
  id: string;
  name: string;
  description: string;
  inputText: string;
  expectedExtractions: ExpectedExtraction[];
  tags: string[];  // カテゴリタグ（認知症、ADL、IADL等）
}

/**
 * テストケース1: 認知症高齢者の初回アセスメント
 */
export const testCase001_DementiaInitial: AssessmentTestCase = {
  id: 'TC001',
  name: '認知症高齢者の初回アセスメント',
  description: 'アルツハイマー型認知症の85歳女性。物忘れと火の消し忘れが主訴。',
  inputText: `
    本日は田中花子さん、85歳のアセスメントに伺いました。
    ご本人とお嫁さんの佐藤様がいらっしゃいました。

    まず現在の健康状態についてですが、3年前にアルツハイマー型認知症と診断されています。
    現在、アリセプトを服用中です。内科で高血圧の薬も飲んでいます。
    血圧は130/80くらいで安定しているとのことです。

    日常生活の様子を聞きますと、食事は自分で食べられますが、
    最近は何を食べたか覚えていないことが多いそうです。
    トイレは日中は自分で行けますが、夜間は失禁することがあるとのこと。
    お風呂はお嫁さんが介助しています。一人では危ないので。

    買い物は全くできなくなりました。お金の計算ができません。
    料理も火の消し忘れが何度かあって、今はお嫁さんがしています。

    認知機能についてですが、日時の見当識が曖昧で、
    今日が何曜日かわからないことがあります。
    同じことを何度も聞かれます。
    お嫁さんの名前は分かりますが、孫の名前は時々間違えます。

    ご家族の状況ですが、長男夫婦と同居されています。
    お嫁さんが主介護者で、日中は一人になることもあります。
    長男さんは会社勤めで、帰りは遅いそうです。

    住環境は持ち家の2階建てで、田中さんは1階で生活されています。
    階段には手すりがついています。
    トイレは和式から洋式に改修済みです。
  `,
  expectedExtractions: [
    { field: 'healthStatus', shouldContain: ['アルツハイマー', '認知症', '高血圧'], shouldNotBeEmpty: true },
    { field: 'medication', shouldContain: ['アリセプト'], shouldNotBeEmpty: true },
    { field: 'cognition', shouldContain: ['見当識', '物忘れ'], shouldNotBeEmpty: true },
    { field: 'adlEating', shouldContain: ['自分で'], shouldNotBeEmpty: true },
    { field: 'adlToileting', shouldContain: ['失禁', '夜間'], shouldNotBeEmpty: true },
    { field: 'adlBathing', shouldContain: ['介助'], shouldNotBeEmpty: true },
    { field: 'iadlShopping', shouldContain: ['できなく'], shouldNotBeEmpty: true },
    { field: 'iadlCooking', shouldContain: ['火'], shouldNotBeEmpty: true },
    { field: 'iadlMoney', shouldContain: ['計算', 'できません'], shouldNotBeEmpty: true },
    { field: 'familySituation', shouldContain: ['長男', '同居', 'お嫁さん'], shouldNotBeEmpty: true },
    { field: 'residence', shouldContain: ['2階建て', '1階', '持ち家'], shouldNotBeEmpty: true },
  ],
  tags: ['認知症', 'ADL', 'IADL', '家族介護'],
};

/**
 * テストケース2: 脳梗塞後遺症のリハビリ継続ケース
 */
export const testCase002_StrokeRehab: AssessmentTestCase = {
  id: 'TC002',
  name: '脳梗塞後遺症リハビリ継続',
  description: '脳梗塞後の右片麻痺がある78歳男性。リハビリ意欲が高い。',
  inputText: `
    山田太郎さん、78歳男性です。
    半年前に脳梗塞を発症し、右片麻痺が残っています。

    現在の健康状態ですが、血圧は降圧剤でコントロールされています。
    糖尿病もあり、インスリン注射を1日2回自分で打っています。
    脳梗塞の再発予防でバイアスピリンを服用中です。

    リハビリの状況ですが、週2回の訪問リハビリを利用されています。
    ご本人はとても意欲的で、毎日自主トレーニングもされています。
    目標は杖なしで歩けるようになることだそうです。

    移動についてですが、屋内は杖を使って歩けます。
    屋外は車椅子を使用しています。
    寝返りや起き上がりは自力でできます。

    食事は左手で箸を使えるようになりました。
    ただ、右手は細かい動作が難しいです。

    排泄は日中夜間ともに自立しています。
    入浴は福祉用具のシャワーチェアを使って、一部介助が必要です。

    奥様と二人暮らしです。奥様は74歳でお元気です。
    お子さんは県外にいらっしゃいますが、月に1回は来られるそうです。

    お住まいはマンションの3階ですが、エレベーターがあります。
    玄関に段差がありますので、スロープの検討が必要かもしれません。

    ご本人は「また一人で外出できるようになりたい」とおっしゃっています。
    社会参加への意欲も強く、以前のゲートボール仲間とまた会いたいそうです。
  `,
  expectedExtractions: [
    { field: 'healthStatus', shouldContain: ['脳梗塞', '片麻痺', '糖尿病'], shouldNotBeEmpty: true },
    { field: 'medication', shouldContain: ['インスリン', 'バイアスピリン'], shouldNotBeEmpty: true },
    { field: 'adlTransfer', shouldContain: ['杖', '車椅子', '寝返り'], shouldNotBeEmpty: true },
    { field: 'adlEating', shouldContain: ['左手', '箸'], shouldNotBeEmpty: true },
    { field: 'adlToileting', shouldContain: ['自立'], shouldNotBeEmpty: true },
    { field: 'adlBathing', shouldContain: ['シャワーチェア', '一部介助'], shouldNotBeEmpty: true },
    { field: 'familySituation', shouldContain: ['奥様', '二人暮らし'], shouldNotBeEmpty: true },
    { field: 'residence', shouldContain: ['マンション', 'エレベーター', '段差'], shouldNotBeEmpty: true },
    { field: 'socialParticipation', shouldContain: ['外出', 'ゲートボール'], shouldNotBeEmpty: true },
  ],
  tags: ['脳血管疾患', 'リハビリ', 'ADL', '意欲的'],
};

/**
 * テストケース3: 独居高齢者の生活支援
 */
export const testCase003_LivingAlone: AssessmentTestCase = {
  id: 'TC003',
  name: '独居高齢者の生活支援',
  description: '膝の痛みで外出が減った82歳独居女性。閉じこもり傾向。',
  inputText: `
    佐藤ハナさん、82歳の女性です。一人暮らしをされています。

    主訴は両膝の痛みです。変形性膝関節症と診断されています。
    整形外科で痛み止めをもらっていますが、あまり効かないとのこと。
    他には骨粗しょう症があり、ビスホスホネート製剤を服用しています。

    膝の痛みで歩くのが辛くなり、最近は外出が減りました。
    以前は毎日散歩していたそうですが、今は週1回の買い物程度です。
    買い物もシルバーカーを押して、近所のスーパーに何とか行っています。
    重いものは宅配を利用されています。

    食事は自分で簡単なものを作られています。
    ただ、立っているのが辛いので、座ってできる作業が多いそうです。
    掃除機をかけるのが大変で、週1回ヘルパーさんに来てもらっています。

    排泄は自立していますが、夜間のトイレが回数が多いとのこと。
    入浴は浴槽をまたぐのが怖くて、シャワーだけにすることが増えました。

    認知機能は年相応で、しっかりされています。
    会話も問題ありません。

    ご家族は長女が市内にいますが、仕事があり頻繁には来られません。
    月に2回程度来てくれるそうです。

    ご本人は「できるだけ自分でやりたい」とおっしゃっていますが、
    膝の痛みで動くのが億劫になり、閉じこもりがちになっています。
    近所付き合いも減ってきたとのことです。
  `,
  expectedExtractions: [
    { field: 'healthStatus', shouldContain: ['膝', '痛み', '変形性膝関節症', '骨粗しょう症'], shouldNotBeEmpty: true },
    { field: 'medication', shouldContain: ['痛み止め', 'ビスホスホネート'], shouldNotBeEmpty: true },
    { field: 'adlTransfer', shouldContain: ['シルバーカー'], shouldNotBeEmpty: true },
    { field: 'adlBathing', shouldContain: ['シャワー', '浴槽'], shouldNotBeEmpty: true },
    { field: 'iadlShopping', shouldContain: ['買い物', '宅配'], shouldNotBeEmpty: true },
    { field: 'iadlCooking', shouldContain: ['簡単なもの', '座って'], shouldNotBeEmpty: true },
    { field: 'serviceHistory', shouldContain: ['ヘルパー', '週1回'], shouldNotBeEmpty: true },
    { field: 'socialParticipation', shouldContain: ['閉じこもり', '近所付き合い'], shouldNotBeEmpty: true },
    { field: 'familySituation', shouldContain: ['一人暮らし', '長女', '月に2回'], shouldNotBeEmpty: true },
    { field: 'cognition', shouldContain: ['年相応', 'しっかり'], shouldNotBeEmpty: true },
  ],
  tags: ['独居', '整形疾患', '閉じこもり', 'IADL低下'],
};

/**
 * テストケース4: 医療依存度の高いケース
 */
export const testCase004_MedicalDependency: AssessmentTestCase = {
  id: 'TC004',
  name: '医療依存度の高い在宅療養',
  description: 'ALS患者で人工呼吸器使用。医療的ケアが必要。',
  inputText: `
    鈴木一郎さん、68歳男性です。
    3年前にALS（筋萎縮性側索硬化症）と診断されました。

    現在の医療的な状況ですが、昨年から人工呼吸器を装着しています。
    気管切開をしていて、24時間呼吸器管理が必要です。
    胃ろうから栄養を摂取しています。経口摂取はできません。

    吸引が必要で、だいたい2時間おきに行っています。
    訪問看護が毎日入っています。
    主治医の訪問診療は週1回です。

    四肢の筋力低下が進行していて、寝返りや体位変換は全介助です。
    移動は介護用ベッド上が主で、リクライニング車椅子への移乗は2人介助です。
    意思疎通は文字盤とまばたきで行っています。
    認知機能は保たれています。

    皮膚の状態ですが、仙骨部に発赤があり、褥瘡予防のため体位変換を
    2時間ごとに行っています。エアマットを使用しています。

    ご家族は奥様が主介護者です。
    息子さん夫婦が近くに住んでいて、週末は手伝いに来られます。
    奥様の介護負担がかなり大きく、レスパイト目的の短期入所も
    検討したいとのことです。

    ご本人は「家で過ごしたい」という意思を示されています。
  `,
  expectedExtractions: [
    { field: 'healthStatus', shouldContain: ['ALS', '人工呼吸器', '気管切開'], shouldNotBeEmpty: true },
    { field: 'fluidIntake', shouldContain: ['胃ろう'], shouldNotBeEmpty: true },
    { field: 'adlEating', shouldContain: ['経口摂取', 'できない', 'できません'], shouldNotBeEmpty: true },
    { field: 'adlTransfer', shouldContain: ['全介助', '寝返り', '体位変換'], shouldNotBeEmpty: true },
    { field: 'skinCondition', shouldContain: ['発赤', '仙骨部', '褥瘡予防'], shouldNotBeEmpty: true },
    { field: 'communication', shouldContain: ['文字盤', 'まばたき'], shouldNotBeEmpty: true },
    { field: 'cognition', shouldContain: ['保たれ'], shouldNotBeEmpty: true },
    { field: 'serviceHistory', shouldContain: ['訪問看護', '訪問診療'], shouldNotBeEmpty: true },
    { field: 'familySituation', shouldContain: ['奥様', '介護負担'], shouldNotBeEmpty: true },
  ],
  tags: ['難病', '医療依存', '重度', '介護負担'],
};

/**
 * テストケース5: 虐待リスクのあるケース
 */
export const testCase005_MaltreatmentRisk: AssessmentTestCase = {
  id: 'TC005',
  name: '虐待リスクのあるケース',
  description: '経済的虐待と介護放棄が疑われる90歳男性。',
  inputText: `
    高橋三郎さん、90歳男性です。
    息子さんと同居されています。

    地域包括支援センターから情報提供がありました。
    近所の方から「あまり外に出てこなくなった」「怒鳴り声が聞こえる」
    との心配の声があったそうです。

    訪問すると、ご本人は少しやせていらっしゃいました。
    お部屋はあまり片付いていませんでした。
    着ている服も汚れていました。

    息子さんは50代で、仕事はしていないようです。
    年金はお父さんの口座で管理していると言っていましたが、
    詳しいことは教えてもらえませんでした。

    ご本人に話を聞くと、「食事は1日2回」とおっしゃっていました。
    病院には最近行っていないとのこと。
    以前は糖尿病で通院していたそうですが、1年以上行っていないそうです。

    ご本人は「息子に迷惑をかけている」と言って、
    あまり多くを話してくださいませんでした。

    身体状況ですが、歩行はふらつきがあります。
    認知機能は軽度の低下がありそうです。

    今回の訪問では息子さんが同席していたので、
    ご本人だけでお話しする機会が取れませんでした。
    次回は単独で面談できるようにしたいと思います。
  `,
  expectedExtractions: [
    { field: 'healthStatus', shouldContain: ['やせ'], shouldNotBeEmpty: true },
    { field: 'pastHistory', shouldContain: ['糖尿病'], shouldNotBeEmpty: true },
    { field: 'adlTransfer', shouldContain: ['ふらつき'], shouldNotBeEmpty: true },
    { field: 'adlDressing', shouldContain: ['汚れ'], shouldNotBeEmpty: true },
    { field: 'cognition', shouldContain: ['軽度', '低下'], shouldNotBeEmpty: true },
    { field: 'familySituation', shouldContain: ['息子', '同居'], shouldNotBeEmpty: true },
    { field: 'maltreatmentRisk', shouldContain: ['年金', '食事', '通院', '片付いていない'], shouldNotBeEmpty: true },
  ],
  tags: ['虐待リスク', '独居高齢者', '経済的問題'],
};

/**
 * テストケース6: 口腔・嚥下に問題があるケース
 */
export const testCase006_OralSwallowing: AssessmentTestCase = {
  id: 'TC006',
  name: '口腔・嚥下機能低下',
  description: '誤嚥性肺炎の既往がある87歳男性。口腔ケアと食事形態に配慮が必要。',
  inputText: `
    中村正夫さん、87歳男性です。

    3ヶ月前に誤嚥性肺炎で入院されました。
    退院後、食事にむせることが多くなったそうです。

    口腔内の状態ですが、入れ歯が合わなくなってきています。
    歯科には1年以上行っていないとのことです。
    口の中が乾燥しやすく、唾液が少ないようです。
    舌の動きも悪くなってきています。

    食事の様子ですが、普通のご飯は食べにくくなり、
    現在はお粥を食べています。おかずは刻み食にしています。
    水分はとろみをつけています。
    食事に時間がかかり、30分以上かかることもあります。

    水分摂取量は1日800ml程度です。
    脱水予防のため、もう少し増やしたいところです。

    他の健康状態ですが、心房細動があり、ワーファリンを服用中です。
    前立腺肥大で泌尿器科にもかかっています。

    日常生活は概ね自立していますが、
    入浴時の浴槽への出入りは見守りが必要です。

    奥様と二人暮らしで、奥様も80歳と高齢です。
    食事の準備は奥様がされていますが、とろみ付けなど
    負担に感じていらっしゃるようです。
  `,
  expectedExtractions: [
    { field: 'healthStatus', shouldContain: ['誤嚥性肺炎', '心房細動', '前立腺肥大'], shouldNotBeEmpty: true },
    { field: 'oralHygiene', shouldContain: ['入れ歯', '乾燥', '舌', 'むせ'], shouldNotBeEmpty: true },
    { field: 'fluidIntake', shouldContain: ['800ml', 'とろみ'], shouldNotBeEmpty: true },
    { field: 'adlEating', shouldContain: ['お粥', '刻み食'], shouldNotBeEmpty: true },
    { field: 'medication', shouldContain: ['ワーファリン'], shouldNotBeEmpty: true },
    { field: 'adlBathing', shouldContain: ['見守り'], shouldNotBeEmpty: true },
    { field: 'familySituation', shouldContain: ['奥様', '二人暮らし', '80歳'], shouldNotBeEmpty: true },
  ],
  tags: ['口腔ケア', '嚥下障害', '誤嚥リスク'],
};

/**
 * 全テストケースのエクスポート
 */
export const allTestCases: AssessmentTestCase[] = [
  testCase001_DementiaInitial,
  testCase002_StrokeRehab,
  testCase003_LivingAlone,
  testCase004_MedicalDependency,
  testCase005_MaltreatmentRisk,
  testCase006_OralSwallowing,
];

/**
 * タグでフィルタリング
 */
export function getTestCasesByTag(tag: string): AssessmentTestCase[] {
  return allTestCases.filter(tc => tc.tags.includes(tag));
}

/**
 * IDでテストケースを取得
 */
export function getTestCaseById(id: string): AssessmentTestCase | undefined {
  return allTestCases.find(tc => tc.id === id);
}
