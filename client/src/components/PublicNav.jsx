import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PUBLIC_HEADER_DROPDOWNS,
  PUBLIC_HEADER_GUEST_CTAS,
  PUBLIC_HEADER_LINKS,
} from '../config/publicNav';
import { usePublicUserActions } from '../hooks/usePublicUserActions';
import { getMarketingHomePath } from '../utils/appHome';
import Logo from './Logo';
import PublicNavDropdown from './PublicNavDropdown';
import PublicUserMenu from './PublicUserMenu';
import ThemeToggle from './ThemeToggle';

function HeaderLink({ to, label, onNavigate, className = '', isMarketingHome = false }) {
  const location = useLocation();
  const active = isMarketingHome
    ? location.pathname === '/' || location.pathname === '/home'
    : location.pathname === to;
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

function isMobileLinkActive(pathname, item, isMarketingHome) {
  if (isMarketingHome) return pathname === '/' || pathname === '/home';
  if (!item.to) return false;
  const path = item.to.split('?')[0];
  return pathname === path;
}

function MobileNavLink({ item, onNavigate, active = false, isMarketingHome = false }) {
  const location = useLocation();
  const isActive = active || isMobileLinkActive(location.pathname, item, isMarketingHome);
  const className = `public-nav-mobile-link block rounded-xl px-4 py-3 text-base font-medium transition-colors ${
    isActive
      ? 'bg-[var(--accent-glow)] text-[var(--accent)]'
      : 'text-[var(--text-heading)] active:bg-[var(--surface-hover)]'
  }`;

  if (item.to) {
    return (
      <Link to={item.to} onClick={onNavigate} className={className}>
        {item.label}
      </Link>
    );
  }

  return (
    <a
      href={item.href}
      onClick={onNavigate}
      className={className}
      {...(item.download ? { download: true } : {})}
    >
      {item.label}
    </a>
  );
}

function MobileMenuPortal({ open, onClose, children }) {
  if (!open) return null;
  return createPortal(children, document.body);
}

export default function PublicNav() {
  const location = useLocation();
  const { user } = useAuth();
  const {
    menuLinks,
    handleLogout,
    enterStudentPreview,
    showLearnerView,
  } = usePublicUserActions();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('public-nav-mobile-open');
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('public-nav-mobile-open');
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className="app-nav public-nav border-b backdrop-blur-xl"
      style={{ background: 'var(--nav-bg)' }}
    >
      <div className="app-nav-inner public-nav-inner mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4">
        <div className="nav-brand min-w-0 shrink">
          <Logo to={user ? '/home' : '/'} variant="nav" />
        </div>

        <nav
          className="public-nav-desktop hidden flex-wrap items-center justify-end gap-2 xl:flex xl:gap-3"
          aria-label="Main"
        >
          {PUBLIC_HEADER_LINKS.map((link) =>
            link.marketingHome ? (
              <HeaderLink
                key="home"
                to={getMarketingHomePath(user)}
                label={link.label}
                isMarketingHome
              />
            ) : (
              <HeaderLink key={link.to} to={link.to} label={link.label} />
            )
          )}
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

        <div className="public-nav-mobile-controls flex shrink-0 items-center gap-2 xl:hidden">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button
            type="button"
            className="public-nav-menu-btn inline-flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-heading)]"
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

      <MobileMenuPortal open={mobileOpen}>
        <div
          id="public-nav-mobile-panel"
          className="public-nav-mobile fixed inset-0 z-[200] xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <button
            type="button"
            className="public-nav-mobile-backdrop absolute inset-0 touch-manipulation bg-black/50"
            aria-label="Close menu"
            onClick={closeMobile}
          />

          <div className="public-nav-mobile-panel absolute inset-y-0 right-0 flex h-full flex-col border-l border-[var(--border)] bg-[var(--surface-solid)] shadow-2xl">
            <div className="public-nav-mobile-header flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-heading)]">Menu</p>
                {user ? (
                  <p className="truncate text-xs text-[var(--text-muted)]">Signed in as {user.name}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="public-nav-mobile-close inline-flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)]"
                aria-label="Close menu"
                onClick={closeMobile}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav
              className="public-nav-mobile-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4"
              aria-label="Mobile"
            >
              <div className="space-y-1">
                {PUBLIC_HEADER_LINKS.map((link) => (
                  <MobileNavLink
                    key={link.marketingHome ? 'home' : link.to}
                    item={
                      link.marketingHome
                        ? { label: link.label, to: getMarketingHomePath(user) }
                        : link
                    }
                    onNavigate={closeMobile}
                    isMarketingHome={Boolean(link.marketingHome)}
                  />
                ))}
              </div>

              {PUBLIC_HEADER_DROPDOWNS.map((group) => (
                <div key={group.id} className="mt-6">
                  <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-label)]">
                    {group.label}
                  </p>
                  <div className="mt-1 space-y-1">
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

              {user ? (
                <div className="mt-6">
                  <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-label)]">
                    Your account
                  </p>
                  <div className="mt-1 space-y-1">
                    {menuLinks.map((item) => (
                      <MobileNavLink key={item.to} item={item} onNavigate={closeMobile} />
                    ))}
                    {showLearnerView ? (
                      <button
                        type="button"
                        className="public-nav-mobile-link block w-full rounded-xl px-4 py-3 text-left text-base font-medium text-[var(--text-heading)] active:bg-[var(--surface-hover)]"
                        onClick={() => {
                          closeMobile();
                          enterStudentPreview();
                        }}
                      >
                        Learner view
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="public-nav-mobile-link g_id_signout block w-full rounded-xl px-4 py-3 text-left text-base font-medium text-[var(--text-heading)] active:bg-[var(--surface-hover)]"
                      onClick={() => {
                        closeMobile();
                        handleLogout();
                      }}
                    >
                      Log out
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 border-t border-[var(--border)] pt-4 sm:hidden">
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-label)]">
                  Appearance
                </p>
                <div className="px-3">
                  <ThemeToggle />
                </div>
              </div>
            </nav>

            {!user ? (
              <div className="public-nav-mobile-footer shrink-0 space-y-2 border-t border-[var(--border)] p-4">
                <Link
                  to="/register"
                  className="btn-primary block w-full min-h-[44px] py-3 text-center text-base"
                  onClick={closeMobile}
                >
                  Get started
                </Link>
                <Link
                  to="/login"
                  className="nav-link-accent block w-full min-h-[44px] py-3 text-center text-base"
                  onClick={closeMobile}
                >
                  Sign in
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </MobileMenuPortal>
    </header>
  );
}
