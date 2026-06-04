import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../utils/roles';
import { api } from '../utils/api';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user || isStaff(user.role)) return;
    api('/profile')
      .then((p) => setStreak(p?.stats?.streak ?? 0))
      .catch(() => {});
  }, [user]);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`nav-link ${isActive(to) ? 'nav-link-active' : ''}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen">
      <nav
        className="app-nav sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{ background: 'var(--nav-bg)' }}
      >
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="nav-brand">
              <Logo to={isStaff(user?.role) ? '/admin' : '/dashboard'} variant="nav" />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {isStaff(user?.role) ? (
                <>
                  {navLink('/dashboard', 'Dashboard')}
                  {navLink('/admin', 'Cards')}
                  {navLink('/admin/subjects', 'Subjects')}
                  {navLink('/admin/users', 'Users')}
                  {navLink('/account', 'Account')}
                </>
              ) : (
                <>
                  {navLink('/dashboard', 'Dashboard')}
                  <Link
                    to="/profile"
                    className={`nav-link flex items-center gap-1.5 ${isActive('/profile') ? 'nav-link-active' : ''}`}
                  >
                    Profile
                    {streak > 0 && (
                      <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {streak}
                      </span>
                    )}
                  </Link>
                  {navLink('/account', 'Account')}
                </>
              )}
              <span className="hidden rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] sm:inline">
                {user?.name}
              </span>
              <ThemeToggle />
              <button type="button" onClick={handleLogout} className="btn-secondary py-2 text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8 page-enter">{children}</main>
    </div>
  );
}
