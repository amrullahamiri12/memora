import PublicNav from '../components/PublicNav';
import SiteFooter from '../components/SiteFooter';
import LandingHero from '../components/landing/LandingHero';
import LandingFeatureCard from '../components/landing/LandingFeatureCard';
import { LANDING_FEATURES } from '../config/landingContent';

const FEATURE_STAGGER = ['landing-stagger-2', 'landing-stagger-3', 'landing-stagger-4'];

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

      <PublicNav />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-10 page-enter">
        <LandingHero />

        <section className="mt-16 lg:mt-20">
          <div className="mb-8 text-center lg:mb-10">
            <h2 className="font-display text-2xl font-bold text-[var(--text-heading)] sm:text-3xl">
              Everything you need to study
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--text-muted)] sm:text-base">
              Learn, review flashcards, and track your progress — all in one place.
            </p>
          </div>

          <div className="grid items-stretch gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
            {LANDING_FEATURES.map((item, index) => (
              <LandingFeatureCard
                key={item.title}
                title={item.title}
                text={item.text}
                image={item.image}
                alt={item.alt}
                staggerClass={FEATURE_STAGGER[index] ?? 'landing-stagger-4'}
              />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
