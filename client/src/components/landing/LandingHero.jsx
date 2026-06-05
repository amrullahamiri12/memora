import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import ContinueAsGuestButton from '../ContinueAsGuestButton';
import { LANDING_HERO } from '../../config/landingContent';

const CTA_BUTTON_CLASS = 'w-full px-8 py-3 sm:min-w-[11.5rem]';

export default function LandingHero() {
  return (
    <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-16">
      <div className="landing-stagger-1 lg:py-2">
        <p className="mb-4 inline-block rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          Flashcards · quizzes · tests
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.1] text-[var(--text-heading)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08] xl:text-6xl">
          Study smarter,
          <br />
          <span className="text-[var(--accent)]">remember longer.</span>
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--text-muted)]">
          Memora turns your subjects into adaptive practice — enroll in topics, run learn and test
          sessions, and track progress over time.
        </p>

        <div className="mt-8 space-y-4 sm:mt-10">
          <div className="flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap">
            <Link to="/register" className="w-full sm:w-auto">
              <Button className={CTA_BUTTON_CLASS}>Get started</Button>
            </Link>
            <ContinueAsGuestButton
              className="w-full sm:w-auto"
              buttonClassName={CTA_BUTTON_CLASS}
              showDescription={false}
            />
          </div>

          <p className="max-w-md text-xs leading-relaxed text-[var(--text-muted)]">
            Try the app with no sign-up — choose subjects next. Create an account later to keep progress.
          </p>

          <p className="text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="landing-stagger-2 flex justify-center lg:justify-end xl:justify-center">
        <div className="relative w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[500px]">
          <div
            className="pointer-events-none absolute -inset-3 rounded-3xl opacity-50 blur-2xl sm:-inset-4"
            style={{ background: 'var(--accent-glow)' }}
            aria-hidden
          />
          <div className="landing-float relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] shadow-[var(--shadow-lg)]">
            <img
              src={LANDING_HERO.image}
              alt={LANDING_HERO.alt}
              width={1200}
              height={800}
              className="aspect-[5/4] w-full object-cover object-[center_35%]"
              fetchPriority="high"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
