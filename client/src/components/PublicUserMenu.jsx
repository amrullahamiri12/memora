import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePublicUserActions } from '../hooks/usePublicUserActions';

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
  return `admin-nav-dropdown-item block w-full rounded-lg px-3 py-2.5 text-left text-[0.9375rem] font-medium transition-colors ${
    active
      ? 'bg-[var(--accent-glow)] text-[var(--accent)]'
      : 'text-[var(--text)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]'
  }`;
}

/** Desktop / tablet-wide only — account menu in the header bar. */
export default function PublicUserMenu() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  const {
    user,
    menuLinks,
    handleLogout,
    enterStudentPreview,
    showLearnerView,
  } = usePublicUserActions();

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

  if (!user) return null;

  return (
    <div ref={rootRef} className="public-user-menu relative hidden xl:block">
      <button
        type="button"
        className="public-user-menu-trigger inline-flex max-w-[10rem] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] 2xl:max-w-[14rem]"
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
          {menuLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              className={menuItemClass(isMenuLinkActive(location.pathname, item.to))}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {showLearnerView && (
            <button
              type="button"
              role="menuitem"
              className={menuItemClass(false)}
              onClick={() => {
                setOpen(false);
                enterStudentPreview();
              }}
            >
              Learner view
            </button>
          )}

          <div className="my-1.5 border-t border-[var(--border)]" role="separator" aria-hidden />

          <button
            type="button"
            role="menuitem"
            className={`${menuItemClass(false)} g_id_signout`}
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
