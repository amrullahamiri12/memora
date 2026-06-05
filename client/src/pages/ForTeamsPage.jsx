import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const TEAM_FEATURES = [
  {
    title: 'Admin dashboard',
    body: 'Overview metrics and quick access to content, learners, and reports from one place.',
  },
  {
    title: 'Content management',
    body: 'Create and organize subjects, topics, and flashcards for the groups you support.',
  },
  {
    title: 'Learner management',
    body: 'Invite and manage learners, track who is active, and focus outreach where it matters.',
  },
  {
    title: 'Engagement reports',
    body: 'See how learners are studying over time with learner and content health reports.',
  },
  {
    title: 'Learner view',
    body: 'Staff can switch into learner view to experience study flows exactly as students do.',
  },
];

export default function ForTeamsPage() {
  return (
    <PublicPageLayout>
      <PageHeader
        title="For teams"
        subtitle="Memora for schools, training programs, and study groups that need admin tools alongside learner practice."
      />

      <div className="space-y-6">
        <Card className="p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            Memora is built for individual learners first, with a full admin layer for organizations
            that manage curriculum and track engagement. Team pricing is not live yet — contact us to
            discuss your use case or get early access to organization features.
          </p>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          {TEAM_FEATURES.map((feature) => (
            <Card key={feature.title} className="p-6">
              <h2 className="text-base font-semibold text-[var(--text-heading)]">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{feature.body}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 text-center sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">Talk to us</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
            Tell us about your learners, subjects, and timeline. We will help you plan a rollout on
            Memora.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/contact">
              <Button>Contact us</Button>
            </Link>
            <Link to="/pricing" className="text-sm font-semibold text-[var(--accent)] hover:underline">
              View pricing →
            </Link>
          </div>
        </Card>
      </div>
    </PublicPageLayout>
  );
}
