/**
 * 期限アラートユーティリティ
 * 認定有効期限・モニタリング期限の判定ロジック
 *
 * 法的根拠:
 * - 認定更新: 介護保険法 第28条
 * - モニタリング月1回: 指定居宅介護支援等の事業の人員及び運営に関する基準 第13条18号
 */

export type DeadlineUrgency = 'expired' | 'critical' | 'warning' | 'safe' | 'unknown';

export interface CertificationDeadlineStatus {
  urgency: DeadlineUrgency;
  daysRemaining: number | null;
  label: string; // "残り15日", "期限切れ", "残り45日" 等
}

export interface MonitoringStatus {
  isCurrentMonthDone: boolean;
  lastVisitDate: string | null; // YYYY-MM-DD
  daysSinceLastVisit: number | null;
}

/**
 * 認定有効期限の状態を判定する
 *
 * urgency ルール:
 * - null/空/不正 → unknown（非表示）
 * - today > expiry → expired（赤）
 * - 0 ≤ days ≤ 30 → critical（赤）
 * - 31 ≤ days ≤ 60 → warning（黄）
 * - days > 60 → safe（非表示）
 *
 * タイムゾーン: 'T00:00:00' でローカル解釈（既存 useCarePlan.ts と同パターン）
 */
export function getCertificationDeadlineStatus(
  certificationExpiry: string | null,
  today?: Date,
): CertificationDeadlineStatus {
  if (!certificationExpiry || certificationExpiry.trim() === '') {
    return { urgency: 'unknown', daysRemaining: null, label: '' };
  }

  const expiryDate = new Date(certificationExpiry + 'T00:00:00');
  if (isNaN(expiryDate.getTime())) {
    return { urgency: 'unknown', daysRemaining: null, label: '' };
  }

  const todayDate = today ?? new Date();
  // 時刻を除いた日付比較のため、両日付を深夜0時に正規化
  const todayMidnight = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate(),
  );
  const expiryMidnight = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate(),
  );

  const diffMs = expiryMidnight.getTime() - todayMidnight.getTime();
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { urgency: 'expired', daysRemaining, label: '期限切れ' };
  } else if (daysRemaining <= 30) {
    return { urgency: 'critical', daysRemaining, label: `残り${daysRemaining}日` };
  } else if (daysRemaining <= 60) {
    return { urgency: 'warning', daysRemaining, label: `残り${daysRemaining}日` };
  } else {
    return { urgency: 'safe', daysRemaining, label: `残り${daysRemaining}日` };
  }
}

/**
 * モニタリング実施状況を判定する
 *
 * @param visitDates - 訪問日の文字列配列（YYYY-MM-DD）
 * @param today - 基準日（省略時: 今日）
 */
export function getMonitoringStatus(visitDates: string[], today?: Date): MonitoringStatus {
  const todayDate = today ?? new Date();
  const currentYear = todayDate.getFullYear();
  const currentMonth = todayDate.getMonth();

  if (!visitDates || visitDates.length === 0) {
    return {
      isCurrentMonthDone: false,
      lastVisitDate: null,
      daysSinceLastVisit: null,
    };
  }

  // 降順ソート
  const sortedDates = [...visitDates].sort((a, b) => b.localeCompare(a));
  const lastVisitDate = sortedDates[0];

  // 当月に訪問があるか確認
  const isCurrentMonthDone = visitDates.some((dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // 前回訪問からの日数
  const lastVisit = new Date(lastVisitDate + 'T00:00:00');
  const todayMidnight = new Date(currentYear, currentMonth, todayDate.getDate());
  const lastVisitMidnight = new Date(
    lastVisit.getFullYear(),
    lastVisit.getMonth(),
    lastVisit.getDate(),
  );
  const diffMs = todayMidnight.getTime() - lastVisitMidnight.getTime();
  const daysSinceLastVisit = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    isCurrentMonthDone,
    lastVisitDate,
    daysSinceLastVisit,
  };
}

/**
 * urgency ごとのスタイル定義
 * badge: バッジ全体のクラス（背景・テキスト・ボーダー）
 * text: テキストのみのクラス
 */
export const deadlineUrgencyStyles: Record<DeadlineUrgency, { badge: string; text: string }> = {
  expired: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    text: 'text-red-700',
  },
  critical: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    text: 'text-red-700',
  },
  warning: {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    text: 'text-yellow-700',
  },
  safe: {
    badge: 'bg-green-100 text-green-800 border-green-200',
    text: 'text-green-700',
  },
  unknown: {
    badge: '',
    text: '',
  },
};
