/**
 * ケアプラン第2表 文例データベース
 * 疾患別・状態別のニーズ・目標・サービス内容の文例集
 *
 * 参考: 立てよケアマネ、ケアマネタイムス、厚生労働省ガイドライン
 */

export interface CarePlanExample {
  /** ニーズ（生活全般の解決すべき課題） */
  needs: string;
  /** 長期目標（6ヶ月〜1年） */
  longTermGoal: string;
  /** 短期目標（3ヶ月程度） */
  shortTermGoals: string[];
  /** サービス内容と種別 */
  services: {
    content: string;
    type: string;
    frequency: string;
  }[];
}

export interface DiseaseCategory {
  id: string;
  name: string;
  description: string;
  examples: CarePlanExample[];
}

// ========================================
// 1. 認知症
// ========================================
const dementia: DiseaseCategory = {
  id: 'dementia',
  name: '認知症',
  description: 'アルツハイマー型認知症、レビー小体型認知症、血管性認知症など',
  examples: [
    {
      needs: '認知機能の低下により日常生活に支障が出ているが、住み慣れた自宅で安心して生活を続けたい',
      longTermGoal: '認知機能の低下を緩やかにし、家族の支援を受けながら自宅での生活を継続できる',
      shortTermGoals: [
        '週3回のデイサービスに参加し、他者との交流を通じて脳の活性化を図る',
        '服薬管理の支援を受け、認知症の進行を抑える薬を継続して服用できる',
        '日中の活動量を維持し、生活リズムを整える',
      ],
      services: [
        { content: '認知症対応型のレクリエーションへの参加、見守り', type: '通所介護', frequency: '週3回' },
        { content: '服薬確認、健康状態の観察', type: '訪問介護', frequency: '毎日朝' },
        { content: '服薬管理、認知機能の評価', type: '訪問看護', frequency: '週1回' },
      ],
    },
    {
      needs: '物忘れがあり、火の消し忘れや薬の飲み忘れが心配。安全に生活したい',
      longTermGoal: '見守りと支援を受けながら、安全に自宅での生活を継続できる',
      shortTermGoals: [
        'IHコンロの使用に慣れ、安全に調理ができる',
        '服薬カレンダーを活用し、薬の飲み忘れを防ぐ',
        '定期的な訪問により、生活上の困りごとを早期に発見・対応する',
      ],
      services: [
        { content: '調理の見守り・声かけ、火の確認', type: '訪問介護', frequency: '週3回' },
        { content: '服薬確認、生活状況の把握', type: '訪問看護', frequency: '週1回' },
        { content: '安否確認、緊急時対応', type: '福祉用具（緊急通報装置）', frequency: '常時' },
      ],
    },
    {
      needs: '認知症により介護している家族の負担が大きくなっている。介護者も休息をとりながら介護を続けたい',
      longTermGoal: '適切なサービス利用により、本人・家族ともに心身の負担を軽減しながら在宅生活を継続できる',
      shortTermGoals: [
        '週2回のショートステイを利用し、介護者が休息をとれる時間を確保する',
        'デイサービスでの活動を通じて、本人の生活意欲を維持する',
        '定期的な担当者会議で情報共有し、介護負担の変化に対応する',
      ],
      services: [
        { content: '宿泊による介護、生活援助', type: '短期入所生活介護', frequency: '週2回' },
        { content: 'レクリエーション、入浴介助、食事提供', type: '通所介護', frequency: '週3回' },
        { content: '介護相談、サービス調整', type: '居宅介護支援', frequency: '月1回' },
      ],
    },
    {
      needs: '夜間の徘徊があり、家族が睡眠を十分にとれない状況が続いている',
      longTermGoal: '夜間の安全を確保し、本人・家族ともに安心して休息できる生活リズムを取り戻す',
      shortTermGoals: [
        '日中の活動量を増やし、夜間の睡眠の質を改善する',
        '見守りセンサーの導入により、夜間の動きを把握し早期に対応できる',
        '必要に応じて医師と相談し、睡眠状態の改善を図る',
      ],
      services: [
        { content: '日中の活動支援、機能訓練', type: '通所介護', frequency: '週4回' },
        { content: '見守りセンサー設置・運用', type: '福祉用具貸与', frequency: '常時' },
        { content: '睡眠状態の評価、主治医との連携', type: '訪問看護', frequency: '週1回' },
      ],
    },
    {
      needs: '認知症の進行により入浴を嫌がるようになった。清潔を保ちたい',
      longTermGoal: '適切な声かけと介助により、定期的に入浴し清潔を保つことができる',
      shortTermGoals: [
        '週2回のデイサービスで、スタッフの声かけにより入浴できる',
        '自宅での清拭・部分浴により、入浴できない日も清潔を保てる',
        '入浴への抵抗感を軽減し、自宅でも入浴できる機会を増やす',
      ],
      services: [
        { content: '入浴介助、着替え支援', type: '通所介護', frequency: '週2回' },
        { content: '清拭、部分浴の支援', type: '訪問介護', frequency: '週2回' },
        { content: '皮膚状態の観察', type: '訪問看護', frequency: '週1回' },
      ],
    },
  ],
};

