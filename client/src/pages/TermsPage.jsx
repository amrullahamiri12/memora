import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

function TermsSection({ title, children }) {
  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-[var(--text-heading)]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
        {children}
      </div>
    </Card>
  );
}

export default function TermsPage() {
  return (
    <PublicPageLayout>
      <PageHeader
        title="Terms of service"
        subtitle="Last updated: June 2026. By using Memora you agree to these terms."
      />

      <div className="space-y-6">
        <TermsSection title="Using Memora">
          <p>
            Memora is provided at memora.cards for personal and organizational study. You must
            provide accurate account information and keep your credentials secure.
          </p>
        </TermsSection>

        <TermsSection title="Acceptable use">
          <p>
            Do not abuse the service, attempt unauthorized access, scrape or overload our systems,
            upload harmful content, or use Memora in ways that violate applicable law. Admins are
            responsible for content they publish and users they manage.
          </p>
        </TermsSection>

        <TermsSection title="Study content">
          <p>
            Flashcards and quiz material are provided for learning purposes. Memora does not
            guarantee exam outcomes, accuracy of user-generated content, or suitability for any
            particular certification or curriculum.
          </p>
        </TermsSection>

        <TermsSection title="Accounts and access">
          <p>
            We may suspend or deactivate accounts that violate these terms or pose a security risk.
            You may close your own account at any time. Reactivation of closed accounts may require
            administrator approval.
          </p>
        </TermsSection>

        <TermsSection title="Disclaimer">
          <p>
            Memora is provided &quot;as is&quot; without warranties of any kind. To the fullest
            extent permitted by law, we are not liable for indirect or consequential damages arising
            from use of the service.
          </p>
        </TermsSection>

        <TermsSection title="Changes">
          <p>
            We may update these terms or the service from time to time. Continued use after changes
            constitutes acceptance of the updated terms.
          </p>
          <p>
            Questions?{' '}
            <Link to="/contact" className="font-semibold text-[var(--accent)] hover:underline">
              Contact us
            </Link>
            .
          </p>
        </TermsSection>
      </div>
    </PublicPageLayout>
  );
}
