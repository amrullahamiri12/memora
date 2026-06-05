import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

function PolicySection({ title, children }) {
  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-[var(--text-heading)]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
        {children}
      </div>
    </Card>
  );
}

export default function PrivacyPage() {
  return (
    <PublicPageLayout>
      <PageHeader
        title="Privacy policy"
        subtitle="Last updated: June 2026. How Memora handles your information."
      />

      <div className="space-y-6">
        <PolicySection title="Overview">
          <p>
            Memora (&quot;we&quot;, &quot;us&quot;) operates memora.cards, a web application for
            flashcard study and progress tracking. This policy describes what we collect and how we
            use it.
          </p>
        </PolicySection>

        <PolicySection title="Information we collect">
          <p>
            <strong className="text-[var(--text-heading)]">Account data:</strong> name, email,
            password hash (or Google account identifier if you sign in with Google), and role.
          </p>
          <p>
            <strong className="text-[var(--text-heading)]">Study data:</strong> subject enrollments,
            card review status, practice history, streaks, and related progress metrics.
          </p>
          <p>
            <strong className="text-[var(--text-heading)]">Guest sessions:</strong> temporary
            accounts let you try the app; you may upgrade to a full account to keep progress.
          </p>
          <p>
            <strong className="text-[var(--text-heading)]">Contact form:</strong> name, email, and
            message content when you reach out via our contact page.
          </p>
        </PolicySection>

        <PolicySection title="How we use information">
          <p>We use your data to provide the service, authenticate you, save study progress, send account-related emails (verification, password reset), and respond to support requests.</p>
          <p>We do not sell your personal information to third parties.</p>
        </PolicySection>

        <PolicySection title="Third-party services">
          <p>
            Email delivery uses Resend. Google Sign-In is optional and governed by Google&apos;s
            policies when you choose that login method. Hosting and infrastructure providers process
            data as needed to run the application.
          </p>
        </PolicySection>

        <PolicySection title="Account closure">
          <p>
            You may close your account from account settings. Accounts are deactivated rather than
            immediately erased; study data may be retained for administrative and recovery purposes
            until an admin reactivates or permanently removes records.
          </p>
        </PolicySection>

        <PolicySection title="Contact">
          <p>
            Questions about this policy?{' '}
            <Link to="/contact" className="font-semibold text-[var(--accent)] hover:underline">
              Contact us
            </Link>
            .
          </p>
        </PolicySection>
      </div>
    </PublicPageLayout>
  );
}
