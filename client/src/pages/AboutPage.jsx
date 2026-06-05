import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

export default function AboutPage() {
  return (
    <PublicPageLayout>
      <PageHeader
        title="About Memora"
        subtitle="A study app built for learners, instructors, and teams who want structured practice with real progress tracking."
      />

      <div className="space-y-6">
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">What we do</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Memora turns your curriculum into adaptive practice. Learners enroll in subjects, work
            through topics with flashcards and quizzes, and build mastery over time. Admins manage
            content, users, and reports from a dedicated dashboard.
          </p>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">Study modes</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
            <li>
              <strong className="text-[var(--text-heading)]">Learn</strong> — mixed question types
              with instant feedback.
            </li>
            <li>
              <strong className="text-[var(--text-heading)]">Flashcards</strong> — flip cards and
              rate what you know; progress follows you.
            </li>
            <li>
              <strong className="text-[var(--text-heading)]">Test</strong> — focused sessions to
              check retention before moving on.
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
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">For organizations</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Staff admins can manage subjects, flashcards, and learners, run engagement reports, and
            use learner view to experience the app exactly as students do.
          </p>
          <p className="mt-4 text-sm">
            <Link to="/contact" className="font-semibold text-[var(--accent)] hover:underline">
              Get in touch →
            </Link>
          </p>
        </Card>
      </div>
    </PublicPageLayout>
  );
}