// ========================================
// 2. 脳血管疾患（脳卒中後遺症）
// ========================================
const stroke: DiseaseCategory = {
  id: 'stroke',
  name: '脳血管疾患',
  description: '脳梗塞、脳出血、くも膜下出血後の後遺症など',
  examples: [
    {
      needs: '脳梗塞後の右片麻痺があるが、できる限り自分でできることは自分でやりたい',
      longTermGoal: '麻痺側の機能維持・改善を図りながら、自立した日常生活動作を継続できる',
      shortTermGoals: [
        '週2回のリハビリにより、麻痺側上肢の可動域を維持する',
        '手すりを使って安全にトイレまで移動し、排泄動作を自分で行える',
        '利き手交換の練習により、食事を自分で食べられる',
      ],
      services: [
        { content: '理学療法、作業療法', type: '通所リハビリテーション', frequency: '週2回' },
        { content: '手すり、歩行器の貸与', type: '福祉用具貸与', frequency: '常時' },
        { content: '自主トレーニングの指導', type: '訪問リハビリテーション', frequency: '週1回' },
      ],
    },
    {
      needs: '脳出血後の嚥下障害があり、安全に食事をとりたい',
      longTermGoal: '嚥下機能を維持・改善し、誤嚥性肺炎を予防しながら口から食事を楽しめる',
      shortTermGoals: [
        '言語聴覚士の指導により、安全な食事姿勢と食べ方を習得する',
        'とろみ剤を適切に使用し、むせずに食事ができる',
        '口腔ケアを毎日行い、口腔内の清潔を保つ',
      ],
      services: [
        { content: '嚥下訓練、食事形態の指導', type: '訪問リハビリテーション', frequency: '週2回' },
        { content: '食事介助、口腔ケア', type: '訪問介護', frequency: '毎日' },
        { content: '嚥下機能評価、肺炎予防指導', type: '訪問看護', frequency: '週1回' },
      ],
    },
    {
      needs: '脳梗塞後の高次脳機能障害により、段取りよく家事ができなくなった',
      longTermGoal: '適切な支援を受けながら、できる範囲で家事に参加し、役割を持った生活を送れる',
      shortTermGoals: [
        '手順書を活用し、簡単な調理（お茶を入れる等）ができる',
        '洗濯物たたみなど、できる家事に参加する習慣をつける',
        '作業療法により、注意力・遂行機能の改善を図る',
      ],
      services: [
        { content: '家事の声かけ・見守り、手順書作成', type: '訪問介護', frequency: '週3回' },
        { content: '高次脳機能訓練', type: '通所リハビリテーション', frequency: '週2回' },
        { content: '家族への介護指導', type: '訪問看護', frequency: '月2回' },
      ],
    },
    {
      needs: '脳卒中後のふらつきがあり、転倒が心配。安全に移動したい',
      longTermGoal: '適切な福祉用具と環境整備により、転倒を予防しながら安全に生活できる',
      shortTermGoals: [
        '歩行器を使用し、屋内を安全に移動できる',
        '住宅改修（手すり設置）により、トイレ・浴室での転倒リスクを軽減する',
        'バランス訓練により、立位保持能力を向上させる',
      ],
      services: [
        { content: '歩行器、シルバーカーの貸与', type: '福祉用具貸与', frequency: '常時' },
        { content: '手すり設置（トイレ、浴室、廊下）', type: '住宅改修', frequency: '一回' },
        { content: 'バランス訓練、歩行訓練', type: '訪問リハビリテーション', frequency: '週2回' },
      ],
    },
    {
      needs: '脳梗塞の再発が心配。健康管理をしっかりして再発を予防したい',
      longTermGoal: '生活習慣の改善と適切な服薬管理により、脳梗塞の再発を予防できる',
      shortTermGoals: [
        '毎日血圧を測定し、記録する習慣をつける',
        '処方薬を確実に服用し、血液サラサラの状態を維持する',
        '塩分・脂質を控えた食事を継続できる',
      ],
      services: [
        { content: '血圧測定、服薬確認、生活指導', type: '訪問看護', frequency: '週2回' },
        { content: '食事内容の確認、栄養指導', type: '居宅療養管理指導', frequency: '月2回' },
        { content: '主治医との情報共有', type: '居宅介護支援', frequency: '月1回' },
      ],
    },
  ],
};

