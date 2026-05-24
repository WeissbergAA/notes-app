import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { logout, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout">
      <header>
        <nav>
          <Link to="/notes">Notes</Link>
          <Link to="/forms">Forms</Link>
          <button onClick={logout}>Logout</button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
