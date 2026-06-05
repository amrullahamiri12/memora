import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import FlashCard from '../components/FlashCard';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import StudyTruncatedNotice from '../components/StudyTruncatedNotice';
import StudyContextHeader from '../components/StudyContextHeader';
import { api } from '../utils/api';
import { getStudyOptions, buildFlashcardsQuery, saveLastTopic } from '../utils/studyStorage';

export default function FlashcardsPage() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [session, setSession] = useState({ reviewed: 0, gotIt: 0, needsPractice: 0 });
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cardKey, setCardKey] = useState(0);

  const searchKey = searchParams.toString();
  const queryString = useMemo(() => {
    if (searchKey) {
      const p = new URLSearchParams(searchKey);
      p.set('mode', 'flashcards');
      return p.toString();
    }
    return buildFlashcardsQuery('flashcards', getStudyOptions(topicId));
  }, [searchKey, topicId]);

  const loadTopic = useCallback(() => {
    return api(`/topics/${topicId}/flashcards?${queryString}`);
  }, [topicId, queryString]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadTopic()
      .then((data) => {
        if (cancelled) return;
        setTopic(data);
        saveLastTopic({
          id: data.id,
          name: data.name,
          subjectId: data.subject.id,
          subjectName: data.subject.name,
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadTopic]);

  const handleRate = async (status) => {
    const card = topic.flashcards[currentIndex];
    setError('');
    try {
      await api('/progress', {
        method: 'POST',
        body: JSON.stringify({ flashcardId: card.id, status }),
      });
    } catch (err) {
      setError(err.message);
      return;
    }

    setSession((prev) => ({
      reviewed: prev.reviewed + 1,
      gotIt: prev.gotIt + (status === 'GOT_IT' ? 1 : 0),
      needsPractice: prev.needsPractice + (status === 'NEEDS_PRACTICE' ? 1 : 0),
    }));

    if (currentIndex + 1 >= topic.flashcards.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setCardKey((k) => k + 1);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (loading) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  if (error && !topic) {
    return (
      <Layout>
        <Alert>{error}</Alert>
      </Layout>
    );
  }

  if (!topic?.flashcards?.length) {
    return (
      <Layout>
        <EmptyState
          message="No cards to study with these options."
          actionLabel="Change study options"
          actionTo={`/study/${topicId}`}
        />
      </Layout>
    );
  }

  if (finished) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg text-center">
          <Card className="mb-6 session-complete-card">
            <h1 className="mb-2 text-2xl font-bold">Flashcards complete!</h1>
            <StudyContextHeader
              className="mb-6"
              subjectId={topic.subject?.id}
              subjectName={topic.subject?.name}
              topicName={topic.name}
              modeLabel="Flashcards"
            />
            <div className="grid grid-cols-3 gap-4">
              <StatCard value={session.reviewed} label="Reviewed" />
              <StatCard value={session.gotIt} label="Got it" accent="success" />
              <StatCard value={session.needsPractice} label="Need practice" accent="warning" />
            </div>
          </Card>
          <div className="flex gap-4">
            <Button
              className="flex-1"
              onClick={() => {
                setFinished(false);
                setCurrentIndex(0);
                setSession({ reviewed: 0, gotIt: 0, needsPractice: 0 });
                setCardKey((k) => k + 1);
                setLoading(true);
                loadTopic().then(setTopic).finally(() => setLoading(false));
              }}
            >
              Study again
            </Button>
            <Link
              to={`/study/${topicId}`}
              state={{
                topic: { id: topicId, name: topic.name, totalCards: topic.flashcards.length },
                subjectId: topic.subject.id,
                subjectName: topic.subject.name,
              }}
              className="flex-1"
            >
              <Button variant="secondary" className="w-full">
                Study hub
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const card = topic.flashcards[currentIndex];
  const progressPercent = Math.round((session.reviewed / topic.flashcards.length) * 100);

  return (
    <Layout>
      <Link
        to={`/study/${topicId}`}
        state={{
          topic: { id: topicId, name: topic.name, totalCards: topic.totalAvailable },
          subjectId: topic.subject.id,
          subjectName: topic.subject.name,
        }}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
      >
        ← Study options
      </Link>

      <div className="mb-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <StudyContextHeader
            subjectId={topic.subject?.id}
            subjectName={topic.subject?.name}
            topicName={topic.name}
            modeLabel="Flashcards"
            hint="Tap card to flip"
          />
          <span className="shrink-0 rounded-full bg-[var(--accent-glow)] px-3 py-1 text-sm font-medium text-[var(--accent)]">
            {currentIndex + 1} / {topic.flashcards.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <StudyTruncatedNotice topic={topic} />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="card-enter" key={cardKey}>
        <FlashCard
          question={card.question}
          answer={card.answer}
          difficulty={card.difficulty}
          onRate={handleRate}
          showActions
        />
      </div>
    </Layout>
  );
}
