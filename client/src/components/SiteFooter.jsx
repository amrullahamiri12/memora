import { Link } from 'react-router-dom';
import {
  COMPANY_LEGAL_NAME,
  FOOTER_NAV_SECTIONS,
  MEMORA_SLOGAN,
} from '../config/publicNav';

function footerSectionId(title) {
  return `footer-${title.toLowerCase().replace(/\s+/g, '-')}`;
}

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
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-display text-lg font-bold text-[var(--text-heading)]">Memora</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
              {MEMORA_SLOGAN}
            </p>
          </div>

          {FOOTER_NAV_SECTIONS.map((section) => {
            const headingId = footerSectionId(section.title);

            return (
              <nav key={section.title} aria-labelledby={headingId}>
                <h2
                  id={headingId}
                  className="text-xs font-semibold uppercase tracking-wider text-[var(--text-label)]"
                >
                  {section.title}
                </h2>
                <ul className="mt-3 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>

        <p className="mt-10 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)]">
          © {year} Memora is operated by {COMPANY_LEGAL_NAME}. Serving across the U.S. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