// ========================================
// 3. 骨折・整形外科疾患
// ========================================
const orthopedic: DiseaseCategory = {
  id: 'orthopedic',
  name: '骨折・整形外科疾患',
  description: '大腿骨頸部骨折、圧迫骨折、変形性関節症など',
  examples: [
    {
      needs: '大腿骨頸部骨折後、以前のように歩けなくなった。また自分の足で歩きたい',
      longTermGoal: 'リハビリテーションにより歩行能力を回復し、屋内を自立して歩けるようになる',
      shortTermGoals: [
        '平行棒内での歩行訓練を行い、歩行の安定性を高める',
        '歩行器を使用して、10m以上連続して歩ける',
        '杖歩行に移行し、屋内を自由に移動できる',
      ],
      services: [
        { content: '歩行訓練、筋力強化訓練', type: '通所リハビリテーション', frequency: '週3回' },
        { content: '歩行器、杖の貸与', type: '福祉用具貸与', frequency: '常時' },
        { content: '自主トレーニング指導', type: '訪問リハビリテーション', frequency: '週1回' },
      ],
    },
    {
      needs: '圧迫骨折後の腰痛があり、長時間立っていられない。痛みを軽減したい',
      longTermGoal: '適切な疼痛管理と生活動作の工夫により、痛みをコントロールしながら日常生活を送れる',
      shortTermGoals: [
        'コルセットを正しく装着し、腰への負担を軽減できる',
        '痛みが強い時の対処法（休息、姿勢の工夫）を身につける',
        '無理のない範囲で家事を継続し、活動量を維持する',
      ],
      services: [
        { content: 'コルセット着脱指導、疼痛管理', type: '訪問看護', frequency: '週1回' },
        { content: '腰に負担をかけない動作指導', type: '訪問リハビリテーション', frequency: '週1回' },
        { content: '掃除、買い物代行', type: '訪問介護', frequency: '週2回' },
      ],
    },
    {
      needs: '変形性膝関節症で膝が痛い。階段の昇り降りが辛い',
      longTermGoal: '膝への負担を軽減し、痛みを緩和しながら自宅での生活を継続できる',
      shortTermGoals: [
        '膝周囲の筋力を強化し、膝関節の安定性を高める',
        '手すりを使って安全に階段を昇り降りできる',
        '外出時は杖を使用し、長距離も歩けるようになる',
      ],
      services: [
        { content: '膝周囲筋力強化訓練、温熱療法', type: '通所リハビリテーション', frequency: '週2回' },
        { content: '階段手すり設置', type: '住宅改修', frequency: '一回' },
        { content: '杖の貸与', type: '福祉用具貸与', frequency: '常時' },
      ],
    },
    {
      needs: '骨折後、一人での入浴が不安。安全に入浴したい',
      longTermGoal: '適切な環境整備と見守りにより、安全に入浴できる',
      shortTermGoals: [
        '浴室に手すり・シャワーチェアを設置し、安全に入浴準備ができる',
        '見守りのもと、自分で体を洗えるようになる',
        '浴槽への出入りを安全に行える',
      ],
      services: [
        { content: '浴室手すり設置、段差解消', type: '住宅改修', frequency: '一回' },
        { content: 'シャワーチェア、浴槽台の貸与', type: '福祉用具貸与', frequency: '常時' },
        { content: '入浴介助、見守り', type: '訪問介護', frequency: '週2回' },
      ],
    },
    {
      needs: '骨粗鬆症があり、また骨折しないか心配。転倒を予防したい',
      longTermGoal: '転倒予防と骨粗鬆症の治療により、骨折の再発を防ぎながら活動的な生活を送れる',
      shortTermGoals: [
        '住環境の整備（滑り止めマット、照明改善）により転倒リスクを軽減する',
        'バランス訓練により、ふらつきを改善する',
        '骨粗鬆症の薬を継続して服用し、骨密度の低下を防ぐ',
      ],
      services: [
        { content: '転倒予防体操、バランス訓練', type: '通所リハビリテーション', frequency: '週2回' },
        { content: '住環境アセスメント、整備支援', type: '訪問リハビリテーション', frequency: '月1回' },
        { content: '服薬管理、骨密度検査の調整', type: '訪問看護', frequency: '週1回' },
      ],
    },
  ],
};

