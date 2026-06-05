import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudentPreview } from '../../hooks/useStudentPreview';
import { getAppHomePath } from '../../utils/appHome';
import { isStaff } from '../../utils/roles';
import Button from '../ui/Button';
import ContinueAsGuestButton from '../ContinueAsGuestButton';
import { LANDING_HERO_INTERVAL_MS, LANDING_HERO_SLIDES } from '../../config/landingContent';

export default function LandingHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { user } = useAuth();
  const studentPreview = useStudentPreview();
  const staff = isStaff(user?.role);
  const inStudentPreview = staff && studentPreview;
  const appHomePath = getAppHomePath(user, inStudentPreview);
  const appHomeLabel = 'Go to Dashboard';

  const slideCount = LANDING_HERO_SLIDES.length;
  const activeSlide = LANDING_HERO_SLIDES[activeIndex];

  useEffect(() => {
    if (slideCount <= 1) return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, LANDING_HERO_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [slideCount]);

  return (
    <section
      className="landing-hero-banner landing-stagger-1 relative overflow-hidden rounded-2xl border border-[var(--border)] shadow-[var(--shadow-lg)]"
      aria-label="Memora study app"
      aria-roledescription="carousel"
    >
      <div className="absolute inset-0" aria-hidden>
        {LANDING_HERO_SLIDES.map((slide, index) => (
          <img
            key={slide.image}
            src={slide.image}
            alt=""
            width={1600}
            height={900}
            className={`landing-hero-slide absolute inset-0 h-full w-full object-cover ${
              index === activeIndex ? 'is-active' : ''
            }`}
            style={{ objectPosition: slide.objectPosition ?? 'center center' }}
            fetchPriority={index === 0 ? 'high' : 'low'}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>

      <div className="landing-hero-overlay pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative flex min-h-[min(42vh,320px)] flex-col justify-center px-4 py-10 sm:min-h-[min(40vh,300px)] sm:px-6 sm:py-11 lg:px-8">
        <div className="landing-hero-content max-w-xl">
          <p className="landing-hero-badge mb-4 inline-block rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider">
            Flashcards · quizzes · tests
          </p>
          <h1 className="landing-hero-title font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
            Study smarter,
            <br />
            <span className="landing-hero-accent">remember longer.</span>
          </h1>
          <p className="landing-hero-lead mt-5 max-w-lg text-lg leading-relaxed sm:text-xl">
            Memora turns your subjects into adaptive practice — enroll in topics, run learn and test
            sessions, and track progress over time.
          </p>

          <div className="mt-8 flex max-w-md flex-col gap-3.5 sm:max-w-none">
            {user ? (
              <>
                <Link to={appHomePath} className="w-full sm:w-auto">
                  <Button className="min-w-[10rem] w-full px-8 py-3.5 shadow-lg sm:w-auto">
                    {appHomeLabel}
                  </Button>
                </Link>
                <p className="landing-hero-muted text-sm leading-relaxed sm:text-base">
                  You&apos;re signed in as {user.name}. Continue studying or browse features below.
                </p>
              </>
            ) : (
              <>
                <Link to="/register" className="w-full sm:w-auto">
                  <Button className="min-w-[10rem] w-full px-8 py-3.5 shadow-lg sm:w-auto">
                    Get started
                  </Button>
                </Link>
                <ContinueAsGuestButton
                  variant="link"
                  className="w-full sm:w-auto"
                  buttonClassName="landing-hero-link text-base sm:text-lg"
                  showDescription={false}
                />
                <p className="landing-hero-muted text-sm leading-relaxed sm:text-base">
                  Try the app with no sign-up — you&apos;ll choose subjects next. Create an account
                  later to keep progress.
                </p>
                <p className="landing-hero-muted text-sm sm:text-base">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="landing-hero-link text-base font-semibold hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {slideCount > 1 && (
        <div
          className="absolute bottom-4 right-4 flex gap-1.5 sm:bottom-5 sm:right-5"
          role="tablist"
          aria-label="Hero image slides"
        >
          {LANDING_HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              role="tab"
              aria-label={`Show slide ${index + 1}: ${slide.alt}`}
              aria-selected={index === activeIndex}
              className={`landing-hero-dot h-2 w-2 rounded-full transition-all ${
                index === activeIndex ? 'is-active' : ''
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {activeSlide.alt}
      </p>
    </section>
  );
}
