import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import ContinueAsGuestButton from '../ContinueAsGuestButton';
import { LANDING_HERO } from '../../config/landingContent';

export default function LandingHero() {
  return (
    <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
      <div className="landing-stagger-1">
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
        <div className="mt-10 flex max-w-md flex-col gap-3">
          <Link to="/register">
            <Button className="w-full px-8 py-3 sm:w-auto sm:min-w-[10rem]">Get started</Button>
          </Link>
          <ContinueAsGuestButton />
          <p className="text-center text-sm text-[var(--text-muted)] sm:text-left">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="landing-stagger-2 relative mx-auto w-full max-w-lg lg:max-w-none">
        <div
          className="pointer-events-none absolute -inset-4 rounded-3xl opacity-60 blur-2xl"
          style={{ background: 'var(--accent-glow)' }}
          aria-hidden
        />
        <div className="landing-float relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] shadow-[var(--shadow-lg)]">
          <img
            src={LANDING_HERO.image}
            alt={LANDING_HERO.alt}
            width={1200}
            height={800}
            className="aspect-[4/3] w-full object-cover"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
