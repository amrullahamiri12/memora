import { Link } from 'react-router-dom';
import { COMPANY_LEGAL_NAME, MEMORA_SLOGAN } from '../config/publicNav';
import PublicPageLayout from '../components/PublicPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

export default function AboutPage() {
  return (
    <PublicPageLayout>
      <PageHeader title="About Memora" subtitle={MEMORA_SLOGAN} />

      <div className="space-y-6">
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">Who we are</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Memora at{' '}
            <a
              href="https://memora.cards/"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              memora.cards
            </a>{' '}
            is operated by {COMPANY_LEGAL_NAME}. We build study tools for learners, instructors, and
            teams across the U.S. — with adaptive practice designed to help you cultivate your mind
            over time, not just cram for a single test.
          </p>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">What we do</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Memora turns your curriculum into structured, adaptive practice. Learners enroll in
            subjects, work through topics with flashcards and quizzes, and build mastery session by
            session. Admins manage content, users, and reports from a dedicated dashboard.
          </p>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">How you study</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
            <li>
              <strong className="text-[var(--text-heading)]">Learn</strong> — mixed question types
              with instant feedback.
            </li>
            <li>
              <strong className="text-[var(--text-heading)]">Flashcards</strong> — flip cards, rate
              what you know, and pick up where you left off.
            </li>
            <li>
              <strong className="text-[var(--text-heading)]">Test</strong> — focused sessions to
              check retention before you move on.
            </li>
          </ul>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">Progress that sticks</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Every answer updates your mastery per card and topic. Streaks reward daily practice, and
            your profile shows what you have studied and where to focus next.
          </p>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">For teams</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Staff admins can manage subjects, flashcards, and learners, run engagement reports, and
            use learner view to experience the app the same way students do.
          </p>
          <p className="mt-4 text-sm">
            <Link to="/contact" className="font-semibold text-[var(--accent)] hover:underline">
              Contact us →
            </Link>
          </p>
        </Card>
      </div>
    </PublicPageLayout>
  );
}
