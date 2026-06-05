import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ProgressBar';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import AddSubjectsPanel from '../components/AddSubjectsPanel';
import { SubjectCardSkeleton } from '../components/ui/Skeleton';
import { api } from '../utils/api';
import { getLastTopic, subjectAccent } from '../utils/studyStorage';
import { isGuestUser } from '../utils/guest';
import { usesLearnerEnrollment } from '../utils/enrollmentQuota';
import GuestBanner from '../components/GuestBanner';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leavingId, setLeavingId] = useState(null);
  const lastTopic = getLastTopic();
  const learnerEnrollment = usesLearnerEnrollment(user);

  const loadDashboard = () => {
    setLoading(true);
    setError('');
    api('/subjects')
      .then((subjectsData) => {
        setSubjects(subjectsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    api('/profile')
      .then((profile) => {
        if (profile?.stats?.streak != null) setStreak(profile.stats.streak);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!loading && isGuestUser(user) && subjects.length === 0) {
      navigate('/guest/setup', { replace: true });
    }
  }, [loading, user, subjects.length, navigate]);

  const handleLeaveSubject = async (subject) => {
    const confirmed = window.confirm(
      `Leave ${subject.name}? Your progress is saved if you rejoin this subject later.`
    );
    if (!confirmed) return;

    setLeavingId(subject.id);
    setError('');
    try {
      const data = await api(`/subjects/${subject.id}/enroll`, { method: 'DELETE' });
      setSubjects(data.subjects ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLeavingId(null);
    }
  };

  return (
    <Layout>
      <PageHeader
        title={user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your Subjects'}
        subtitle="Your enrolled subjects — add more anytime below"
      />

      {isGuestUser(user) && <GuestBanner />}

      {error && <Alert>{error}</Alert>}

      {!loading && streak > 0 && (
        <div className="mb-6 flex flex-wrap gap-4">
          <StatCard value={streak} label="Day streak" accent="secondary" />
        </div>
      )}

      {lastTopic && subjects.some((s) => s.id === lastTopic.subjectId) && (
        <Card className="mb-8 border-[var(--accent)]/30 p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            Continue studying
          </p>
          <p className="mb-3 font-medium text-[var(--text-heading)]">
            {lastTopic.topicName}
            <span className="text-[var(--text-muted)]"> · {lastTopic.subjectName}</span>
          </p>
          <Link
            to={`/study/${lastTopic.topicId}`}
            state={{
              topic: { id: lastTopic.topicId, name: lastTopic.topicName },
              subjectId: lastTopic.subjectId,
              subjectName: lastTopic.subjectName,
            }}
            className="btn-primary inline-flex"
          >
            Resume study →
          </Link>
        </Card>
      )}

      {learnerEnrollment && (
        <AddSubjectsPanel
          defaultExpanded={!loading && subjects.length === 0}
          enrolledSubjects={subjects}
          onEnrolled={(next) => {
            setSubjects(next);
            loadDashboard();
          }}
        />
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SubjectCardSkeleton key={i} />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="mb-2 text-[var(--text-heading)] font-medium">No subjects yet</p>
          <p className="text-sm text-[var(--text-muted)]">
            Pick subjects in the panel above to start practicing.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const accent = subjectAccent(subject.name);
            const isLeaving = leavingId === subject.id;
            return (
              <Card key={subject.id} hover className="relative h-full overflow-hidden p-0">
                {learnerEnrollment && (
                  <button
                    type="button"
                    disabled={isLeaving}
                    onClick={() => handleLeaveSubject(subject)}
                    className="absolute right-3 top-3 z-10 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-solid)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] shadow-sm transition hover:border-[var(--danger)]/40 hover:text-[var(--danger)] disabled:opacity-50"
                    aria-label={`Leave ${subject.name}`}
                  >
                    {isLeaving ? 'Leaving…' : 'Leave'}
                  </button>
                )}
                <Link to={`/subjects/${subject.id}`} className="block">
                  <div className="h-2" style={{ background: accent.gradient }} />
                  <div className="p-6">
                    <div
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
                      style={{ background: accent.gradient }}
                    >
                      {subject.name.charAt(0)}
                    </div>
                    <h2 className="pr-16 text-lg font-semibold text-[var(--text-heading)]">
                      {subject.name}
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[var(--text-muted)]">
                      {subject.topicCount} topics · {subject.totalCards} cards
                    </p>
                    <ProgressBar percent={subject.progressPercent} label="Mastery" />
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
