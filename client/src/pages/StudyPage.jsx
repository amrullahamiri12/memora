import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StudyModeCard from '../components/StudyModeCard';
import StudyOptions from '../components/StudyOptions';
import StudyContextHeader from '../components/StudyContextHeader';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import { api } from '../utils/api';
import {
  getStudyOptions,
  saveStudyOptions,
  buildFlashcardsQuery,
} from '../utils/studyStorage';

export default function StudyPage() {
  const { topicId } = useParams();
  const location = useLocation();
  const stateTopic = location.state?.topic;
  const subjectId = location.state?.subjectId;
  const subjectNameFromState = location.state?.subjectName;

  const [topic, setTopic] = useState(stateTopic || null);
  const [subjectName, setSubjectName] = useState(subjectNameFromState || null);
  const [options, setOptions] = useState(() => getStudyOptions(topicId));
  const [cardCount, setCardCount] = useState(stateTopic?.totalCards ?? null);
  const [loading, setLoading] = useState(!stateTopic);
  const [error, setError] = useState('');

  useEffect(() => {
    saveStudyOptions(topicId, options);
  }, [topicId, options]);

  useEffect(() => {
    if (stateTopic) {
      setTopic(stateTopic);
      setCardCount(stateTopic.totalCards);
      if (subjectNameFromState) setSubjectName(subjectNameFromState);
      setLoading(false);
      return;
    }
    if (!subjectId) {
      api(`/topics/${topicId}/flashcards?mode=learn&shuffle=false`)
        .then((data) => {
          setTopic({
            id: data.id,
            name: data.name,
            totalCards: data.totalAvailable,
            subjectId: data.subject?.id,
          });
          if (data.subject?.name) setSubjectName(data.subject.name);
          setCardCount(data.totalAvailable);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
      return;
    }
    api(`/subjects/${subjectId}/topics`)
      .then((subject) => {
        setSubjectName(subject.name);
        const found = subject.topics.find((t) => t.id === topicId);
        if (found) {
          setTopic(found);
          setCardCount(found.totalCards);
        } else {
          setError('Topic not found');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [subjectId, subjectNameFromState, topicId, stateTopic]);

  useEffect(() => {
    const q = buildFlashcardsQuery('learn', options);
    api(`/topics/${topicId}/flashcards?${q}`)
      .then((data) => setCardCount(data.flashcards.length))
      .catch(() => {});
  }, [topicId, options]);

  const handleOptionsChange = (next) => {
    setOptions(next);
    saveStudyOptions(topicId, next);
  };

  const query = buildFlashcardsQuery('learn', options);

  if (loading) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  if (error || !topic) {
    return (
      <Layout>
        <Alert>{error || 'Topic not found'}</Alert>
        <Link to="/dashboard" className="mt-4 text-[var(--accent)] hover:underline">
          Back to dashboard
        </Link>
      </Layout>
    );
  }

  const resolvedSubjectId = subjectId || topic?.subjectId;
  const backTo = resolvedSubjectId ? `/subjects/${resolvedSubjectId}` : '/dashboard';

  return (
    <Layout>
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
      >
        ← Back to topics
      </Link>

      <StudyContextHeader
        className="mb-2"
        subjectId={resolvedSubjectId}
        subjectName={subjectName}
        topicName={topic.name}
      />
      <p className="mb-8 text-base text-[var(--text-muted)]">
        {cardCount ?? '…'} cards · Pick how you want to study
      </p>

      <StudyOptions options={options} onChange={handleOptionsChange} />

      {cardCount === 0 ? (
        <Alert>
          No cards match your filters. Try turning off &quot;Need practice only&quot; or enable more
          question types.
        </Alert>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StudyModeCard mode="learn" topicId={topicId} cardCount={cardCount} optionsQuery={query} />
          <StudyModeCard
            mode="flashcards"
            topicId={topicId}
            cardCount={cardCount}
            optionsQuery={buildFlashcardsQuery('flashcards', { ...options, types: { MCQ: true, TRUE_FALSE: true, FILL_BLANK: true } })}
          />
          <StudyModeCard
            mode="test"
            topicId={topicId}
            cardCount={cardCount}
            optionsQuery={buildFlashcardsQuery('test', options)}
          />
        </div>
      )}
    </Layout>
  );
}
