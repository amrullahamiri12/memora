import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ThemeToggle';

const FEATURES = [
  {
    icon: '🧠',
    title: 'Learn mode',
    text: 'Mixed quizzes with instant feedback across question types.',
  },
  {
    icon: '🃏',
    title: 'Flashcards',
    text: 'Flip cards and rate what you know — progress follows you.',
  },
  {
    icon: '🔥',
    title: 'Streaks & profile',
    text: 'Daily practice tracking and per-topic study stats.',
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none absolute inset-0 opacity-[var(--grain-opacity)]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      <header
        className="app-nav relative z-10 border-b backdrop-blur-xl"
        style={{ background: 'var(--nav-bg)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="nav-brand">
            <Logo to="/" variant="nav" />
          </div>
          <nav className="flex items-center gap-3 sm:gap-4">
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

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-10 page-enter">
        <section>
          <p className="mb-4 inline-block rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            Flashcards · quizzes · tests
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.1] text-[var(--text-heading)] sm:text-5xl lg:text-6xl">
            Study smarter,
            <br />
            <span className="text-[var(--accent)]">remember longer.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--text-muted)]">
            Memora turns your subjects into adaptive practice — enroll in topics, run learn and test
            sessions, and track progress over time.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/register">
              <Button className="min-w-[10rem] px-8 py-3">Get started</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" className="min-w-[10rem] px-8 py-3">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] backdrop-blur-sm"
            >
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
              <h2 className="mt-3 font-semibold text-[var(--text-heading)]">{item.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                For developers
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-[var(--text-heading)]">
                Memora API
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--text-muted)]">
                OpenAPI 3 documentation with try-it-out requests. Same-origin{' '}
                <code className="rounded bg-[var(--tone-sage-bg)] px-1.5 py-0.5 text-xs text-[var(--text)]">
                  /api
                </code>{' '}
                on production; Bearer JWT for protected routes.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <a href="/api-docs.html" className="btn-primary w-full whitespace-nowrap sm:w-auto">
                Open API docs
              </a>
              <a
                href="/openapi.yaml"
                download
                className="btn-secondary w-full whitespace-nowrap sm:w-auto"
              >
                Download OpenAPI
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-[var(--text-muted)]">
          <a href="/api-docs.html" className="font-medium text-[var(--accent)] hover:underline sm:hidden">
            API documentation
          </a>
          <p className="mt-2 sm:mt-0">
            © {new Date().getFullYear()} Memora ·{' '}
            <a href="https://memora.cards/" className="hover:text-[var(--accent)]">
              memora.cards
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
