import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import DifficultyBadge from '../../components/DifficultyBadge';
import QuestionTypeBadge from '../../components/QuestionTypeBadge';
import CsvImport from '../../components/CsvImport';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import { api } from '../../utils/api';

const emptyForm = {
  subject: '',
  topic: '',
  questionType: 'MCQ',
  question: '',
  answer: '',
  distractor1: '',
  distractor2: '',
  distractor3: '',
  difficulty: 'EASY',
};

const TYPE_HINTS = {
  MCQ: 'Write a question and correct answer. Add three wrong options (or leave blank to auto-generate from other MCQ cards in the topic).',
  TRUE_FALSE: 'Write a statement the learner marks true or false. Set the answer to True or False.',
  FILL_BLANK: 'Use ___ in the question where the answer goes (e.g. "Tokenization splits text into ___.").',
};

const PAGE_SIZE = 20;

export default function AdminFlashcards() {
  const [flashcards, setFlashcards] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadFlashcards = (targetPage = page) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(targetPage),
      limit: String(PAGE_SIZE),
    });
    if (search) params.set('search', search);

    return api(`/admin/flashcards?${params}`)
      .then((data) => {
        setFlashcards(data.items);
        setPagination(data.pagination);
        setPage(data.pagination.page);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFlashcards(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  useEffect(() => {
    api('/admin/subjects').then(setSubjects).catch(() => {});
  }, []);

  const topicOptions = subjects
    .find((s) => s.name === form.subject)
    ?.topics.map((t) => t.name) || [];

  const handleEdit = (card) => {
    setForm({
      subject: card.subjectName,
      topic: card.topicName,
      questionType: card.questionType || 'MCQ',
      question: card.question,
      answer: card.answer,
      distractor1: card.distractor1 || '',
      distractor2: card.distractor2 || '',
      distractor3: card.distractor3 || '',
      difficulty: card.difficulty,
    });
    setEditingId(card.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this flashcard?')) return;
    try {
      await api(`/admin/flashcards/${id}`, { method: 'DELETE' });
      const nextPage =
        flashcards.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else loadFlashcards(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTypeChange = (questionType) => {
    setForm((prev) => ({
      ...prev,
      questionType,
      distractor1: questionType === 'MCQ' ? prev.distractor1 : '',
      distractor2: questionType === 'MCQ' ? prev.distractor2 : '',
      distractor3: questionType === 'MCQ' ? prev.distractor3 : '',
      answer: questionType === 'TRUE_FALSE' && !['True', 'False'].includes(prev.answer) ? 'True' : prev.answer,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingId) {
        await api(`/admin/flashcards/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await api('/admin/flashcards', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      loadFlashcards(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <Layout>
      <PageHeader
        title="Manage Flashcards"
        subtitle={`${pagination.total} cards total`}
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>+ Add Flashcard</Button>
          )
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="mb-8">
        <CsvImport
          onImported={() => {
            setPage(1);
            loadFlashcards(1);
            api('/admin/subjects').then(setSubjects).catch(() => {});
          }}
        />
      </div>

      {showForm && (
        <Card className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? 'Edit Flashcard' : 'New Flashcard'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Input
                  label="Subject"
                  list="subject-options"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value, topic: '' })}
                  required
                />
                <datalist id="subject-options">
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <Input
                  label="Topic"
                  list="topic-options"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  required
                />
                <datalist id="topic-options">
                  {topicOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <Select
                label="Question type"
                value={form.questionType}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="MCQ">Multiple choice</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="FILL_BLANK">Fill in the blank</option>
              </Select>
              <Select
                label="Difficulty"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </Select>
              <div className="sm:col-span-2">
                <p className="mb-3 text-sm text-[var(--text-muted)]">{TYPE_HINTS[form.questionType]}</p>
                <Textarea
                  label={form.questionType === 'TRUE_FALSE' ? 'Statement' : 'Question'}
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  rows={2}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                {form.questionType === 'TRUE_FALSE' ? (
                  <Select
                    label="Correct answer"
                    value={form.answer === 'False' ? 'False' : 'True'}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  >
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </Select>
                ) : (
                  <Textarea
                    label={form.questionType === 'FILL_BLANK' ? 'Answer (fills the blank)' : 'Answer (correct)'}
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    rows={2}
                    required
                  />
                )}
              </div>
              {form.questionType === 'MCQ' && (
                <div className="sm:col-span-2">
                  <p className="mb-3 text-sm font-medium text-[var(--text-heading)]">
                    Wrong answers for multiple-choice practice
                  </p>
                  <p className="mb-3 text-sm text-[var(--text-muted)]">
                    Three incorrect options shown with the correct answer. Leave blank to auto-pick
                    from other MCQ cards in the same topic.
                  </p>
                  <div className="grid gap-4">
                    <Textarea
                      label="Wrong option 1"
                      value={form.distractor1}
                      onChange={(e) => setForm({ ...form, distractor1: e.target.value })}
                      rows={2}
                    />
                    <Textarea
                      label="Wrong option 2"
                      value={form.distractor2}
                      onChange={(e) => setForm({ ...form, distractor2: e.target.value })}
                      rows={2}
                    />
                    <Textarea
                      label="Wrong option 3"
                      value={form.distractor3}
                      onChange={(e) => setForm({ ...form, distractor3: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <Button type="submit" loading={saving}>
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <form
        className="mb-4 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
          setPage(1);
        }}
      >
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search question, answer, subject, or topic…"
          className="min-w-[200px] flex-1"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)]">
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Question</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Type</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Subject / Topic</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Difficulty</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flashcards.map((card, i) => (
                <tr
                  key={card.id}
                  className={`border-b border-[var(--border)] transition hover:bg-[var(--surface-hover)] ${i % 2 === 1 ? 'bg-[var(--surface)]/50' : ''}`}
                >
                  <td className="max-w-xs truncate px-4 py-3 text-[var(--text-heading)]">
                    {card.question}
                  </td>
                  <td className="px-4 py-3">
                    <QuestionTypeBadge type={card.questionType || 'MCQ'} />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {card.subjectName} / {card.topicName}
                  </td>
                  <td className="px-4 py-3">
                    <DifficultyBadge difficulty={card.difficulty} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(card)}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(card.id)}
                        className="font-medium text-[var(--danger)] hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        </div>
      )}
    </Layout>
  );
}
