import { Link } from 'react-router-dom';
import { HELP_FAQ_SECTIONS } from '../config/helpFaq';
import PublicPageLayout from '../components/PublicPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

export default function HelpPage() {
  return (
    <PublicPageLayout>
      <PageHeader
        title="Help"
        subtitle="Answers to common questions about studying with Memora, accounts, and teams."
      />

      <div className="space-y-6">
        {HELP_FAQ_SECTIONS.map((section) => (
          <Card key={section.title} className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">{section.title}</h2>
            <dl className="mt-4 space-y-5">
              {section.items.map((item) => (
                <div key={item.q}>
                  <dt className="text-sm font-semibold text-[var(--text-heading)]">{item.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
        Still need help?{' '}
        <Link to="/contact" className="font-semibold text-[var(--accent)] hover:underline">
          Contact us
        </Link>
        .
      </p>
    </PublicPageLayout>
  );
}
