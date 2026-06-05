import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaff, isSuperAdmin } from '../utils/roles';
import { useStudentPreview } from '../hooks/useStudentPreview';
import {
  disableStudentView,
  enableStudentView,
  withPreviewQuery,
} from '../utils/studentView';
import { api } from '../utils/api';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import AdminNavDropdown from './admin/AdminNavDropdown';
import AdminSubNav from './admin/AdminSubNav';
import {
  ADMIN_HEADER_NAV,
  isAdminPath,
  isNavItemActive,
} from '../config/adminNav';

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

  const handleLogout = async () => {
    disableStudentView();
    await logout();
    navigate('/login');
  };

  const enterStudentPreview = () => {
    enableStudentView();
    navigate(withPreviewQuery('/dashboard'));
  };

  const exitStudentPreview = () => {
    disableStudentView();
    navigate('/admin/dashboard');
  };

  const isActive = (path) => {
    if (path.startsWith('/admin')) {
      return isNavItemActive(location.pathname, path, path === '/admin/dashboard');
    }
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const navLink = (to, label, exact = false) => (
    <Link
      to={to}
      className={`nav-link ${isNavItemActive(location.pathname, to, exact) ? 'nav-link-active' : ''}`}
    >
      {label}
    </Link>
  );

  const showAdminSubNav = staff && !studentView && isAdminPath(location.pathname);

  const logoTo = staff && !studentView ? '/admin/dashboard' : studentPath('/dashboard');

  return (
    <div className="min-h-screen">
      <nav
        className="app-nav border-b backdrop-blur-xl"
        style={{ background: 'var(--nav-bg)' }}
      >
        <div className="app-nav-inner mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="nav-brand">
              <Logo to={logoTo} variant="nav" />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {staff && !studentView ? (
                <>
                  {navLink('/home', 'Home', true)}
                  {ADMIN_HEADER_NAV.map((item) =>
                    item.type === 'group' ? (
                      <AdminNavDropdown
                        key={item.sectionId}
                        label={item.label}
                        sectionId={item.sectionId}
                      />
                    ) : (
                      navLink(item.to, item.label, item.exact)
                    )
                  )}
                  {isSuperAdmin(user?.role) && navLink('/admin/audit', 'Audit log')}
                  {navLink('/account', 'Account')}
                  <button
                    type="button"
                    onClick={enterStudentPreview}
                    className="nav-link text-[var(--accent)]"
                  >
                    Learner view
                  </button>
                </>
              ) : staff && studentView ? (
                <>
                  {navLink('/home', 'Home', true)}
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
                    Exit learner view
                  </button>
                </>
              ) : (
                <>
                  {navLink('/home', 'Home', true)}
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
              <span className="hidden rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] sm:inline">
                {user?.name}
                {inStudentPreview && (
                  <span className="ml-1.5 text-[var(--accent)]">· Learner view</span>
                )}
              </span>
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary g_id_signout px-4 py-2.5 text-[0.9375rem]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      {showAdminSubNav && <AdminSubNav />}
      {inStudentPreview && (
        <div
          className="border-b border-[var(--accent)]/25 bg-[var(--accent-glow)] px-4 py-2 text-center text-sm text-[var(--text-heading)]"
          role="status"
        >
          Learner view — progress saves to your admin account.
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8 page-enter">{children}</main>
    </div>
  );
}
