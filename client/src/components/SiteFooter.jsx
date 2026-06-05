import { Link } from 'react-router-dom';
import { COMPANY_FOOTER_LINKS, COMPANY_LEGAL_NAME } from '../config/publicNav';

const FOOTER_SECTIONS = [
  {
    title: 'Study',
    links: [
      { label: 'Get started', to: '/register' },
      { label: 'Sign in', to: '/login' },
      { label: 'Reset password', to: '/forgot-password' },
    ],
  },
  {
    title: 'Company',
    links: COMPANY_FOOTER_LINKS,
  },
  {
    title: 'Developers',
    links: [
      { label: 'API documentation', href: '/api-docs.html' },
      { label: 'OpenAPI spec', href: '/openapi.yaml', download: true },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: 'https://github.com/amrullahamiri12/memora', external: true },
      { label: 'memora.cards', href: 'https://memora.cards/', external: true },
    ],
  },
];

function FooterLink({ link }) {
  const className =
    'text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]';

  if (link.to) {
    return (
      <Link to={link.to} className={className}>
        {link.label}
      </Link>
    );
  }

  return (
    <a
      href={link.href}
      className={className}
      {...(link.download ? { download: true } : {})}
      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </a>
  );
}

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-display text-lg font-bold text-[var(--text-heading)]">Memora</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
              Adaptive flashcards, quizzes, and progress tracking for every subject you study.
              Operated by {COMPANY_LEGAL_NAME}.
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-label)]">
                {section.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p>
              © {year} {COMPANY_LEGAL_NAME}. All rights reserved.
            </p>
            <p className="mt-1 text-xs">
              Memora ·{' '}
              <a href="https://memora.cards/" className="hover:text-[var(--accent)]">
                memora.cards
              </a>
            </p>
          </div>
          <p className="text-xs">Learn · Flashcards · Test · Streaks</p>
        </div>
      </div>
    </footer>
  );
}
