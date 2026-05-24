import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { useTheme } from './useTheme';
import {
  IconEvents,
  IconForms,
  IconLogout,
  IconMoon,
  IconNotes,
  IconSun,
} from './icons';

const navItems = [
  { to: '/notes', label: 'Notes', Icon: IconNotes },
  { to: '/forms', label: 'Forms', Icon: IconForms },
  { to: '/events', label: 'Events', Icon: IconEvents },
] as const;

function userInitial(email?: string) {
  if (!email) {
    return '?';
  }
  return email.charAt(0).toUpperCase();
}

export function Layout() {
  const { logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const userQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: Boolean(token),
  });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/notes" className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden="true">
            N
          </span>
          <span className="sidebar__name">Notes App</span>
        </NavLink>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link--active' : ''}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user-row">
            <span className="sidebar__avatar" aria-hidden="true">
              {userInitial(userQuery.data?.email)}
            </span>
            {userQuery.data?.email && (
              <p className="sidebar__user" title={userQuery.data.email}>
                {userQuery.data.email}
              </p>
            )}
          </div>
          <div className="sidebar__actions">
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? <IconMoon /> : <IconSun />}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
