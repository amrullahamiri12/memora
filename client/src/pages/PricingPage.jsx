import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const FREE_FEATURES = [
  'Enroll in subjects and study topics',
  'Learn mode with instant feedback',
  'Flashcards with saved progress',
  'Streaks and profile stats',
  'Guest try-before-sign-up',
];

const FUTURE_PLUS = [
  'Advanced analytics and exports',
  'Priority support',
  'Early access to new study tools',
];

const FUTURE_TEAM = [
  'Multiple admin seats',
  'Organization-wide reports',
  'Shared subject libraries',
  'Volume pricing for schools',
];

export default function PricingPage() {
  return (
    <PublicPageLayout>
      <PageHeader
        title="Pricing"
        subtitle="Memora is free for core study today. Paid plans are on the roadmap — we'll announce before anything changes."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="relative flex flex-col border-[var(--accent)]/40 p-6 sm:p-8 lg:col-span-1 lg:row-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Current</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[var(--text-heading)]">Free</h2>
          <p className="mt-1 text-3xl font-bold text-[var(--text-heading)]">
            $0
            <span className="text-base font-normal text-[var(--text-muted)]"> / month</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Everything you need to study with Memora right now — no credit card required.
          </p>
          <ul className="mt-6 flex-1 space-y-2.5 text-sm text-[var(--text-muted)]">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2">
                <span className="text-[var(--accent)]" aria-hidden>
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <Link to="/register" className="mt-8 block">
            <Button className="w-full">Get started free</Button>
          </Link>
        </Card>

        <Card className="flex flex-col p-6 opacity-90 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-label)]">
            Coming later
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--text-heading)]">Plus</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            For power learners who want deeper insights and extras. Pricing TBD.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
            {FUTURE_PLUS.map((feature) => (
              <li key={feature}>· {feature}</li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col p-6 opacity-90 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-label)]">
            Coming later
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--text-heading)]">Team</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            For schools and organizations using admin tools today.{' '}
            <Link to="/for-teams" className="font-medium text-[var(--accent)] hover:underline">
              See For teams
            </Link>
            .
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
            {FUTURE_TEAM.map((feature) => (
              <li key={feature}>· {feature}</li>
            ))}
          </ul>
          <Link to="/contact" className="mt-6 text-sm font-semibold text-[var(--accent)] hover:underline">
            Contact us for team pricing →
          </Link>
        </Card>
      </div>

      <Card className="mt-8 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-[var(--text-heading)]">Questions</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          We will not move core study features behind a paywall without clear notice. Questions about
          billing or schools? See{' '}
          <Link to="/help" className="font-medium text-[var(--accent)] hover:underline">
            Help
          </Link>{' '}
          or{' '}
          <Link to="/contact" className="font-medium text-[var(--accent)] hover:underline">
            contact us
          </Link>
          .
        </p>
      </Card>
    </PublicPageLayout>
  );
}
