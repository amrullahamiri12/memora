import { Link } from 'react-router-dom';
import {
  COMPANY_FOOTER_LINKS,
  COMPANY_LEGAL_NAME,
  MEMORA_SLOGAN,
} from '../config/publicNav';

const FOOTER_NAV = [
  {
    ariaLabel: 'Account',
    links: [
      { label: 'Get started', to: '/register' },
      { label: 'Sign in', to: '/login' },
      { label: 'Reset password', to: '/forgot-password' },
    ],
  },
  {
    ariaLabel: 'Company',
    links: COMPANY_FOOTER_LINKS,
  },
  {
    ariaLabel: 'Developers',
    links: [
      { label: 'API docs', href: '/api-docs.html' },
      { label: 'OpenAPI', href: '/openapi.yaml', download: true },
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
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-display text-lg font-bold text-[var(--text-heading)]">Memora</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
              {MEMORA_SLOGAN}
            </p>
          </div>

          {FOOTER_NAV.map((section) => (
            <nav key={section.ariaLabel} aria-label={section.ariaLabel}>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-10 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)]">
          © {year} Memora is operated by {COMPANY_LEGAL_NAME}. Serving across the U.S. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
