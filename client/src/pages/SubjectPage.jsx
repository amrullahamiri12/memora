import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ProgressBar';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { api } from '../utils/api';

const TOPICS_PAGE_SIZE = 12;

export default function SubjectPage() {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [topicsPagination, setTopicsPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(1);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    api(`/subjects/${id}/topics?page=${page}&limit=${TOPICS_PAGE_SIZE}`)
      .then((data) => {
        setSubject({ id: data.id, name: data.name, topics: data.topics });
        setTopicsPagination(data.topicsPagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, page]);

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

  return (
    <Layout>
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
      >
        ← Back to subjects
      </Link>
      <PageHeader
        title={subject.name}
        subtitle="Choose a topic, then pick how you want to study"
      />

      {(topicsPagination?.total ?? subject.topics?.length ?? 0) === 0 ? (
        <EmptyState message="No topics in this subject yet." actionLabel="Back to dashboard" actionTo="/dashboard" />
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2">
          {subject.topics.map((topic) => (
            <Link
              key={topic.id}
              to={`/study/${topic.id}`}
              state={{
                topic,
                subjectId: id,
                subjectName: subject.name,
              }}
              className="block"
            >
              <Card hover>
                <h2 className="text-lg font-semibold text-[var(--text-heading)]">{topic.name}</h2>
                <p className="mt-1 mb-3 text-sm text-[var(--text-muted)]">{topic.totalCards} cards</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--success-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--success)]">
                    {topic.mastered} mastered
                  </span>
                  <span className="rounded-full bg-[var(--warning-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--warning)]">
                    {topic.needsPractice} need practice
                  </span>
                </div>
                <ProgressBar percent={topic.progressPercent} />
              </Card>
            </Link>
          ))}
        </div>
        {topicsPagination && (
          <Pagination
            className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
            page={topicsPagination.page}
            totalPages={topicsPagination.totalPages}
            total={topicsPagination.total}
            limit={topicsPagination.limit}
            onPageChange={setPage}
          />
        )}
        </>
      )}
    </Layout>
  );
}
