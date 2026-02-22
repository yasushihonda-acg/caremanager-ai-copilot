import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Loader2, Users, AlertCircle, Check, Mail } from 'lucide-react';
import { listAllowedEmailsFn, manageAllowedEmailFn } from '../../services/firebase';
import type { AllowedEmailEntry } from '../../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WhitelistManagement: React.FC<Props> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<AllowedEmailEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listAllowedEmailsFn();
      setEmails(result.data.emails);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '一覧取得に失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadEmails();
      setMessage(null);
      setNewEmail('');
      setNewNote('');
    }
  }, [isOpen, loadEmails]);

  // メッセージの自動消去
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail) return;

    setIsAdding(true);
    setMessage(null);
    try {
      const result = await manageAllowedEmailFn({
        action: 'add',
        email: trimmedEmail,
        note: newNote.trim() || undefined,
      });
      setMessage({ type: 'success', text: result.data.message });
      setNewEmail('');
      setNewNote('');
      await loadEmails();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '追加に失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(`${email} をアクセス許可リストから削除しますか？\nこのユーザーはログインできなくなります。`)) return;

    setDeletingEmail(email);
    setMessage(null);
    try {
      const result = await manageAllowedEmailFn({ action: 'remove', email });
      setMessage({ type: 'success', text: result.data.message });
      await loadEmails();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '削除に失敗しました';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setDeletingEmail(null);
    }
  };

  const formatDate = (ts?: { _seconds: number; _nanoseconds: number }) => {
    if (!ts) return '-';
    return new Date(ts._seconds * 1000).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            ユーザー管理
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Add Form */}
        <div className="px-6 py-4 border-b border-stone-100">
          <h3 className="text-sm font-bold text-stone-500 uppercase mb-3">ユーザー追加</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  placeholder="メールアドレス"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <input
                type="text"
                placeholder="メモ（任意）"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-32 sm:w-40 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={isAdding || !newEmail.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              追加
            </button>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h3 className="text-sm font-bold text-stone-500 uppercase mb-3">
            許可ユーザー一覧（{emails.length}件）
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">
              許可されたユーザーはいません
            </div>
          ) : (
            <div className="space-y-2">
              {emails.map((entry) => (
                <div
                  key={entry.email}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100 hover:bg-stone-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{entry.email}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {entry.addedBy && (
                        <span className="text-xs text-stone-400">追加: {entry.addedBy}</span>
                      )}
                      <span className="text-xs text-stone-400">{formatDate(entry.createdAt)}</span>
                      {entry.note && (
                        <span className="text-xs text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">
                          {entry.note}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(entry.email)}
                    disabled={deletingEmail === entry.email}
                    className="flex-shrink-0 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingEmail === entry.email ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 text-xs text-stone-400 text-center">
          許可リストに登録されたGoogleアカウントのみログインできます
        </div>
      </div>
    </div>
  );
};
