import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { PUBLIC_HEADER_LINKS } from '../config/publicNav';

export default function PublicNav() {
  const location = useLocation();

  const navLinkClass = (to) =>
    `text-sm font-medium transition-colors ${
      location.pathname === to
        ? 'text-[var(--accent)]'
        : 'text-[var(--text-muted)] hover:text-[var(--accent)]'
    }`;

  return (
    <header
      className="app-nav relative z-10 border-b backdrop-blur-xl"
      style={{ background: 'var(--nav-bg)' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="nav-brand">
          <Logo to="/" variant="nav" />
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
          {PUBLIC_HEADER_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={navLinkClass(link.to)}>
              {link.label}
            </Link>
          ))}
          <a
            href="/api-docs.html"
            className="hidden text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] sm:inline"
          >
            API docs
          </a>
          <ThemeToggle />
          <Link
            to="/login"
            className="text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
