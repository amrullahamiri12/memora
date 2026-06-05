import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { isGuestUser } from '../utils/guest';
import { subjectAccent } from '../utils/studyStorage';
import { startSubjectAsGuest, START_SUBJECT_ERRORS } from '../utils/startSubjectAsGuest';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import PublicPageLayout from '../components/PublicPageLayout';

function topicLabel(count) {
  if (count === 1) return '1 topic to explore';
  if (count == null || count === 0) return 'Topics coming soon';
  return `${count} topics to explore`;
}

export default function ExploreSubjectStartPage() {
  const { subjectId } = useParams();
  const { user, continueAsGuest, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from === '/explore' ? '/explore' : '/home';
  const backLabel = backTo === '/explore' ? 'Back to explore' : 'Back to subjects';
  const signedInLearner = user && !isGuestUser(user);
  const [catalog, setCatalog] = useState([]);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestLoading, setGuestLoading] = useState(false);
  const [autoStarting, setAutoStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const rows = await api('/subjects/catalog');
        if (cancelled) return;
        setCatalog(rows);
        const match = rows.find((s) => s.id === subjectId);
        if (!match) {
          setError('We couldn’t find that subject.');
          return;
        }
        setSubject(match);
        if (match.name) {
          document.title = `Start ${match.name} — Memora`;
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load subject details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  useEffect(() => {
    if (authLoading || loading || !subject || !signedInLearner) return;

    let cancelled = false;

    async function autoStart() {
      setAutoStarting(true);
      setError('');
      try {
        const result = await startSubjectAsGuest(subjectId, {
          user,
          continueAsGuest,
          catalog,
        });
        if (cancelled) return;
        if (result.ok || result.path) {
          navigate(result.path || `/subjects/${subjectId}`, { replace: true });
          return;
        }
        setError(result.message || 'Something went wrong. Please try again.');
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        if (!cancelled) setAutoStarting(false);
      }
    }

    autoStart();
    return () => {
      cancelled = true;
    };
  }, [authLoading, loading, subject, signedInLearner, subjectId, continueAsGuest, catalog, navigate, user]);

  const handleContinueAsGuest = async () => {
    setGuestLoading(true);
    setError('');
    try {
      const result = await startSubjectAsGuest(subjectId, {
        user,
        continueAsGuest,
        catalog,
      });
      if (result.ok) {
        navigate(result.path);
        return;
      }
      if (result.path && result.code === START_SUBJECT_ERRORS.ENROLLMENT_LIMIT) {
        setError(result.message);
        return;
      }
      if (result.path) {
        navigate(result.path);
        return;
      }
      setError(result.message || 'Something went wrong. Please try again.');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  const accent = subject ? subjectAccent(subject.name) : null;

  if (loading || authLoading || autoStarting || (signedInLearner && !error)) {
    return (
      <PublicPageLayout>
        <div className="mx-auto flex max-w-md flex-col items-center py-16">
          <Card className="w-full p-8 text-center">
            {accent && subject && (
              <div
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md"
                style={{ background: accent.gradient }}
                aria-hidden
              >
                {subject.name.charAt(0).toUpperCase()}
              </div>
            )}
            <Spinner className="mx-auto py-0" />
            <p className="mt-5 font-display text-lg font-semibold text-[var(--text-heading)]">
              {subject ? `Opening ${subject.name}…` : 'Loading subject…'}
            </p>
          </Card>
        </div>
      </PublicPageLayout>
    );
  }

  if (!subject) {
    return (
      <PublicPageLayout>
        <div className="mx-auto max-w-md py-10">
          <Card className="p-8 text-center">
            <p className="font-display text-lg font-semibold text-[var(--text-heading)]">
              Couldn&apos;t find that subject
            </p>
            {error && <Alert className="mt-4 text-left">{error}</Alert>}
            <Link to="/explore" className="btn-primary mt-6 inline-flex justify-center px-5 py-2.5 text-sm">
              Browse subjects
            </Link>
          </Card>
        </div>
      </PublicPageLayout>
    );
  }

  if (signedInLearner && error) {
    return (
      <PublicPageLayout>
        <div className="mx-auto max-w-md py-10">
          <Card className="p-8 text-center">
            <p className="font-display text-lg font-semibold text-[var(--text-heading)]">
              Couldn&apos;t open {subject.name}
            </p>
            {error && <Alert className="mt-4 text-left">{error}</Alert>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/dashboard" className="btn-primary inline-flex justify-center px-5 py-2.5 text-sm">
                Go to dashboard
              </Link>
              <Link to="/explore" className="btn-secondary inline-flex justify-center px-5 py-2.5 text-sm">
                Browse subjects
              </Link>
            </div>
          </Card>
        </div>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <div className="mx-auto max-w-lg py-6">
        <Link
          to={backTo}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
        >
          ← {backLabel}
        </Link>

        <Card className="overflow-hidden p-0">
          <div className="h-1.5" style={{ background: accent.gradient }} aria-hidden />
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md"
                style={{ background: accent.gradient }}
                aria-hidden
              >
                {subject.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 pt-1">
                <h1 className="font-display text-2xl font-semibold text-[var(--text-heading)]">
                  {subject.name}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{topicLabel(subject.topicCount)}</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              How would you like to start? Create a free account to save progress, sign in if you already
              have one, or jump in as a guest — no email required.
            </p>

            {error && <Alert className="mt-5">{error}</Alert>}

            <div className="mt-6 space-y-3">
              <Link
                to={`/register?subject=${encodeURIComponent(subjectId)}`}
                className="btn-primary flex w-full justify-center px-5 py-3 text-sm font-semibold"
              >
                Create account
              </Link>
              <Link
                to={`/login?subject=${encodeURIComponent(subjectId)}`}
                className="btn-secondary flex w-full justify-center px-5 py-3 text-sm font-semibold"
              >
                Sign in
              </Link>
              <Button
                type="button"
                variant="secondary"
                className="w-full py-3"
                loading={guestLoading}
                loadingText="Starting…"
                onClick={handleContinueAsGuest}
              >
                Continue as guest
              </Button>
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-[var(--text-muted)]">
              Guest sessions let you try up to 3 subjects. You can create an account anytime to keep your
              progress.
            </p>
          </div>
        </Card>
      </div>
    </PublicPageLayout>
  );
}
