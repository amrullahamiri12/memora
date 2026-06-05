import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PUBLIC_HEADER_DROPDOWNS,
  PUBLIC_HEADER_GUEST_CTAS,
  PUBLIC_HEADER_LINKS,
} from '../config/publicNav';
import Logo from './Logo';
import PublicNavDropdown from './PublicNavDropdown';
import PublicUserMenu from './PublicUserMenu';
import ThemeToggle from './ThemeToggle';

function HeaderLink({ to, label, onNavigate, className = '' }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`nav-link ${active ? 'nav-link-active' : ''} ${className}`.trim()}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ item, onNavigate }) {
  if (item.to) {
    return (
      <Link
        to={item.to}
        onClick={onNavigate}
        className="block rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium text-[var(--text)] hover:bg-[var(--surface-hover)]"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <a
      href={item.href}
      onClick={onNavigate}
      className="block rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium text-[var(--text)] hover:bg-[var(--surface-hover)]"
      {...(item.download ? { download: true } : {})}
    >
      {item.label}
    </a>
  );
}

export default function PublicNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className="app-nav border-b backdrop-blur-xl"
      style={{ background: 'var(--nav-bg)' }}
    >
      <div className="app-nav-inner mx-auto flex max-w-6xl items-center justify-between gap-4 px-4">
        <div className="nav-brand">
          <Logo to={user ? '/home' : '/'} variant="nav" />
        </div>

        <nav
          className="public-nav-desktop hidden flex-wrap items-center justify-end gap-2 lg:flex lg:gap-3"
          aria-label="Main"
        >
          {PUBLIC_HEADER_LINKS.map((link) => (
            <HeaderLink key={link.to} to={link.to} label={link.label} />
          ))}
          {PUBLIC_HEADER_DROPDOWNS.map((group) => (
            <PublicNavDropdown key={group.id} label={group.label} items={group.items} />
          ))}
          <ThemeToggle />
          {user ? (
            <PublicUserMenu />
          ) : (
            <>
              {PUBLIC_HEADER_GUEST_CTAS.map((cta) =>
                cta.variant === 'primary' ? (
                  <Link
                    key={cta.to}
                    to={cta.to}
                    className="btn-primary shrink-0 px-4 py-2.5 text-[0.9375rem]"
                  >
                    {cta.label}
                  </Link>
                ) : (
                  <Link
                    key={cta.to}
                    to={cta.to}
                    className={`nav-link-accent ${location.pathname === cta.to ? 'nav-link-active' : ''}`}
                  >
                    {cta.label}
                  </Link>
                )
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          {user ? <PublicUserMenu /> : null}
          <button
            type="button"
            className="public-nav-menu-btn inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-heading)]"
            aria-expanded={mobileOpen}
            aria-controls="public-nav-mobile-panel"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="public-nav-mobile-panel"
          className="public-nav-mobile fixed inset-0 z-[55] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <div className="public-nav-mobile-panel absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-[var(--border)] bg-[var(--surface-solid)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--text-heading)]">Menu</span>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--accent)]"
                onClick={closeMobile}
              >
                Close
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
              <div className="space-y-1">
                {PUBLIC_HEADER_LINKS.map((link) => (
                  <MobileNavLink key={link.to} item={link} onNavigate={closeMobile} />
                ))}
              </div>

              {PUBLIC_HEADER_DROPDOWNS.map((group) => (
                <div key={group.id} className="mt-6">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-label)]">
                    {group.label}
                  </p>
                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => (
                      <MobileNavLink
                        key={item.to || item.href}
                        item={item}
                        onNavigate={closeMobile}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {!user && (
              <div className="border-t border-[var(--border)] p-4 space-y-2">
                <Link to="/register" className="btn-primary block w-full text-center" onClick={closeMobile}>
                  Get started
                </Link>
                <Link
                  to="/login"
                  className="nav-link-accent block w-full text-center py-2"
                  onClick={closeMobile}
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
