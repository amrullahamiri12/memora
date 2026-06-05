import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FEATURE_GUIDES } from '../config/featureGuides';
import PublicPageLayout from '../components/PublicPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

function scrollToHash(hash) {
  if (!hash) return;
  const id = hash.replace(/^#/, '');
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function FeaturesPage() {
  const { hash } = useLocation();

  useEffect(() => {
    scrollToHash(hash);
  }, [hash]);

  return (
    <PublicPageLayout>
      <PageHeader
        title="How Memora works"
        subtitle="Learn mode, flashcards, and progress tracking — what each part does and how to use it."
      />

      <nav
        aria-label="Feature sections"
        className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4"
      >
        {FEATURE_GUIDES.map((guide) => (
          <a
            key={guide.slug}
            href={`#${guide.slug}`}
            className="rounded-full border border-[var(--border)] px-3.5 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {guide.title}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {FEATURE_GUIDES.map((guide) => (
          <section
            key={guide.slug}
            id={guide.slug}
            className="scroll-mt-24"
            aria-labelledby={`${guide.slug}-title`}
          >
            <Card className="overflow-hidden p-0">
              <img
                src={guide.image}
                alt={guide.imageAlt}
                width={1200}
                height={500}
                loading="lazy"
                className="aspect-[21/9] w-full object-cover sm:aspect-[3/1]"
              />
              <div className="p-6 sm:p-8">
                <h2
                  id={`${guide.slug}-title`}
                  className="font-display text-xl font-bold text-[var(--text-heading)] sm:text-2xl"
                >
                  {guide.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
                  {guide.lead}
                </p>

                <div className="mt-6 space-y-5">
                  {guide.sections.map((block) => (
                    <div key={block.heading}>
                      <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                        {block.heading}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                        {block.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-[var(--text-muted)]">
        Ready to try it?{' '}
        <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
          Create an account
        </Link>{' '}
        or{' '}
        <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
          sign in
        </Link>
        .
      </p>
    </PublicPageLayout>
  );
}
