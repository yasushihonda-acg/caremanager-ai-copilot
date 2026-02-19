import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, signInAsTestUser, isEmulator, checkEmailAllowed } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
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

  const login = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ログインに失敗しました';
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
    <AuthContext.Provider value={{ user, loading, error, login, logout, clearError }}>
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
