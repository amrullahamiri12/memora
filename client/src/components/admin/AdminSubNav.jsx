import { Link, useLocation } from 'react-router-dom';
import { getAdminSection, isNavItemActive } from '../../config/adminNav';

export default function AdminSubNav() {
  const location = useLocation();
  const section = getAdminSection(location.pathname);

  if (!section || section.items.length <= 1) return null;

  return (
    <div
      className="admin-subnav border-b"
      style={{ background: 'var(--nav-bg)' }}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {section.label}
          </span>
          {section.items.map((item) => {
            const active = isNavItemActive(
              location.pathname,
              item.to,
              item.exact
            );
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`admin-subnav-link shrink-0 ${active ? 'admin-subnav-link-active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
