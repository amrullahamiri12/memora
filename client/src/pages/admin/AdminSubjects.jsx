import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { api } from '../../utils/api';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [addingTopicFor, setAddingTopicFor] = useState(null);
  const [newTopic, setNewTopic] = useState('');
  const [editingTopic, setEditingTopic] = useState(null);
  const [editTopicName, setEditTopicName] = useState('');
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  const isExpanded = useCallback((subjectId) => !collapsedIds.has(subjectId), [collapsedIds]);

  const toggleSubject = (subjectId) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  };

  const expandSubject = (subjectId) => {
    setCollapsedIds((prev) => {
      if (!prev.has(subjectId)) return prev;
      const next = new Set(prev);
      next.delete(subjectId);
      return next;
    });
  };

  const expandAll = () => setCollapsedIds(new Set());

  const collapseAll = () => {
    setCollapsedIds(new Set(subjects.map((s) => s.id)));
  };

  const loadSubjects = () => {
    setLoading(true);
    api('/admin/subjects')
      .then(setSubjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setError('');
    try {
      await api('/admin/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: newSubject.trim() }),
      });
      setNewSubject('');
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateSubject = async (id) => {
    if (!editSubjectName.trim()) return;
    setError('');
    try {
      await api(`/admin/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editSubjectName.trim() }),
      });
      setEditingSubject(null);
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteSubject = async (subject) => {
    if (
      !confirm(
        `Delete "${subject.name}" and all ${subject.cardCount} flashcards in its topics? This cannot be undone.`
      )
    ) {
      return;
    }
    setError('');
    try {
      await api(`/admin/subjects/${subject.id}`, { method: 'DELETE' });
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddTopic = async (subjectId) => {
    if (!newTopic.trim()) return;
    setError('');
    try {
      await api('/admin/topics', {
        method: 'POST',
        body: JSON.stringify({ subjectId, name: newTopic.trim() }),
      });
      setNewTopic('');
      setAddingTopicFor(null);
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTopic = async (id) => {
    if (!editTopicName.trim()) return;
    setError('');
    try {
      await api(`/admin/topics/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editTopicName.trim() }),
      });
      setEditingTopic(null);
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTopic = async (topic) => {
    if (
      !confirm(
        `Delete topic "${topic.name}" and its ${topic.cardCount} flashcards? This cannot be undone.`
      )
    ) {
      return;
    }
    setError('');
    try {
      await api(`/admin/topics/${topic.id}`, { method: 'DELETE' });
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Manage Subjects"
        subtitle="Create subjects and topics for organizing flashcards"
        action={
          <Link to="/admin/reports/content">
            <Button variant="secondary">Content health</Button>
          </Link>
        }
      />

      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleAddSubject} className="mb-8 flex flex-wrap gap-3">
        <Input
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="New subject name (e.g. Web Development)"
          className="min-w-[200px] flex-1"
        />
        <Button type="submit">Add Subject</Button>
      </form>

      {loading ? (
        <Spinner />
      ) : subjects.length === 0 ? (
        <EmptyState message="No subjects yet. Add one above or import flashcards via CSV." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-end gap-4">
            <button
              type="button"
              onClick={expandAll}
              disabled={subjects.every((s) => isExpanded(s.id))}
              className="text-sm font-medium text-[var(--accent)] hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              disabled={subjects.every((s) => !isExpanded(s.id))}
              className="text-sm font-medium text-[var(--accent)] hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              Collapse all
            </button>
          </div>
          {subjects.map((subject) => {
            const expanded = isExpanded(subject.id);
            return (
            <Card key={subject.id}>
              <div
                className={`flex flex-wrap items-center justify-between gap-3 ${expanded ? 'mb-4' : ''}`}
              >
                {editingSubject === subject.id ? (
                  <div className="flex flex-1 flex-wrap gap-2">
                    <Input
                      value={editSubjectName}
                      onChange={(e) => setEditSubjectName(e.target.value)}
                      className="min-w-[160px] flex-1 text-lg font-semibold"
                    />
                    <Button type="button" onClick={() => handleUpdateSubject(subject.id)}>
                      Save
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setEditingSubject(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSubject(subject.id)}
                      className="mt-0.5 shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-solid)] hover:text-[var(--text-heading)]"
                      aria-expanded={expanded}
                      aria-label={expanded ? `Collapse ${subject.name}` : `Expand ${subject.name}`}
                    >
                      <svg
                        className={`h-5 w-5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSubject(subject.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <h2 className="text-lg font-semibold text-[var(--text-heading)]">{subject.name}</h2>
                      <p className="text-sm text-[var(--text-muted)]">
                        {subject.topicCount} topics · {subject.cardCount} cards
                        {!expanded && subject.topics.length > 0 && (
                          <span className="text-[var(--text-muted)]"> · click to expand</span>
                        )}
                      </p>
                    </button>
                  </div>
                )}
                {editingSubject !== subject.id && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubject(subject.id);
                        setEditSubjectName(subject.name);
                        expandSubject(subject.id);
                      }}
                      className="text-sm font-medium text-[var(--accent)] hover:underline"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(subject)}
                      className="text-sm font-medium text-[var(--danger)] hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {expanded && (
              <>
              <div className="space-y-2">
                {subject.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--surface-solid)] px-4 py-2.5"
                  >
                    {editingTopic === topic.id ? (
                      <div className="flex flex-1 flex-wrap gap-2">
                        <Input
                          value={editTopicName}
                          onChange={(e) => setEditTopicName(e.target.value)}
                          className="min-w-[120px] flex-1 text-sm"
                        />
                        <Button type="button" onClick={() => handleUpdateTopic(topic.id)}>
                          Save
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingTopic(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-[var(--text-heading)]">
                          {topic.name}{' '}
                          <span className="text-[var(--text-muted)]">({topic.cardCount} cards)</span>
                        </span>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTopic(topic.id);
                              setEditTopicName(topic.name);
                              expandSubject(subject.id);
                            }}
                            className="text-xs font-medium text-[var(--accent)] hover:underline"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(topic)}
                            className="text-xs font-medium text-[var(--danger)] hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {addingTopicFor === subject.id ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Topic name"
                    className="min-w-[120px] flex-1 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(subject.id)}
                  />
                  <Button type="button" onClick={() => handleAddTopic(subject.id)}>
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setAddingTopicFor(null);
                      setNewTopic('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    expandSubject(subject.id);
                    setAddingTopicFor(subject.id);
                  }}
                  className="mt-3 text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  + Add topic
                </button>
              )}
              </>
              )}
            </Card>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
