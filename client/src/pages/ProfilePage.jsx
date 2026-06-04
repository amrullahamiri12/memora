import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ProgressBar';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { api } from '../utils/api';

const TOPICS_PAGE_SIZE = 10;

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [topicsPage, setTopicsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api(`/profile?page=${topicsPage}&limit=${TOPICS_PAGE_SIZE}`)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [topicsPage]);

  if (loading) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert>{error}</Alert>
      </Layout>
    );
  }

  const { user, stats, topics, topicsPagination, streakDays = [] } = profile;
  const masteryPercent =
    stats.totalReviewed > 0 ? Math.round((stats.mastered / stats.totalReviewed) * 100) : 0;

  return (
    <Layout>
      <PageHeader title="Your Profile" subtitle={user.email} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={stats.streak} label="Day streak" accent="secondary" />
        <StatCard value={stats.topicsStudied} label="Topics studied" />
        <StatCard value={stats.mastered} label="Cards mastered" accent="success" />
        <StatCard value={stats.needsPractice} label="Need practice" accent="warning" />
      </div>

      {streakDays.length > 0 && (
        <Card className="mb-8 p-5">
          <h2 className="mb-4 text-lg font-semibold">Last 7 days</h2>
          <div className="flex justify-between gap-2">
            {streakDays.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`h-10 w-full max-w-[2.5rem] rounded-lg transition ${
                    day.practiced
                      ? 'bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]'
                      : 'bg-[var(--border)]'
                  }`}
                  title={day.date}
                />
                <span className="text-[10px] text-[var(--text-muted)]">
                  {new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, {
                    weekday: 'narrow',
                  })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Overall Mastery</h2>
        <ProgressBar
          percent={masteryPercent}
          label={`${stats.mastered} of ${stats.totalReviewed} reviewed cards mastered`}
        />
      </Card>

      <p className="mb-8 text-sm text-[var(--text-muted)]">
        To change your password, go to{' '}
        <Link to="/account" className="font-semibold text-[var(--accent)] hover:underline">
          Account Settings
        </Link>
        .
      </p>

      {topics.length > 0 ? (
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            Topics
            {topicsPagination?.total > topics.length && (
              <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                ({topicsPagination.total} total)
              </span>
            )}
          </h2>
          <div className="space-y-4">
            {topics.map((topic) => {
              const percent =
                topic.totalReviewed > 0
                  ? Math.round((topic.mastered / topic.totalReviewed) * 100)
                  : 0;
              return (
                <Card key={topic.id} className="p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--text-heading)]">{topic.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">{topic.subjectName}</p>
                    </div>
                    <Link
                      to={`/study/${topic.id}`}
                      state={{
                        topic: {
                          id: topic.id,
                          name: topic.name,
                          totalCards: topic.totalCards ?? topic.totalReviewed,
                        },
                        subjectId: topic.subjectId,
                        subjectName: topic.subjectName,
                      }}
                    >
                      <Button type="button" className="text-sm py-2">
                        Practice
                      </Button>
                    </Link>
                  </div>
                  <div className="mb-3 flex gap-2 text-xs">
                    <span className="rounded-full bg-[var(--success-bg)] px-2.5 py-0.5 font-medium text-[var(--success)]">
                      {topic.mastered} mastered
                    </span>
                    <span className="rounded-full bg-[var(--warning-bg)] px-2.5 py-0.5 font-medium text-[var(--warning)]">
                      {topic.needsPractice} practice
                    </span>
                  </div>
                  <ProgressBar percent={percent} />
                </Card>
              );
            })}
          </div>
          {topicsPagination && (
            <Pagination
              className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              page={topicsPagination.page}
              totalPages={topicsPagination.totalPages}
              total={topicsPagination.total}
              limit={topicsPagination.limit}
              onPageChange={setTopicsPage}
            />
          )}
        </div>
      ) : (
        <Card className="py-12 text-center">
          <p className="text-[var(--text-muted)]">Start a study session to see topic progress here.</p>
          <Link to="/dashboard" className="btn-primary mt-4 inline-flex">
            Browse subjects
          </Link>
        </Card>
      )}
    </Layout>
  );
}
