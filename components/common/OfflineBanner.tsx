import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

/**
 * オフライン時に画面上部に表示するバナー。
 * useNetworkStatus フックを介してネットワーク状態を監視する（DRY）。
 */
export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs md:text-sm flex items-center justify-center gap-2 text-center sticky top-0 z-[70]">
      <WifiOff size={14} className="shrink-0" />
      <span>
        オフラインです。接続が回復するまで、保存済みのデータは閲覧できます。
      </span>
    </div>
  );
}
