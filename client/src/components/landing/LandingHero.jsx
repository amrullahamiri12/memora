import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import ContinueAsGuestButton from '../ContinueAsGuestButton';
import {
  LANDING_HERO,
  LANDING_HERO_STAT,
  LANDING_HERO_TRUST,
} from '../../config/landingContent';

export default function LandingHero() {
  return (
    <section className="landing-hero relative">
      <div
        className="landing-hero-orb pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full opacity-70 blur-3xl lg:h-80 lg:w-80"
        aria-hidden
      />

      <div className="landing-hero-grid grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-14">
        <div className="landing-hero-copy relative z-[1] max-w-xl lg:max-w-none">
          <p className="landing-reveal landing-reveal-1 mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] shadow-[var(--shadow)]">
            <span className="landing-badge-dot h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
            Flashcards · quizzes · tests
          </p>

          <h1 className="landing-reveal landing-reveal-2 font-display text-[2.625rem] font-bold leading-[1.06] tracking-tight text-[var(--text-heading)] sm:text-5xl lg:text-[3.35rem] xl:text-[3.75rem]">
            Study smarter,
            <br />
            <span className="landing-headline-accent">remember longer.</span>
          </h1>

          <p className="landing-reveal landing-reveal-3 mt-5 max-w-[34ch] text-base leading-relaxed text-[var(--text-muted)] sm:text-lg sm:leading-relaxed">
            Memora turns your subjects into adaptive practice — enroll in topics, run learn and test
            sessions, and track progress over time.
          </p>

          <ul className="landing-reveal landing-reveal-4 mt-6 flex flex-wrap gap-2">
            {LANDING_HERO_TRUST.map((item) => (
              <li
                key={item}
                className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1 text-xs font-medium text-[var(--text-label)]"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="landing-reveal landing-reveal-5 mt-8">
            <div className="landing-cta-shell flex w-full max-w-md flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow)] sm:max-w-lg sm:flex-row">
              <Link to="/register" className="flex-1">
                <Button className="landing-cta-primary w-full px-6 py-3.5 text-[0.9375rem]">
                  Get started
                  <span className="landing-cta-arrow ml-1.5 inline-block" aria-hidden>
                    →
                  </span>
                </Button>
              </Link>
              <ContinueAsGuestButton
                className="flex-1"
                buttonClassName="landing-cta-secondary w-full px-6 py-3.5 text-[0.9375rem]"
                showDescription={false}
              />
            </div>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-[var(--text-muted)]">
              Try the app with no sign-up — choose subjects next. Create an account later to keep
              progress.
            </p>
          </div>

          <p className="landing-reveal landing-reveal-6 mt-5 text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="landing-reveal landing-reveal-7 relative flex justify-center lg:justify-end xl:justify-center">
          <div className="landing-hero-visual relative w-full max-w-[420px] sm:max-w-[460px] lg:max-w-[480px]">
            <div
              className="landing-image-accent pointer-events-none absolute -right-3 top-6 h-[88%] w-[88%] rounded-[1.35rem] border-2 border-[var(--accent)] opacity-40 lg:-right-4"
              aria-hidden
            />

            <div className="landing-image-glow pointer-events-none absolute -inset-4 rounded-[1.75rem] opacity-60 blur-2xl" aria-hidden />

            <div className="landing-image-frame landing-float relative overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-solid)] shadow-[var(--shadow-lg)]">
              <img
                src={LANDING_HERO.image}
                alt={LANDING_HERO.alt}
                width={1200}
                height={800}
                className="aspect-[4/5] w-full object-cover object-[center_30%] sm:aspect-[5/6]"
                fetchPriority="high"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(15,26,22,0.35)] via-transparent to-transparent"
                aria-hidden
              />
            </div>

            <div className="landing-hero-stat-wrap absolute -bottom-4 left-4 sm:-left-5">
              <div className="landing-hero-stat landing-stat-float flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 shadow-[var(--shadow-lg)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--tone-olive-bg)] text-lg" aria-hidden>
                  {LANDING_HERO_STAT.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-heading)]">{LANDING_HERO_STAT.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{LANDING_HERO_STAT.text}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
