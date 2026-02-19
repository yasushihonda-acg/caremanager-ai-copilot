import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

type FeedbackCategory = 'バグ報告' | '改善要望' | 'その他';

const categories: FeedbackCategory[] = ['バグ報告', '改善要望', 'その他'];

export function FeedbackFAB() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!category || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        category,
        content: content.trim(),
        timestamp: Timestamp.now(),
        currentPage: window.location.pathname,
      });
      setIsOpen(false);
      setCategory(null);
      setContent('');
      setToast(true);
      setTimeout(() => setToast(false), 2000);
    } catch (err) {
      console.error('[FeedbackFAB] 送信エラー:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[70] bg-amber-500 hover:bg-amber-600 text-white rounded-full p-4 shadow-lg transition-all"
        aria-label="フィードバックを送信"
      >
        <span className="text-xl" role="img" aria-label="フィードバック">💬</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-stone-800">フィードバック</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xl"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>

            {/* Category Selection */}
            <div className="flex gap-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    category === cat
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Text Area */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ご意見・ご要望をお書きください..."
              className="w-full h-32 p-3 border border-stone-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!category || !content.trim() || isSubmitting}
              className="w-full mt-4 py-2.5 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '送信中...' : '送信'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 right-6 z-[90] bg-stone-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          フィードバックを送信しました
        </div>
      )}
    </>
  );
}
