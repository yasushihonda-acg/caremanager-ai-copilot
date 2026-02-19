import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { listMonitoringRecords } from '../../services/firebase';
import { getMonitoringStatus } from '../../utils/deadlineAlerts';

interface MonitoringMonthlyStatusProps {
  userId: string;
  clientId: string;
}

/**
 * 今月のモニタリング実施状況バナー
 *
 * 法定義務: 指定居宅介護支援等の事業の人員及び運営に関する基準 第13条18号
 * （モニタリング月1回訪問）
 *
 * N+1回避: ClientListView では表示せず、個別利用者のモニタリングタブ内でのみ表示。
 */
export const MonitoringMonthlyStatus: React.FC<MonitoringMonthlyStatusProps> = ({
  userId,
  clientId,
}) => {
  const [status, setStatus] = useState<ReturnType<typeof getMonitoringStatus> | null>(null);

  useEffect(() => {
    let cancelled = false;

    listMonitoringRecords(userId, clientId, 5)
      .then((records) => {
        if (cancelled) return;
        const visitDates = records.map((r) =>
          r.visitDate.toDate().toISOString().split('T')[0],
        );
        setStatus(getMonitoringStatus(visitDates));
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, clientId]);

  if (status === null) return null;

  const today = new Date();
  const monthLabel = `${today.getMonth() + 1}月`;

  if (status.isCurrentMonthDone && status.lastVisitDate) {
    const d = new Date(status.lastVisitDate + 'T00:00:00');
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
    return (
      <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        <span>
          {monthLabel}のモニタリング: <strong>実施済み</strong>（{dateLabel}）
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>
        {monthLabel}のモニタリング: <strong>未実施</strong>
      </span>
    </div>
  );
};
