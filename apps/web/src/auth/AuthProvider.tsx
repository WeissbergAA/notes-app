import { useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from './auth-context';

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
