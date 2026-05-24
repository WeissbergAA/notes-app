import { useContext } from 'react';
import { getMe } from '../api/client';
import { AuthContext } from './auth-context';

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
