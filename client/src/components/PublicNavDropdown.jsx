import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isPublicDropdownActive } from '../config/publicNav';

export default function PublicNavDropdown({ label, items, align = 'left' }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  const active = isPublicDropdownActive(location.pathname, items);
  const menuAlign = align === 'right' ? 'right-0' : 'left-0';

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

  const itemClass = (isActive) =>
    `admin-nav-dropdown-item block rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-colors ${
      isActive
        ? 'bg-[var(--accent-glow)] text-[var(--accent)]'
        : 'text-[var(--text)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]'
    }`;

  const close = () => setOpen(false);

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
          className={`admin-nav-dropdown-menu glass-card absolute ${menuAlign} top-[calc(100%+0.35rem)] z-[60] min-w-[12.5rem] rounded-xl border p-1.5 shadow-lg`}
        >
          {items.map((item) => {
            const isActive = item.to
              ? item.exact
                ? location.pathname === item.to
                : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
              : false;
            const className = itemClass(isActive);

            return item.to ? (
              <Link
                key={item.to + item.label}
                to={item.to}
                role="menuitem"
                className={className}
                onClick={close}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href + item.label}
                href={item.href}
                role="menuitem"
                className={className}
                {...(item.download ? { download: true } : {})}
                onClick={close}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
