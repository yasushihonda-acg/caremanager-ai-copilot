import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const DEMO_USER_UID = 'demo-user-uid';

// ------------------------------------------------------------------
// デモシードデータ
// ------------------------------------------------------------------

function daysAgo(days: number): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromDate(new Date(Date.now() - days * 86400000));
}

async function seedDemoData(db: admin.firestore.Firestore): Promise<void> {
  const now = admin.firestore.Timestamp.now();

  function clientRef(clientId: string) {
    return db.collection('users').doc(DEMO_USER_UID).collection('clients').doc(clientId);
  }

  // ============================================================
  // Client 1: 田中花子（要介護2・認知症疑い・独居）
  // ============================================================
  const client1Id = 'client_tanaka_hanako';
  await clientRef(client1Id).set({
    name: '田中 花子', kana: 'タナカ ハナコ', birthDate: '1938-03-15', gender: '女',
    careLevel: '要介護2',
    lifeHistory: {
      hobbies: ['編み物', '園芸', '演歌鑑賞'],
      previousOccupation: '小学校教員（38年間勤務）',
      topicsToAvoid: ['亡くなった夫の話'],
      importantMemories: '教え子との思い出が生きがい。毎年年賀状が届く。',
    },
    medicalAlerts: ['ワーファリン服用中', '転倒リスク高'],
    address: '東京都世田谷区桜丘3-12-5', phone: '03-1234-5678',
    insurerNumber: '131234', insuredNumber: '0012345678',
    certificationDate: '2025-10-01', certificationExpiry: '2026-03-05',
    isActive: true, createdAt: daysAgo(90), updatedAt: daysAgo(5),
  });

  await clientRef(client1Id).collection('assessments').doc('assess_tanaka_01').set({
    date: daysAgo(85),
    content: {
      serviceHistory: '介護保険のみ利用中（デイサービス週2、訪問介護週3）',
      healthStatus: '定期的な通院が必要。高血圧・心房細動でワーファリン服用中。',
      pastHistory: '2023年 転倒による大腿骨頸部骨折（右）、2020年 心房細動',
      skinCondition: '乾燥・痒みあり。冬季は保湿剤使用。褥瘡リスクなし。',
      oralHygiene: '義歯（上下）使用。歯科受診は半年に1回。',
      fluidIntake: '意識して摂取中。1日1000ml程度。お茶を好む。',
      adlTransfer: '見守りが必要。杖歩行。屋内は手すり伝いに移動。',
      adlEating: '自立。箸で食事可能。食欲は良好。',
      adlToileting: '自立。夜間はポータブルトイレ使用。',
      adlBathing: '一部介助。浴槽の出入りに介助が必要。',
      adlDressing: '自立。ボタンは時間がかかるが自力で可能。',
      iadlCooking: '一部困難。簡単な調理は可能だが火の消し忘れが心配。',
      iadlShopping: '代行が必要。重い物は訪問介護で対応。',
      iadlMoney: '家族が支援。長女が月1回通帳管理。日常の買い物は自己管理。',
      medication: '声掛けが必要。お薬カレンダー使用。飲み忘れ月2-3回程度。',
      cognition: '認知症の疑い。短期記憶の低下あり。日付の見当識やや不良。',
      communication: '良好。話好きで会話は問題なし。やや難聴（右耳）。',
      socialParticipation: '週1回程度。デイサービスでの交流を楽しんでいる。',
      residence: '段差あり(改修済)。玄関・浴室・トイレに手すり設置済み。',
      familySituation: '独居・近隣に支援者。長女が車で30分の距離。週末に訪問。',
      maltreatmentRisk: '兆候なし',
      environment: '独居のため緊急時の対応が課題。緊急通報装置を設置済み。',
    },
    summary: '独居・認知症の疑いがある中で、ADLは概ね自立。転倒リスクと火の不始末が主な課題。',
    createdAt: daysAgo(85), updatedAt: daysAgo(85),
  });

  const plan1Id = 'plan_tanaka_01';
  await clientRef(client1Id).collection('carePlans').doc(plan1Id).set({
    assessmentId: 'assess_tanaka_01',
    dates: { assessment: daysAgo(85), draft: daysAgo(80), meeting: daysAgo(75), consent: daysAgo(75), delivery: daysAgo(74) },
    status: 'active',
    longTermGoal: '転倒せず安全に在宅生活を続け、認知機能の低下を緩やかにする',
    shortTermGoals: [
      { id: 'g1', content: '週2回のデイサービスで体力維持と社会交流を続ける', status: 'in_progress' },
      { id: 'g2', content: '服薬を忘れず管理できるようになる', status: 'in_progress' },
      { id: 'g3', content: '転倒せずに屋内を安全に移動できる', status: 'in_progress' },
    ],
    createdAt: daysAgo(80), updatedAt: daysAgo(30),
  });

  await clientRef(client1Id).collection('monitoringRecords').doc('mon_tanaka_01').set({
    carePlanId: plan1Id, userId: DEMO_USER_UID,
    recordDate: daysAgo(35), visitDate: daysAgo(35), visitMethod: 'home_visit',
    goalEvaluations: [
      { goalId: 'g1', goalContent: '週2回のデイサービスで体力維持と社会交流を続ける', status: 'progressing', observation: 'デイサービスへの参加意欲は高い。' },
      { goalId: 'g2', goalContent: '服薬を忘れず管理できるようになる', status: 'unchanged', observation: '飲み忘れが月2回程度継続。' },
      { goalId: 'g3', goalContent: '転倒せずに屋内を安全に移動できる', status: 'progressing', observation: '先月の転倒なし。' },
    ],
    overallCondition: '全体的に安定した状態が続いている。',
    healthChanges: '定期的な通院を継続しており、血圧は安定。',
    livingConditionChanges: '火の消し忘れは先月1回あり。',
    serviceUsageRecords: [
      { serviceType: '通所介護', provider: 'さくらデイサービス', plannedFrequency: '週2回', actualUsage: '週2回利用', remarks: '休まず参加' },
      { serviceType: '訪問介護', provider: 'ケアステーションみどり', plannedFrequency: '週3回', actualUsage: '週3回利用', remarks: '掃除・買い物支援' },
    ],
    serviceUsageSummary: '各サービスとも計画通りに利用できている。',
    userOpinion: 'デイサービスが楽しい。',
    familyOpinion: '安定しているようで安心。火の不始末が心配。',
    needsPlanRevision: false, revisionReason: '',
    nextActions: '現行プランを継続し、IHコンロへの変更を長女と検討。',
    nextMonitoringDate: daysAgo(-25),
    createdBy: DEMO_USER_UID, createdAt: daysAgo(35), updatedAt: daysAgo(35),
  });

  const sr1 = [
    { id: 'sr_tanaka_01', days: 40, type: 'phone_call', counter: '長女（田中美咲）', content: '母の近況確認。火の消し忘れが1回あった。IHコンロ変更を検討中。', result: 'IHコンロのカタログを送付する。' },
    { id: 'sr_tanaka_02', days: 35, type: 'home_visit', counter: '田中花子（本人）', content: '月次モニタリング訪問。体調良好。デイサービスの話を楽しそうに報告。', result: 'モニタリング記録作成。現行プラン継続。' },
    { id: 'sr_tanaka_03', days: 28, type: 'service_coordination', counter: 'さくらデイサービス（佐藤相談員）', content: '利用状況の確認。入浴介助は問題なく実施。', result: '特に問題なし。' },
    { id: 'sr_tanaka_04', days: 15, type: 'phone_call', counter: 'かかりつけ医（鈴木医院）', content: '定期受診結果の確認。血圧安定（130/78）。', result: '次回受診は1ヶ月後。' },
    { id: 'sr_tanaka_05', days: 7, type: 'document', counter: '保険者（世田谷区）', content: '給付管理票の提出。', result: '提出完了。' },
  ];
  for (const s of sr1) {
    await clientRef(client1Id).collection('supportRecords').doc(s.id).set({
      userId: DEMO_USER_UID, recordDate: daysAgo(s.days), recordType: s.type, actor: '担当ケアマネ',
      counterpart: s.counter, content: s.content, result: s.result,
      createdBy: DEMO_USER_UID, createdAt: daysAgo(s.days), updatedAt: daysAgo(s.days),
    });
  }

  // ============================================================
  // Client 2: 佐藤太郎（要介護3・脳梗塞後遺症・老老介護）
  // ============================================================
  const client2Id = 'client_sato_taro';
  await clientRef(client2Id).set({
    name: '佐藤 太郎', kana: 'サトウ タロウ', birthDate: '1940-07-22', gender: '男',
    careLevel: '要介護3',
    lifeHistory: {
      hobbies: ['将棋', '釣り', '野球観戦（巨人ファン）'],
      previousOccupation: '建設会社現場監督',
      topicsToAvoid: [],
      importantMemories: '孫の運動会を見るのが楽しみ。',
    },
    medicalAlerts: ['嚥下障害あり（とろみ食）', '左半身麻痺', '糖尿病'],
    address: '東京都杉並区高円寺南2-8-3', phone: '03-9876-5432',
    insurerNumber: '131567', insuredNumber: '0098765432',
    certificationDate: '2025-08-01', certificationExpiry: '2026-07-31',
    isActive: true, createdAt: daysAgo(120), updatedAt: daysAgo(3),
  });

  await clientRef(client2Id).collection('assessments').doc('assess_sato_01').set({
    date: daysAgo(115),
    content: {
      serviceHistory: '介護保険のみ利用中（デイケア週3、訪問看護週1、訪問リハ週1）',
      healthStatus: '脳梗塞後遺症（左半身麻痺）、糖尿病（HbA1c 7.2）。',
      pastHistory: '2024年 脳梗塞（右中大脳動脈領域）、2018年 糖尿病',
      skinCondition: '仙骨部に発赤あり。褥瘡リスクあり。',
      oralHygiene: '嚥下リハビリ中。とろみ食で対応。',
      fluidIntake: 'とろみ付き水分で1日800ml。脱水注意。',
      adlTransfer: '車椅子への移乗に介助必要。',
      adlEating: '右手で自力摂取。食事形態はとろみ食。',
      adlToileting: 'オムツ使用。日中は声掛けでトイレ誘導。',
      adlBathing: '全介助・清拭。デイケアでの機械浴を利用。',
      adlDressing: '着脱全介助。',
      iadlCooking: '妻が担当。',
      iadlShopping: '妻が対応。',
      iadlMoney: '妻が管理。',
      medication: '妻がセット・管理。インスリン自己注射は妻が介助。',
      cognition: '判断力は保たれている。時々感情的になる。',
      communication: 'やや構音障害あり。ゆっくり話せば意思疎通可能。',
      socialParticipation: 'デイケアでの交流が中心。',
      residence: '車椅子対応で廊下幅は確保。トイレの改修が必要。',
      familySituation: '老老介護。妻（80歳）が主介護者。介護疲れの兆候あり。',
      maltreatmentRisk: '介護疲れの兆候。妻の体重減少・不眠が見られる。',
      environment: '老老介護で妻の負担が大きい。ショートステイの定期利用が必要。',
    },
    summary: '脳梗塞後遺症によるADL全般に介助が必要。老老介護でレスパイトケアが急務。',
    createdAt: daysAgo(115), updatedAt: daysAgo(115),
  });

  const plan2Id = 'plan_sato_01';
  await clientRef(client2Id).collection('carePlans').doc(plan2Id).set({
    assessmentId: 'assess_sato_01',
    dates: { assessment: daysAgo(115), draft: daysAgo(110), meeting: daysAgo(105), consent: daysAgo(105), delivery: daysAgo(104) },
    status: 'active',
    longTermGoal: '安全に在宅生活を継続し、妻の介護負担を軽減する',
    shortTermGoals: [
      { id: 'g1', content: 'リハビリにより右手の機能を維持し自力で食事摂取を続ける', status: 'in_progress' },
      { id: 'g2', content: '褥瘡を発生させずに皮膚の状態を維持する', status: 'in_progress' },
      { id: 'g3', content: '月1回のショートステイで妻のレスパイトを確保する', status: 'in_progress' },
    ],
    createdAt: daysAgo(110), updatedAt: daysAgo(10),
  });

  await clientRef(client2Id).collection('monitoringRecords').doc('mon_sato_01').set({
    carePlanId: plan2Id, userId: DEMO_USER_UID,
    recordDate: daysAgo(10), visitDate: daysAgo(10), visitMethod: 'home_visit',
    goalEvaluations: [
      { goalId: 'g1', goalContent: 'リハビリにより右手の機能を維持し自力で食事摂取を続ける', status: 'progressing', observation: '右手の握力維持。スプーンでの自力摂取は安定。' },
      { goalId: 'g2', goalContent: '褥瘡を発生させずに皮膚の状態を維持する', status: 'unchanged', observation: '仙骨部の発赤は残存するが悪化なし。' },
      { goalId: 'g3', goalContent: '月1回のショートステイで妻のレスパイトを確保する', status: 'progressing', observation: '今月もショートステイ利用。妻の表情がやや明るくなった。' },
    ],
    overallCondition: '前回と大きな変化はみられない。右手の機能は維持されている。',
    healthChanges: 'HbA1c 7.0に改善。',
    livingConditionChanges: 'トイレ改修の見積もりを取得中。',
    serviceUsageRecords: [
      { serviceType: '通所リハ', provider: '高円寺リハビリクリニック', plannedFrequency: '週3回', actualUsage: '週3回', remarks: '体調不良で1回休み' },
      { serviceType: '訪問看護', provider: '訪問看護ステーションあさひ', plannedFrequency: '週1回', actualUsage: '週1回', remarks: '褥瘡予防・血糖管理' },
      { serviceType: '短期入所', provider: 'グリーンハイツ杉並', plannedFrequency: '月1回(3泊)', actualUsage: '月1回(3泊)', remarks: 'レスパイト' },
    ],
    serviceUsageSummary: '各サービスとも計画通りに利用できている。',
    userOpinion: 'リハビリを頑張りたい。',
    familyOpinion: 'ショートステイのおかげで少し休めている。',
    needsPlanRevision: false, revisionReason: '',
    nextActions: 'トイレ改修の住宅改修申請を進める。',
    nextMonitoringDate: daysAgo(-20),
    createdBy: DEMO_USER_UID, createdAt: daysAgo(10), updatedAt: daysAgo(10),
  });

  const sr2 = [
    { id: 'sr_sato_01', days: 20, type: 'service_coordination', counter: '訪問看護ステーションあさひ（山田看護師）', content: '褥瘡予防の状況確認。体位変換の頻度を増やすよう助言あり。', result: '体位変換を2時間→1.5時間に変更。' },
    { id: 'sr_sato_02', days: 14, type: 'phone_call', counter: '妻（佐藤良子）', content: '「少し疲れた」と訴え。睡眠は5時間程度。', result: 'ショートステイの利用日数増加を提案。' },
    { id: 'sr_sato_03', days: 10, type: 'home_visit', counter: '佐藤太郎（本人）・妻', content: '月次モニタリング訪問。本人は車椅子で出迎え。', result: 'モニタリング記録作成。住宅改修の申請書類を準備。' },
  ];
  for (const s of sr2) {
    await clientRef(client2Id).collection('supportRecords').doc(s.id).set({
      userId: DEMO_USER_UID, recordDate: daysAgo(s.days), recordType: s.type, actor: '担当ケアマネ',
      counterpart: s.counter, content: s.content, result: s.result,
      createdBy: DEMO_USER_UID, createdAt: daysAgo(s.days), updatedAt: daysAgo(s.days),
    });
  }

  // ============================================================
  // Client 3: 鈴木一郎（要介護1・軽度・独居）
  // ============================================================
  const client3Id = 'client_suzuki_ichiro';
  await clientRef(client3Id).set({
    name: '鈴木 一郎', kana: 'スズキ イチロウ', birthDate: '1945-11-08', gender: '男',
    careLevel: '要介護1',
    lifeHistory: {
      hobbies: ['囲碁', '散歩', '新聞を読むこと'],
      previousOccupation: '銀行員（支店長まで昇進）',
      topicsToAvoid: ['退職の経緯'],
      importantMemories: '毎朝の散歩が日課。犬（ポチ、故犬）との散歩が一番の思い出。',
    },
    medicalAlerts: ['前立腺肥大（夜間頻尿）'],
    address: '東京都練馬区石神井台5-1-7', phone: '03-5555-1234',
    insurerNumber: '131890', insuredNumber: '0055551234',
    certificationDate: '2025-12-01', certificationExpiry: '2026-11-30',
    isActive: true, createdAt: daysAgo(45), updatedAt: daysAgo(10),
  });

  await clientRef(client3Id).collection('assessments').doc('assess_suzuki_01').set({
    date: daysAgo(40),
    content: {
      serviceHistory: '介護保険のみ利用中（デイサービス週1）',
      healthStatus: '安定している。前立腺肥大で泌尿器科に3ヶ月ごと通院。',
      pastHistory: '2022年 前立腺肥大、2019年 白内障手術（両眼）',
      skinCondition: '問題なし', oralHygiene: '問題なし。自歯多数残存。',
      fluidIntake: '十分摂取。ただし夜間頻尿のため就寝前は控えめ。',
      adlTransfer: '自立。やや足が上がりにくい。',
      adlEating: '自立', adlToileting: '自立。夜間頻尿（2-3回）。',
      adlBathing: '自立。浴槽の出入りにやや不安あり。', adlDressing: '自立',
      iadlCooking: '妻が他界後、簡単な調理のみ。栄養バランスに課題。',
      iadlShopping: '自立。近所のスーパーまで歩いて行ける。',
      iadlMoney: '自立。年金管理も自分で行っている。',
      medication: '自立。カレンダー等で自立管理。',
      cognition: '自立。判断力・記憶力とも問題なし。', communication: '良好',
      socialParticipation: '閉じこもりがち。妻の他界後、外出が減った。',
      residence: '問題なし。マンション1階でバリアフリー。',
      familySituation: '独居。長男は米国在住。',
      maltreatmentRisk: '兆候なし',
      environment: '妻の他界後の孤立・閉じこもりが課題。',
    },
    summary: 'ADLは概ね自立。妻の他界後の閉じこもり傾向と栄養管理が主な課題。',
    createdAt: daysAgo(40), updatedAt: daysAgo(40),
  });

  await clientRef(client3Id).collection('carePlans').doc('plan_suzuki_01').set({
    assessmentId: 'assess_suzuki_01',
    dates: { assessment: daysAgo(40), draft: daysAgo(38), meeting: daysAgo(35), consent: daysAgo(35), delivery: daysAgo(34) },
    status: 'active',
    longTermGoal: '社会参加を増やし、健康的な食生活を維持して自立した在宅生活を続ける',
    shortTermGoals: [
      { id: 'g1', content: '週1回のデイサービスに継続して参加し、交流の場を広げる', status: 'in_progress' },
      { id: 'g2', content: '配食サービスを利用し栄養バランスの取れた食事を摂る', status: 'not_started' },
    ],
    createdAt: daysAgo(38), updatedAt: daysAgo(10),
  });

  await clientRef(client3Id).collection('supportRecords').doc('sr_suzuki_01').set({
    userId: DEMO_USER_UID, recordDate: daysAgo(30), recordType: 'home_visit', actor: '担当ケアマネ',
    counterpart: '鈴木一郎（本人）',
    content: '初回モニタリング訪問。デイサービスには問題なく参加。囲碁仲間ができたと報告。',
    result: '配食サービスの利用を具体的に提案。来週に体験利用を予定。',
    createdBy: DEMO_USER_UID, createdAt: daysAgo(30), updatedAt: daysAgo(30),
  });

  void now; // suppress unused warning
}

// ------------------------------------------------------------------
// resetDemoData Cloud Function
// ------------------------------------------------------------------

export const resetDemoData = onCall(
  { region: 'asia-northeast1' },
  async (request) => {
    // デモユーザーのみ許可
    if (!request.auth || request.auth.uid !== DEMO_USER_UID) {
      throw new HttpsError('permission-denied', 'デモユーザーのみ操作可能です');
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(DEMO_USER_UID);

    // Step 1: デモユーザーのすべてのデータを削除
    await db.recursiveDelete(userRef);

    // Step 2: シードデータを再投入
    await seedDemoData(db);

    return { success: true };
  }
);
