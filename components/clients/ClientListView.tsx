import React, { useState } from 'react';
import { Search, Plus, UserPlus, Users, Clock } from 'lucide-react';
import { useClient } from '../../contexts/ClientContext';
import type { Client } from '../../types';
import { getCertificationDeadlineStatus, deadlineUrgencyStyles } from '../../utils/deadlineAlerts';

const careLevelColors: Record<string, string> = {
  '要支援1': 'bg-green-100 text-green-800',
  '要支援2': 'bg-green-100 text-green-800',
  '要介護1': 'bg-yellow-100 text-yellow-800',
  '要介護2': 'bg-orange-100 text-orange-800',
  '要介護3': 'bg-orange-100 text-orange-800',
  '要介護4': 'bg-red-100 text-red-800',
  '要介護5': 'bg-red-100 text-red-800',
};

interface ClientListViewProps {
  onNewClient: () => void;
  onEditClient: (client: Client) => void;
}

export const ClientListView: React.FC<ClientListViewProps> = ({ onNewClient, onEditClient }) => {
  const { clients, loadingClients, clientError, selectClient, refreshClients } = useClient();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter((client) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      client.kana.toLowerCase().includes(q)
    );
  });

  if (loadingClients) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-stone-600">利用者一覧を読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clientError && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center justify-between">
          <span>{clientError}</span>
          <button
            onClick={refreshClients}
            className="ml-3 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded transition-colors"
          >
            再読み込み
          </button>
        </div>
      )}
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Users className="w-5 h-5" />
            利用者一覧
          </h2>
          <p className="text-sm text-stone-500">
            {clients.length}名の利用者
          </p>
        </div>
        <button
          onClick={onNewClient}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          新規登録
        </button>
      </div>

      {/* 検索 */}
      {clients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="名前・フリガナで検索..."
            className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* 利用者一覧 */}
      {clients.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-bold text-stone-700 mb-2">最初の利用者を登録しましょう</h3>
          <p className="text-sm text-stone-500 mb-6">
            利用者を登録すると、アセスメントやケアプラン作成ができるようになります。
          </p>
          <button
            onClick={onNewClient}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            利用者を登録する
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-8 text-stone-500">
          <p className="text-sm">「{searchQuery}」に一致する利用者が見つかりません</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => selectClient(client.id)}
              className="w-full text-left bg-white border border-stone-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-stone-800 truncate">{client.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${careLevelColors[client.careLevel] || 'bg-stone-100 text-stone-700'}`}>
                      {client.careLevel}
                    </span>
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
                  <p className="text-sm text-stone-500">{client.kana}</p>
                  {client.medicalAlerts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {client.medicalAlerts.slice(0, 3).map((alert, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100"
                        >
                          {alert}
                        </span>
                      ))}
                      {client.medicalAlerts.length > 3 && (
                        <span className="text-xs text-stone-400">
                          他{client.medicalAlerts.length - 3}件
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClient(client);
                    }}
                    className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all text-xs"
                  >
                    編集
                  </button>
                  <svg className="w-5 h-5 text-stone-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientListView;
