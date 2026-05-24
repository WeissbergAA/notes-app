import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getMe } from '../api/client';

interface AuthContextValue {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    localStorage.getItem('token'),
  );

  const setToken = (value: string | null) => {
    if (value) {
      localStorage.setItem('token', value);
    } else {
      localStorage.removeItem('token');
    }
    setTokenState(value);
  };

  const value = useMemo(
    () => ({
      token,
      setToken,
      logout: () => setToken(null),
    }),
    [token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function useRequireAuth() {
  const { token } = useAuth();
  return Boolean(token);
}

export async function validateSession(token: string | null) {
  if (!token) {
    return false;
  }
  try {
    await getMe();
    return true;
  } catch {
    return false;
  }
}