// ========================================
// 4. 心疾患
// ========================================
const cardiac: DiseaseCategory = {
  id: 'cardiac',
  name: '心疾患',
  description: '心不全、狭心症、心筋梗塞後など',
  examples: [
    {
      needs: '心不全があり、少し動くと息切れがする。無理なく生活したい',
      longTermGoal: '心臓への負担を軽減しながら、できる範囲で自立した生活を継続できる',
      shortTermGoals: [
        '日常生活動作の中で休息を取り入れ、息切れを予防する',
        '塩分・水分制限を守り、心不全の悪化を防ぐ',
        '体重・血圧を毎日測定し、異常の早期発見に努める',
      ],
      services: [
        { content: 'バイタルチェック、心不全管理指導', type: '訪問看護', frequency: '週2回' },
        { content: '掃除、買い物代行', type: '訪問介護', frequency: '週2回' },
        { content: '食事指導（塩分制限）', type: '居宅療養管理指導', frequency: '月1回' },
      ],
    },
    {
      needs: '心臓の病気があり、入浴中に具合が悪くならないか心配',
      longTermGoal: '心臓への負担に配慮しながら、安全に入浴を継続できる',
      shortTermGoals: [
        '入浴前後の血圧・体調確認を習慣づける',
        '湯温・入浴時間を適切に管理し、心臓への負担を軽減する',
        '見守りのもとで安心して入浴できる',
      ],
      services: [
        { content: '入浴前後のバイタルチェック、入浴介助', type: '訪問入浴介護', frequency: '週2回' },
        { content: '入浴に関する指導、体調管理', type: '訪問看護', frequency: '週1回' },
        { content: '浴室暖房設置の検討', type: '住宅改修', frequency: '一回' },
      ],
    },
    {
      needs: '狭心症の発作が起きた時に、すぐに対応できるようにしたい',
      longTermGoal: '発作時の対応方法を身につけ、緊急時にも適切に行動できる',
      shortTermGoals: [
        'ニトログリセリンの使用方法を正しく理解し、常に携帯する',
        '発作の前兆を認識し、早めに対応できる',
        '緊急連絡先を把握し、必要時にすぐ連絡できる体制を整える',
      ],
      services: [
        { content: '緊急時対応訓練、服薬指導', type: '訪問看護', frequency: '週1回' },
        { content: '緊急通報装置の設置', type: '福祉用具貸与', frequency: '常時' },
        { content: '家族への緊急時対応指導', type: '居宅介護支援', frequency: '随時' },
      ],
    },
    {
      needs: '心筋梗塞後で運動制限がある。体力を落とさずに過ごしたい',
      longTermGoal: '心臓リハビリテーションにより、安全に体力を維持・向上させる',
      shortTermGoals: [
        '医師の指示範囲内で、軽い運動を継続する',
        '心臓リハビリプログラムに参加し、運動耐容能を向上させる',
        '日常生活での活動量を徐々に増やす',
      ],
      services: [
        { content: '心臓リハビリテーション', type: '通所リハビリテーション', frequency: '週2回' },
        { content: '運動時のモニタリング、指導', type: '訪問看護', frequency: '週1回' },
        { content: '主治医との連携、運動処方の確認', type: '居宅介護支援', frequency: '月1回' },
      ],
    },
    {
      needs: '心不全で足がむくみやすい。むくみをコントロールしたい',
      longTermGoal: '適切な自己管理により、むくみをコントロールし、快適に過ごせる',
      shortTermGoals: [
        '毎日の体重測定を継続し、水分貯留の早期発見に努める',
        '弾性ストッキングを正しく着用し、下肢のむくみを軽減する',
        '足を挙上する時間を設け、むくみを予防する',
      ],
      services: [
        { content: 'むくみの観察、体重管理指導', type: '訪問看護', frequency: '週2回' },
        { content: '弾性ストッキング着脱支援', type: '訪問介護', frequency: '毎日' },
        { content: '利尿剤の調整（医師との連携）', type: '居宅療養管理指導', frequency: '月1回' },
      ],
    },
  ],
};

