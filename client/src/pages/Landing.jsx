import PublicNav from '../components/PublicNav';
import SiteFooter from '../components/SiteFooter';
import LandingHero from '../components/landing/LandingHero';
import LandingFeatureCard from '../components/landing/LandingFeatureCard';
import { LANDING_FEATURES } from '../config/landingContent';

const FEATURE_STAGGER = ['landing-stagger-3', 'landing-stagger-4', 'landing-stagger-5'];

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

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-12 page-enter sm:pt-14 lg:pt-16">
        <LandingHero />

        <section className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_FEATURES.map((item, index) => (
            <LandingFeatureCard
              key={item.title}
              title={item.title}
              text={item.text}
              image={item.image}
              alt={item.alt}
              staggerClass={FEATURE_STAGGER[index] ?? 'landing-stagger-5'}
            />
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
