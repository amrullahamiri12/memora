import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import PublicUserMenu from './PublicUserMenu';
import ThemeToggle from './ThemeToggle';
import { PUBLIC_HEADER_LINKS } from '../config/publicNav';

export default function PublicNav() {
  const location = useLocation();
  const { user } = useAuth();

  const navLinkClass = (to) =>
    `nav-link ${location.pathname === to ? 'nav-link-active' : ''}`;

  return (
    <header
      className="app-nav border-b backdrop-blur-xl"
      style={{ background: 'var(--nav-bg)' }}
    >
      <div className="app-nav-inner mx-auto flex max-w-6xl items-center justify-between gap-4 px-4">
        <div className="nav-brand">
          <Logo to={user ? '/home' : '/'} variant="nav" />
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {PUBLIC_HEADER_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={navLinkClass(link.to)}>
              {link.label}
            </Link>
          ))}
          <a href="/api-docs.html" className="nav-link hidden sm:inline">
            API docs
          </a>
          <ThemeToggle />
          {user ? (
            <PublicUserMenu />
          ) : (
            <Link
              to="/login"
              className={`nav-link-accent ${location.pathname === '/login' ? 'nav-link-active' : ''}`}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
