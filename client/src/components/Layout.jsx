import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../utils/roles';
import { useStudentPreview } from '../hooks/useStudentPreview';
import {
  disableStudentView,
  enableStudentView,
  withPreviewQuery,
} from '../utils/studentView';
import { api } from '../utils/api';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [streak, setStreak] = useState(0);
  const studentView = useStudentPreview();
  const navigate = useNavigate();
  const location = useLocation();
  const staff = isStaff(user?.role);
  const inStudentPreview = staff && studentView;

  const studentPath = (path) => (inStudentPreview ? withPreviewQuery(path) : path);

  useEffect(() => {
    if (!user || staff) return;
    api('/profile')
      .then((p) => setStreak(p?.stats?.streak ?? 0))
      .catch(() => {});
  }, [user, staff]);

  const handleLogout = () => {
    disableStudentView();
    logout();
    navigate('/login');
  };

  const enterStudentPreview = () => {
    enableStudentView();
    navigate(withPreviewQuery('/dashboard'));
  };

  const exitStudentPreview = () => {
    disableStudentView();
    navigate('/admin');
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

  const logoTo = staff && !studentView ? '/admin' : studentPath('/dashboard');

  return (
    <div className="min-h-screen">
      <nav
        className="app-nav sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{ background: 'var(--nav-bg)' }}
      >
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="nav-brand">
              <Logo to={logoTo} variant="nav" />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {staff && !studentView ? (
                <>
                  {navLink('/admin', 'Cards')}
                  {navLink('/admin/subjects', 'Subjects')}
                  {navLink('/admin/users', 'Users')}
                  {navLink('/account', 'Account')}
                  <button
                    type="button"
                    onClick={enterStudentPreview}
                    className="nav-link text-[var(--accent)]"
                  >
                    Preview as student
                  </button>
                </>
              ) : staff && studentView ? (
                <>
                  <Link
                    to={studentPath('/dashboard')}
                    className={`nav-link ${isActive('/dashboard') ? 'nav-link-active' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to={studentPath('/profile')}
                    className={`nav-link flex items-center gap-1.5 ${isActive('/profile') ? 'nav-link-active' : ''}`}
                  >
                    Profile
                  </Link>
                  {navLink('/account', 'Account')}
                  <button
                    type="button"
                    onClick={exitStudentPreview}
                    className="nav-link font-medium text-[var(--accent-deep)]"
                  >
                    Exit preview
                  </button>
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
                {inStudentPreview && (
                  <span className="ml-1.5 text-[var(--accent)]">· preview</span>
                )}
              </span>
              <ThemeToggle />
              <button type="button" onClick={handleLogout} className="btn-secondary py-2 text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      {inStudentPreview && (
        <div
          className="border-b border-[var(--accent)]/25 bg-[var(--accent-glow)] px-4 py-2 text-center text-sm text-[var(--text-heading)]"
          role="status"
        >
          Student preview — you are viewing the app as a learner. Progress saves to your admin account.
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8 page-enter">{children}</main>
    </div>
  );
}
