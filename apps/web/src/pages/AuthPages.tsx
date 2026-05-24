import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { login, register } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../components/useTheme';
import { IconMoon, IconSun } from '../components/icons';

function AuthThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="btn btn--ghost btn--icon"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{ position: 'absolute', top: '1rem', right: '1rem' }}
    >
      {theme === 'light' ? <IconMoon /> : <IconSun />}
    </button>
  );
}

function AuthHero() {
  return (
    <aside className="auth-hero">
      <div className="auth-hero__brand">
        <span className="auth-hero__logo" aria-hidden="true">
          N
        </span>
        <span className="auth-hero__name">Notes App</span>
      </div>

      <div>
        <h1 className="auth-hero__headline">Notes, forms & events in one place</h1>
        <p className="auth-hero__text">
          A fullstack pet-project for learning DevOps — NestJS, Kafka, Postgres and a clean React UI.
        </p>
        <ul className="auth-hero__features">
          <li className="auth-hero__feature">
            <span className="auth-hero__dot" />
            CRUD notes with Kafka audit trail
          </li>
          <li className="auth-hero__feature">
            <span className="auth-hero__dot" />
            Dynamic forms & submissions
          </li>
          <li className="auth-hero__feature">
            <span className="auth-hero__dot" />
            Real-time events from consumer
          </li>
        </ul>
      </div>

      <p style={{ fontSize: '0.8125rem', opacity: 0.5 }}>
        Open source · Built for learning
      </p>
    </aside>
  );
}

export function LoginPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { accessToken } = await login(email, password);
      setToken(accessToken);
      navigate('/notes');
    } catch (err) {
      if (!axios.isAxiosError(err) || !err.response) {
        setError('API недоступен. Запусти: npm run dev (нужен порт 3000)');
        return;
      }
      setError('Invalid credentials');
    }
  }

  return (
    <div className="auth-split">
      <AuthHero />
      <div className="auth-panel" style={{ position: 'relative' }}>
        <AuthThemeToggle />
        <div className="auth-form-wrap">
          <h1>Welcome back</h1>
          <p className="auth-form-wrap__subtitle">Sign in to your workspace</p>

          <div className="card card--flat">
            <p className="auth-hint">Dev credentials: admin / admin</p>

            <form onSubmit={onSubmit}>
              <div className="field">
                <label className="field__label" htmlFor="login-email">
                  Email or login
                </label>
                <input
                  id="login-email"
                  className="field__input"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  className="field__input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <div className="alert alert--error">{error}</div>}

              <button type="submit" className="btn btn--primary btn--block">
                Sign in
              </button>
            </form>

            <p className="auth-form-wrap__footer">
              No account? <Link to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { accessToken } = await register(email, password);
      setToken(accessToken);
      navigate('/notes');
    } catch {
      setError('Registration failed. Email may already be in use.');
    }
  }

  return (
    <div className="auth-split">
      <AuthHero />
      <div className="auth-panel" style={{ position: 'relative' }}>
        <AuthThemeToggle />
        <div className="auth-form-wrap">
          <h1>Create account</h1>
          <p className="auth-form-wrap__subtitle">Start taking notes in seconds</p>

          <div className="card card--flat">
            <form onSubmit={onSubmit}>
              <div className="field">
                <label className="field__label" htmlFor="register-email">
                  Email
                </label>
                <input
                  id="register-email"
                  className="field__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="register-password">
                  Password
                </label>
                <input
                  id="register-password"
                  className="field__input"
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="alert alert--error">{error}</div>}

              <button type="submit" className="btn btn--primary btn--block">
                Create account
              </button>
            </form>

            <p className="auth-form-wrap__footer">
              Have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