// ========================================
// 5. 廃用症候群・フレイル
// ========================================
const disuse: DiseaseCategory = {
  id: 'disuse',
  name: '廃用症候群・フレイル',
  description: '長期臥床による筋力低下、加齢によるフレイル状態など',
  examples: [
    {
      needs: '入院中に体力が落ち、以前のように動けなくなった。体力を取り戻したい',
      longTermGoal: 'リハビリテーションにより筋力・体力を回復し、入院前の生活に近づける',
      shortTermGoals: [
        '離床時間を徐々に延ばし、座位保持時間を増やす',
        '下肢筋力訓練により、立ち上がりが楽にできるようになる',
        '屋内歩行を自立して行えるようになる',
      ],
      services: [
        { content: '筋力強化訓練、歩行訓練', type: '通所リハビリテーション', frequency: '週3回' },
        { content: '自主トレーニング指導', type: '訪問リハビリテーション', frequency: '週2回' },
        { content: '栄養状態の改善指導', type: '居宅療養管理指導', frequency: '月2回' },
      ],
    },
    {
      needs: '外出の機会が減り、家に閉じこもりがち。人と交流する機会がほしい',
      longTermGoal: '定期的な外出・交流の機会を持ち、心身の活力を維持できる',
      shortTermGoals: [
        '週2回のデイサービスに参加し、他者との交流を楽しむ',
        'デイサービスのレクリエーションに積極的に参加する',
        '近所への散歩を習慣化し、外出の機会を増やす',
      ],
      services: [
        { content: 'レクリエーション、集団体操', type: '通所介護', frequency: '週2回' },
        { content: '外出同行（散歩、買い物）', type: '訪問介護', frequency: '週1回' },
        { content: '地域の通いの場の情報提供', type: '居宅介護支援', frequency: '随時' },
      ],
    },
    {
      needs: '食欲が落ち、体重が減ってきた。しっかり食べて体力をつけたい',
      longTermGoal: '食事摂取量を改善し、適正体重を維持しながら活動的な生活を送れる',
      shortTermGoals: [
        '食べやすい食事形態の工夫により、食事摂取量を増やす',
        'たんぱく質を意識した食事で、筋肉量の低下を防ぐ',
        '楽しく食事ができる環境（デイサービスでの食事等）を確保する',
      ],
      services: [
        { content: '食事提供、食事見守り', type: '通所介護', frequency: '週3回' },
        { content: '栄養指導、食事形態の提案', type: '居宅療養管理指導', frequency: '月2回' },
        { content: '調理支援、買い物代行', type: '訪問介護', frequency: '週2回' },
      ],
    },
    {
      needs: '足腰が弱り、転びやすくなった。転ばずに安全に過ごしたい',
      longTermGoal: '筋力・バランス能力を維持・向上させ、転倒を予防しながら安全に生活できる',
      shortTermGoals: [
        '下肢筋力訓練を継続し、足腰の衰えを防ぐ',
        'バランス訓練により、ふらつきを改善する',
        '住環境を整備し、転倒リスクを軽減する',
      ],
      services: [
        { content: '転倒予防体操、筋力訓練', type: '通所リハビリテーション', frequency: '週2回' },
        { content: '手すり設置、段差解消', type: '住宅改修', frequency: '一回' },
        { content: '歩行補助具（杖、シルバーカー）の貸与', type: '福祉用具貸与', frequency: '常時' },
      ],
    },
    {
      needs: '一人暮らしで、もしもの時が心配。安心して暮らしたい',
      longTermGoal: '見守り体制を整え、緊急時にも対応できる安心した生活を送れる',
      shortTermGoals: [
        '緊急通報装置を設置し、いつでも助けを呼べる体制を整える',
        '定期的な訪問により、健康状態や生活状況を確認してもらえる',
        '近隣や地域との関わりを持ち、孤立を防ぐ',
      ],
      services: [
        { content: '緊急通報装置の設置', type: '福祉用具貸与', frequency: '常時' },
        { content: '安否確認、生活状況の把握', type: '訪問介護', frequency: '週3回' },
        { content: '健康チェック、相談対応', type: '訪問看護', frequency: '週1回' },
      ],
    },
  ],
};

