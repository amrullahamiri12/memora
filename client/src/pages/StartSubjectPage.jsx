import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { subjectAccent } from '../utils/studyStorage';
import { startSubjectAsGuest, START_SUBJECT_ERRORS } from '../utils/startSubjectAsGuest';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import PublicNav from '../components/PublicNav';

export default function StartSubjectPage() {
  const { subjectId } = useParams();
  const { user, continueAsGuest, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [phase, setPhase] = useState('loading');

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function run() {
      try {
        setPhase('loading');
        const catalog = await api('/subjects/catalog');
        if (cancelled) return;

        const match = catalog.find((s) => s.id === subjectId);
        if (match) setSubjectName(match.name);

        setPhase('starting');
        const result = await startSubjectAsGuest(subjectId, {
          user,
          continueAsGuest,
          catalog,
        });

        if (cancelled) return;

        if (result.ok) {
          navigate(result.path, { replace: true });
          return;
        }

        if (result.path && result.code !== START_SUBJECT_ERRORS.INVALID_SUBJECT) {
          navigate(result.path, { replace: true });
          return;
        }

        setError(result.message || 'We couldn’t find that subject.');
        setPhase('error');
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Something went wrong. Please try again.');
          setPhase('error');
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, subjectId, user, continueAsGuest, navigate]);

  const accent = subjectName ? subjectAccent(subjectName) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        {phase !== 'error' ? (
          <Card className="w-full max-w-md p-8 text-center">
            {accent && (
              <div
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md"
                style={{ background: accent.gradient }}
                aria-hidden
              >
                {subjectName.charAt(0).toUpperCase()}
              </div>
            )}
            <Spinner className="mx-auto py-0" />
            <p className="mt-5 font-display text-lg font-semibold text-[var(--text-heading)]">
              {subjectName ? `Opening ${subjectName}…` : 'Getting things ready…'}
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {phase === 'starting'
                ? 'Setting up your free practice session'
                : 'Loading subject details'}
            </p>
          </Card>
        ) : (
          <div className="w-full max-w-md text-center">
            <Card className="p-8">
              <p className="font-display text-lg font-semibold text-[var(--text-heading)]">
                Couldn&apos;t open that subject
              </p>
              <Alert className="mt-4 text-left">{error}</Alert>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/explore" className="btn-primary inline-flex justify-center px-5 py-2.5 text-sm">
                  Browse subjects
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-5 py-2.5 text-sm"
                  onClick={() => navigate(-1)}
                >
                  Go back
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
