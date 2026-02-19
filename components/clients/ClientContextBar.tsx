import React from 'react';
import { ArrowLeft, Pencil, AlertCircle, Clock } from 'lucide-react';
import type { Client } from '../../types';
import { getCertificationDeadlineStatus, deadlineUrgencyStyles } from '../../utils/deadlineAlerts';

interface ClientContextBarProps {
  client: Client;
  onBack: () => void;
  onEdit: () => void;
}

export const ClientContextBar: React.FC<ClientContextBarProps> = ({
  client,
  onBack,
  onEdit,
}) => {
  return (
    <div className="bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-stone-600 hover:text-blue-600 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">一覧</span>
          </button>
          <div className="h-5 w-px bg-stone-200 flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-stone-800 truncate">{client.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
              {client.careLevel}
            </span>
            {client.medicalAlerts.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100 flex-shrink-0">
                <AlertCircle className="w-3 h-3" />
                {client.medicalAlerts.length}
              </span>
            )}
            {(() => {
              const certStatus = getCertificationDeadlineStatus(client.certificationExpiry);
              if (certStatus.urgency === 'safe' || certStatus.urgency === 'unknown') return null;
              const styles = deadlineUrgencyStyles[certStatus.urgency];
              return (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${styles.badge} flex-shrink-0`}>
                  <Clock className="w-3 h-3" />
                  {certStatus.label}
                </span>
              );
            })()}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
          title="利用者情報を編集"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ClientContextBar;
