import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';
import SubjectExploreGrid from '../components/landing/SubjectExploreGrid';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

export default function ExplorePage() {
  return (
    <PublicPageLayout>
      <PageHeader
        title="Explore subjects"
        subtitle="Pick what you want to learn and start practicing right away — no account required."
      />

      <Card className="mb-8 border-[var(--accent)]/20 bg-[var(--accent-glow)]/30 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[var(--text-heading)]">How it works</h2>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--accent)]">1.</span>
            <span>Tap <strong className="font-medium text-[var(--text-heading)]">Start practicing</strong> on any subject.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--accent)]">2.</span>
            <span>We&apos;ll open a free guest session — no email or password.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--accent)]">3.</span>
            <span>Study flashcards and quizzes. Create an account anytime to save your progress.</span>
          </li>
        </ol>
      </Card>

      <SubjectExploreGrid showSearch skeletonCount={6} />

      <Card className="mt-10 p-6 text-center sm:p-8">
        <p className="font-medium text-[var(--text-heading)]">Want to pick several subjects first?</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
          You can enroll in up to three at once as a guest, or create a full account to unlock
          verification email and long-term progress.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="btn-primary inline-flex px-5 py-2.5 text-sm font-semibold">
            Create account
          </Link>
          <Link to="/login" className="btn-secondary inline-flex px-5 py-2.5 text-sm font-semibold">
            Sign in / continue as guest
          </Link>
        </div>
      </Card>
    </PublicPageLayout>
  );
}
