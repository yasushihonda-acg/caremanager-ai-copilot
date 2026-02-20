import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, signInAsTestUser, signInAsDemo, isEmulator, checkEmailAllowed, DEMO_USER_UID } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isDemoUser: boolean;
  login: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // デモユーザーはallowed_emailsチェックをスキップ
          if (firebaseUser.uid === DEMO_USER_UID) {
            setUser(firebaseUser);
            setLoading(false);
            return;
          }
          const allowed = await checkEmailAllowed(firebaseUser.email);
          if (allowed) {
            setUser(firebaseUser);
          } else {
            await signOutUser();
            setError('このメールアドレスはアクセスが許可されていません。管理者にお問い合わせください。');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        // 許可チェック失敗時は安全のためサインアウト
        await signOutUser().catch(() => {});
        setError('アクセス確認中にエラーが発生しました。再度ログインしてください。');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Emulator時は自動ログイン
  useEffect(() => {
    if (isEmulator && !user && !loading) {
      signInAsTestUser();
    }
  }, [user, loading]);

  const isDemoUser = user?.uid === DEMO_USER_UID;

  const login = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle(); // リダイレクト開始（成功時はページ遷移するのでfinallyは実行されない）
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(message);
      setLoading(false);
    }
  };

  const loginAsDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInAsDemo();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'デモログインに失敗しました';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOutUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ログアウトに失敗しました';
      setError(message);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, isDemoUser, login, loginAsDemo, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
