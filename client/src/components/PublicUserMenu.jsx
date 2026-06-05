import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudentPreview } from '../hooks/useStudentPreview';
import { getAppHomePath } from '../utils/appHome';
import { isStaff } from '../utils/roles';
import {
  disableStudentView,
  enableStudentView,
  withPreviewQuery,
} from '../utils/studentView';

function MenuChevron({ open }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function isMenuLinkActive(pathname, to) {
  const path = to.split('?')[0];
  return pathname === path;
}

function menuItemClass(active) {
  return `admin-nav-dropdown-item block w-full rounded-lg px-3 py-2 text-left text-[0.9375rem] font-medium transition-colors ${
    active
      ? 'bg-[var(--accent-glow)] text-[var(--accent)]'
      : 'text-[var(--text)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]'
  }`;
}

export default function PublicUserMenu() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const studentPreview = useStudentPreview();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  const staff = isStaff(user?.role);
  const inStudentPreview = staff && studentPreview;

  const appHomePath = getAppHomePath(user, inStudentPreview);
  const appHomeLabel = staff && !inStudentPreview ? 'Admin' : 'Dashboard';

  const linkItems = useMemo(() => {
    if (!user) return [];

    const items = [{ type: 'link', to: appHomePath, label: appHomeLabel }];

    if (!staff || inStudentPreview) {
      const profilePath = inStudentPreview ? withPreviewQuery('/profile') : '/profile';
      items.push({ type: 'link', to: profilePath, label: 'Profile' });
    }

    items.push({ type: 'link', to: '/account', label: 'Account' });

    return items;
  }, [user, staff, inStudentPreview, appHomePath, appHomeLabel]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setOpen(false);
    disableStudentView();
    await logout();
    navigate('/login');
  };

  const enterStudentPreview = () => {
    setOpen(false);
    enableStudentView();
    navigate(withPreviewQuery('/dashboard'));
  };

  if (!user) return null;

  return (
    <div ref={rootRef} className="public-user-menu relative">
      <button
        type="button"
        className="public-user-menu-trigger inline-flex max-w-[12rem] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] sm:max-w-[14rem]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate">{user.name}</span>
        <MenuChevron open={open} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="admin-nav-dropdown-menu glass-card absolute right-0 top-[calc(100%+0.35rem)] z-[60] min-w-[12.5rem] rounded-xl border p-1.5 shadow-lg"
        >
          {linkItems.map((item) => {
            const active = isMenuLinkActive(location.pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                className={menuItemClass(active)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}

          {staff && !inStudentPreview && (
            <button
              type="button"
              role="menuitem"
              className={menuItemClass(false)}
              onClick={enterStudentPreview}
            >
              Learner view
            </button>
          )}

          <div
            className="my-1.5 border-t border-[var(--border)]"
            role="separator"
            aria-hidden
          />

          <button
            type="button"
            role="menuitem"
            className={`${menuItemClass(false)} g_id_signout`}
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
