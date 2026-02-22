import React, { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import type { CareManagerProfileData } from '../../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: CareManagerProfileData;
  onSave: (data: CareManagerProfileData) => Promise<void>;
}

export const CareManagerSettingsModal: React.FC<Props> = ({ isOpen, onClose, initialData, onSave }) => {
  const [form, setForm] = useState<CareManagerProfileData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // モーダルが開くたびに最新の initialData を反映（非同期ロード後の更新対応）
  useEffect(() => {
    if (isOpen) setForm(initialData);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await onSave(form);
      setMessage({ type: 'success', text: '保存しました' });
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1000);
    } catch {
      setMessage({ type: 'error', text: '保存できませんでした。しばらくしてからもう一度お試しください。' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            ケアマネ情報設定
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-stone-500">
            入力した情報は印刷プレビュー・入院時連携シートに使用されます。
          </p>
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-1">担当介護支援専門員名</label>
            <input
              type="text"
              className="w-full p-2 border border-stone-300 rounded-lg text-stone-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例：介護 太郎"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-1">居宅介護支援事業所名</label>
            <input
              type="text"
              className="w-full p-2 border border-stone-300 rounded-lg text-stone-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例：○○居宅介護支援事業所"
              value={form.office}
              onChange={e => setForm(prev => ({ ...prev, office: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-1">電話番号</label>
            <input
              type="tel"
              className="w-full p-2 border border-stone-300 rounded-lg text-stone-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例：03-0000-0000"
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-500 block mb-1">FAX番号</label>
            <input
              type="tel"
              className="w-full p-2 border border-stone-300 rounded-lg text-stone-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例：03-0000-0001"
              value={form.fax}
              onChange={e => setForm(prev => ({ ...prev, fax: e.target.value }))}
            />
          </div>

          {message && (
            <div className={`p-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-stone-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
