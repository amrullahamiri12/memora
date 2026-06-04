import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import { api } from '../../utils/api';

export default function AdminReportsContent() {
  const [data, setData] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/reports/content')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <PageHeader
        title="Content health"
        subtitle="Enrollment, usage, and mastery by subject and topic"
        action={
          <Link to="/admin/reports">
            <Button variant="secondary">Back to reports</Button>
          </Link>
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : (
        data && (
          <>
            <div className="mb-8 grid gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="mb-3 text-lg font-semibold text-[var(--text-heading)]">
                  Enrolled but unused topics
                </h2>
                {data.insights.unusedTopics.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">None flagged.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.insights.unusedTopics.map((t) => (
                      <li key={`${t.subjectName}-${t.topicName}`}>
                        <span className="font-medium text-[var(--text-heading)]">
                          {t.subjectName} / {t.topicName}
                        </span>
                        <span className="text-[var(--text-muted)]">
                          {' '}
                          — {t.enrolledLearners} enrolled, no progress
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card>
                <h2 className="mb-3 text-lg font-semibold text-[var(--text-heading)]">
                  Lowest mastery topics
                </h2>
                {data.insights.lowMasteryTopics.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Not enough data yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.insights.lowMasteryTopics.map((t) => (
                      <li key={`${t.subjectName}-${t.topicName}`}>
                        <span className="font-medium text-[var(--text-heading)]">
                          {t.subjectName} / {t.topicName}
                        </span>
                        <span className="text-[var(--text-muted)]">
                          {' '}
                          — {t.avgMasteryPercent}% mastery, {t.needsPractice} needs practice
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div className="space-y-4">
              {data.subjects.map((subject) => (
                <Card key={subject.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left"
                    onClick={() =>
                      setExpandedId(expandedId === subject.id ? null : subject.id)
                    }
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--text-heading)]">
                        {subject.name}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {subject.topicCount} topics · {subject.cardCount} cards ·{' '}
                        {subject.enrolledLearners} enrolled · {subject.learnersWithProgress} with
                        progress · {subject.avgMasteryPercent}% avg mastery
                      </p>
                    </div>
                    <span className="text-sm text-[var(--accent)]">
                      {expandedId === subject.id ? 'Hide topics' : 'Show topics'}
                    </span>
                  </button>

                  {expandedId === subject.id && (
                    <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border)]">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-[var(--surface-solid)]">
                            <th className="px-3 py-2 font-semibold text-[var(--text-muted)]">
                              Topic
                            </th>
                            <th className="px-3 py-2 font-semibold text-[var(--text-muted)]">
                              Cards
                            </th>
                            <th className="px-3 py-2 font-semibold text-[var(--text-muted)]">
                              Enrolled
                            </th>
                            <th className="px-3 py-2 font-semibold text-[var(--text-muted)]">
                              Active
                            </th>
                            <th className="px-3 py-2 font-semibold text-[var(--text-muted)]">
                              Mastery
                            </th>
                            <th className="px-3 py-2 font-semibold text-[var(--text-muted)]">
                              Needs practice
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {subject.topics.map((topic) => (
                            <tr
                              key={topic.id}
                              className={`border-t border-[var(--border)] ${
                                topic.unused ? 'bg-amber-500/5' : topic.struggling ? 'bg-red-500/5' : ''
                              }`}
                            >
                              <td className="px-3 py-2 font-medium">{topic.name}</td>
                              <td className="px-3 py-2">{topic.cardCount}</td>
                              <td className="px-3 py-2">{topic.enrolledLearners}</td>
                              <td className="px-3 py-2">{topic.learnersWithProgress}</td>
                              <td className="px-3 py-2">{topic.avgMasteryPercent}%</td>
                              <td className="px-3 py-2">{topic.needsPractice}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        )
      )}
    </Layout>
  );
}