// ========================================
// 6. ADL別の汎用文例
// ========================================
const adlGeneral: DiseaseCategory = {
  id: 'adl_general',
  name: 'ADL別汎用文例',
  description: '疾患を問わない、ADL項目別の汎用的な文例',
  examples: [
    // 移動
    {
      needs: '足腰が弱り、一人での外出が難しくなった。買い物や通院に行けるようにしたい',
      longTermGoal: '適切な移動手段を確保し、必要な外出ができる',
      shortTermGoals: [
        '歩行補助具を使用し、安全に屋外を歩ける',
        '介護タクシーを利用し、定期的に通院できる',
        '家族や支援者の付き添いで、買い物に行ける',
      ],
      services: [
        { content: '歩行器、シルバーカーの貸与', type: '福祉用具貸与', frequency: '常時' },
        { content: '通院介助', type: '介護タクシー', frequency: '月2回' },
        { content: '買い物同行', type: '訪問介護', frequency: '週1回' },
      ],
    },
    // 排泄
    {
      needs: 'トイレに間に合わないことがある。失禁せずにトイレで排泄したい',
      longTermGoal: '排泄リズムを整え、トイレでの排泄を継続できる',
      shortTermGoals: [
        'ポータブルトイレを設置し、夜間も安全に排泄できる',
        '排泄リズムを把握し、定時誘導によりトイレで排泄できる',
        '骨盤底筋体操により、尿漏れを軽減する',
      ],
      services: [
        { content: 'ポータブルトイレの貸与', type: '福祉用具貸与', frequency: '常時' },
        { content: 'トイレ誘導、排泄介助', type: '訪問介護', frequency: '1日3回' },
        { content: '排泄ケア指導、骨盤底筋体操指導', type: '訪問看護', frequency: '週1回' },
      ],
    },
    // 食事
    {
      needs: '食事の準備が難しくなった。栄養バランスの良い食事をとりたい',
      longTermGoal: '適切な支援を受けながら、栄養バランスの良い食事を継続できる',
      shortTermGoals: [
        '配食サービスを利用し、毎日温かい食事を食べられる',
        'ヘルパーの調理支援により、好みの食事を楽しめる',
        'デイサービスで栄養バランスの良い食事を週3回とれる',
      ],
      services: [
        { content: '昼食・夕食の配達', type: '配食サービス', frequency: '毎日' },
        { content: '調理、食事準備', type: '訪問介護', frequency: '週2回' },
        { content: '食事提供', type: '通所介護', frequency: '週3回' },
      ],
    },
    // 入浴
    {
      needs: '一人での入浴が不安。安全に清潔を保ちたい',
      longTermGoal: '適切な支援と環境整備により、安全に入浴し清潔を保てる',
      shortTermGoals: [
        'デイサービスで週2回入浴し、全身の清潔を保てる',
        '自宅では清拭・部分浴を行い、入浴できない日も清潔を維持する',
        '浴室環境を整備し、自宅でも安全に入浴できる機会を増やす',
      ],
      services: [
        { content: '入浴介助', type: '通所介護', frequency: '週2回' },
        { content: '清拭、部分浴', type: '訪問介護', frequency: '週2回' },
        { content: '浴室手すり、シャワーチェア', type: '福祉用具貸与・住宅改修', frequency: '常時' },
      ],
    },
    // 服薬
    {
      needs: '薬の飲み忘れや飲み間違いがある。正しく薬を飲みたい',
      longTermGoal: '服薬管理の支援を受け、処方薬を正しく服用できる',
      shortTermGoals: [
        '服薬カレンダー・お薬ボックスを活用し、飲み忘れを防ぐ',
        'ヘルパーの声かけにより、毎日決まった時間に服薬できる',
        '訪問看護師に薬の効果・副作用を確認してもらえる',
      ],
      services: [
        { content: '服薬カレンダーへのセット', type: '訪問看護', frequency: '週1回' },
        { content: '服薬確認・声かけ', type: '訪問介護', frequency: '毎日' },
        { content: '薬剤管理指導', type: '居宅療養管理指導', frequency: '月2回' },
      ],
    },
  ],
};

