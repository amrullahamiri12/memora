import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ADMIN_SECTIONS,
  isHeaderGroupActive,
  isNavItemActive,
} from '../../config/adminNav';

export default function AdminNavDropdown({ label, sectionId }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  const section = ADMIN_SECTIONS.find((s) => s.id === sectionId);
  const active = isHeaderGroupActive(location.pathname, sectionId);

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

  if (!section) return null;

  return (
    <div ref={rootRef} className="admin-nav-dropdown relative">
      <button
        type="button"
        className={`nav-link admin-nav-dropdown-trigger inline-flex items-center gap-1 ${active ? 'nav-link-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label}
        <svg
          className={`h-4 w-4 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
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
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="admin-nav-dropdown-menu glass-card absolute left-0 top-[calc(100%+0.35rem)] z-[60] min-w-[12.5rem] rounded-xl border p-1.5 shadow-lg"
        >
          {section.items.map((item) => {
            const itemActive = isNavItemActive(
              location.pathname,
              item.to,
              item.exact
            );
            return (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                className={`admin-nav-dropdown-item block rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-colors ${
                  itemActive
                    ? 'bg-[var(--accent-glow)] text-[var(--accent)]'
                    : 'text-[var(--text)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]'
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
