import PublicNav from './PublicNav';
import SiteFooter from './SiteFooter';

export default function PublicPageLayout({ children }) {
  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none absolute inset-0 opacity-[var(--grain-opacity)]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />
      <PublicNav />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 page-enter">{children}</main>
      <SiteFooter />
    </div>
  );
}