// ========================================
// エクスポート
// ========================================
export const careplanExampleDatabase: DiseaseCategory[] = [
  dementia,
  stroke,
  orthopedic,
  cardiac,
  disuse,
  adlGeneral,
];

/**
 * 疾患カテゴリIDから文例を取得
 */
export function getExamplesByCategory(categoryId: string): CarePlanExample[] {
  const category = careplanExampleDatabase.find((c) => c.id === categoryId);
  return category?.examples || [];
}

/**
 * キーワードに関連する文例を検索
 */
export function searchExamples(keyword: string): CarePlanExample[] {
  const results: CarePlanExample[] = [];
  const lowerKeyword = keyword.toLowerCase();

  for (const category of careplanExampleDatabase) {
    for (const example of category.examples) {
      if (
        example.needs.toLowerCase().includes(lowerKeyword) ||
        example.longTermGoal.toLowerCase().includes(lowerKeyword) ||
        example.shortTermGoals.some((g) => g.toLowerCase().includes(lowerKeyword))
      ) {
        results.push(example);
      }
    }
  }

  return results;
}

/**
 * 全カテゴリの文例数を取得
 */
export function getTotalExampleCount(): number {
  return careplanExampleDatabase.reduce((sum, category) => sum + category.examples.length, 0);
}
