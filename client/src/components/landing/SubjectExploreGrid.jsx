import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { isGuestUser } from '../../utils/guest';
import { subjectAccent } from '../../utils/studyStorage';
import { startSubjectAsGuest, START_SUBJECT_ERRORS } from '../../utils/startSubjectAsGuest';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { SubjectCardSkeleton } from '../ui/Skeleton';

const STAGGER = [
  'landing-stagger-2',
  'landing-stagger-3',
  'landing-stagger-4',
  'landing-stagger-5',
  'landing-stagger-5',
  'landing-stagger-5',
];

function topicLabel(count) {
  if (count === 1) return '1 topic to explore';
  if (count == null || count === 0) return 'Topics coming soon';
  return `${count} topics to explore`;
}

function SubjectExploreCard({ subject, index, isStarting, disabled, onStart }) {
  const accent = subjectAccent(subject.name);
  const stagger = STAGGER[index % STAGGER.length];

  return (
    <article
      className={`glass-card glass-card-hover flex h-full flex-col overflow-hidden rounded-2xl p-0 ${stagger}`}
      style={{ boxShadow: `0 4px 24px -8px ${accent.glow}` }}
    >
      <div className="h-1.5 shrink-0" style={{ background: accent.gradient }} aria-hidden />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3.5">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-md"
            style={{ background: accent.gradient }}
            aria-hidden
          >
            {subject.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="font-display text-lg font-semibold leading-tight text-[var(--text-heading)]">
              {subject.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{topicLabel(subject.topicCount)}</p>
          </div>
        </div>

        <p className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--accent-glow)] px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden />
          Free — no sign-up needed
        </p>

        <div className="mt-auto">
          <Button
            type="button"
            className="w-full py-2.5"
            loading={isStarting}
            loadingText="Opening…"
            disabled={disabled && !isStarting}
            onClick={() => onStart(subject.id)}
          >
            Start practicing →
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function SubjectExploreGrid({
  limit = null,
  showSearch = true,
  className = '',
  skeletonCount = 3,
  onCatalogLoaded,
  promptBeforeStart = false,
}) {
  const { user, continueAsGuest, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [startingId, setStartingId] = useState(null);
  const [startError, setStartError] = useState('');
  const [startErrorCode, setStartErrorCode] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api('/subjects/catalog')
      .then((rows) => {
        if (cancelled) return;
        setCatalog(rows);
        onCatalogLoaded?.(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load subjects. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, onCatalogLoaded]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = catalog;
    if (q) {
      rows = rows.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (limit != null && limit > 0 && !q) {
      return rows.slice(0, limit);
    }
    return rows;
  }, [catalog, query, limit]);

  const handleStart = async (subjectId) => {
    const needsChooser = !user || isGuestUser(user);
    if (promptBeforeStart && !authLoading && needsChooser) {
      navigate(`/explore/${subjectId}`, { state: { from: location.pathname } });
      return;
    }

    setStartingId(subjectId);
    setStartError('');
    setStartErrorCode('');
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
        setStartErrorCode(result.code);
        setStartError(result.message);
        return;
      }
      if (result.path) {
        navigate(result.path);
        return;
      }
      setStartError(result.message);
    } catch (err) {
      setStartError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setStartingId(null);
    }
  };

  if (loading) {
    return (
      <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SubjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="py-10 text-center">
        <p className="text-[var(--text-heading)] font-medium">We couldn&apos;t load subjects right now</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{error}</p>
        <Button type="button" variant="secondary" className="mt-5" onClick={() => setReloadKey((k) => k + 1)}>
          Try again
        </Button>
      </Card>
    );
  }

  if (catalog.length === 0) {
    return (
      <Card className="py-12 text-center">
        <p className="font-medium text-[var(--text-heading)]">Subjects are on the way</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Check back soon — or{' '}
          <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
            create an account
          </Link>{' '}
          to get notified when new content drops.
        </p>
      </Card>
    );
  }

  const isSearching = query.trim().length > 0;
  const showLimitNote = limit != null && limit > 0 && !isSearching && catalog.length > limit;

  return (
    <div className={className}>
      {showSearch && (
        <div className="mb-6 space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="max-w-md flex-1">
              <Input
                label="Find a subject"
                type="search"
                placeholder="Try Biology, Math, History…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
            {isSearching && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="pb-2 text-sm font-medium text-[var(--accent)] hover:underline sm:pb-3"
              >
                Clear search
              </button>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {isSearching
              ? `${filtered.length} subject${filtered.length === 1 ? '' : 's'} match your search`
              : `${catalog.length} subject${catalog.length === 1 ? '' : 's'} available — tap one to begin`}
          </p>
        </div>
      )}

      {startError && (
        <Alert className="mb-5">
          {startError}
          {startErrorCode === START_SUBJECT_ERRORS.ENROLLMENT_LIMIT && (
            <>
              {' '}
              {(!user || isGuestUser(user)) ? (
                <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
                  Sign up for more subjects
                </Link>
              ) : (
                <>
                  <Link to="/dashboard" className="font-semibold text-[var(--accent)] hover:underline">
                    Open your dashboard
                  </Link>{' '}
                  to manage subjects.
                </>
              )}
            </>
          )}
        </Alert>
      )}

      {filtered.length === 0 ? (
        <Card className="py-10 text-center">
          <p className="font-medium text-[var(--text-heading)]">No matches for &ldquo;{query.trim()}&rdquo;</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Try a different keyword or{' '}
            <button
              type="button"
              onClick={() => setQuery('')}
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              browse all subjects
            </button>
            .
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((subject, index) => (
              <SubjectExploreCard
                key={subject.id}
                subject={subject}
                index={index}
                isStarting={startingId === subject.id}
                disabled={startingId != null && startingId !== subject.id}
                onStart={handleStart}
              />
            ))}
          </div>
          {showLimitNote && (
            <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
              Showing {limit} of {catalog.length} subjects.{' '}
              <Link to="/explore" className="font-semibold text-[var(--accent)] hover:underline">
                See them all →
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
