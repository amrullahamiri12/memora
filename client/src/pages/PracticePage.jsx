import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import PracticeQuestionCard from '../components/PracticeQuestionCard';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import StudyTruncatedNotice from '../components/StudyTruncatedNotice';
import StudyContextHeader from '../components/StudyContextHeader';
import { api } from '../utils/api';
import {
  getStudyOptions,
  buildFlashcardsQuery,
  saveLastTopic,
} from '../utils/studyStorage';

export default function PracticePage() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionMode = searchParams.get('session') || 'learn';
  const isTest = sessionMode === 'test';
  const options = useMemo(() => getStudyOptions(topicId), [topicId]);

  const [topic, setTopic] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [session, setSession] = useState({ reviewed: 0, gotIt: 0, needsPractice: 0 });
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cardKey, setCardKey] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const advanceTimerRef = useRef(null);

  const searchKey = searchParams.toString();
  const queryString = useMemo(() => {
    if (searchKey) {
      const p = new URLSearchParams(searchKey);
      p.set('mode', isTest ? 'test' : 'learn');
      return p.toString();
    }
    return buildFlashcardsQuery(isTest ? 'test' : 'learn', options);
  }, [searchKey, isTest, options]);

  const loadTopic = useCallback(() => {
    return api(`/topics/${topicId}/flashcards?${queryString}`);
  }, [topicId, queryString]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setCurrentIndex(0);
    setFinished(false);
    setCanAdvance(false);
    setSession({ reviewed: 0, gotIt: 0, needsPractice: 0 });

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

  useEffect(() => {
    if (!isTest || !options.timerMinutes) return undefined;
    setTimeLeft(options.timerMinutes * 60);
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isTest, options.timerMinutes, topicId]);

  const goNext = useCallback(() => {
    if (!topic) return;
    setCanAdvance(false);
    if (currentIndex + 1 >= topic.flashcards.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setCardKey((k) => k + 1);
    }
  }, [topic, currentIndex]);

  const handleAnswer = async (selectedAnswer) => {
    const card = topic.flashcards[currentIndex];
    setError('');
    try {
      const result = await api('/progress', {
        method: 'POST',
        body: JSON.stringify({ flashcardId: card.id, selectedAnswer }),
      });

      setSession((prev) => ({
        reviewed: prev.reviewed + 1,
        gotIt: prev.gotIt + (result.correct ? 1 : 0),
        needsPractice: prev.needsPractice + (result.correct ? 0 : 1),
      }));

      return { correct: result.correct, correctAnswer: result.correctAnswer };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleAnswered = (result) => {
    setCanAdvance(true);
    if (options.autoAdvance && !isTest) {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(goNext, 1500);
    }
  };

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  const handleExit = () => {
    if (session.reviewed > 0 && !window.confirm('Leave session? Your progress on answered cards is saved.')) {
      return;
    }
    navigate(`/study/${topicId}`, {
      state: {
        topic: { id: topicId, name: topic?.name, totalCards: topic?.totalAvailable },
        subjectId: topic?.subject?.id,
        subjectName: topic?.subject?.name,
      },
    });
  };

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
          message="No cards match your study options."
          actionLabel="Adjust options"
          actionTo={`/study/${topicId}`}
        />
      </Layout>
    );
  }

  const percentCorrect =
    session.reviewed > 0 ? Math.round((session.gotIt / session.reviewed) * 100) : 0;

  if (finished) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg text-center">
          <Card className="mb-6 session-complete-card">
            <h1 className="mb-2 text-2xl font-bold">
              {isTest ? 'Test complete!' : 'Session complete!'}
            </h1>
            <StudyContextHeader
              className="mb-6"
              subjectId={topic.subject?.id}
              subjectName={topic.subject?.name}
              topicName={topic.name}
              modeLabel={isTest ? 'Test mode' : 'Learn mode'}
            />

            <div className="score-reveal mb-2 text-6xl font-bold text-[var(--accent)]">
              {percentCorrect}%
            </div>
            <p className="mb-8 text-[var(--text-muted)]">correct</p>

            <div className="grid grid-cols-3 gap-4">
              <StatCard value={session.reviewed} label="Answered" />
              <StatCard value={session.gotIt} label="Correct" accent="success" />
              <StatCard value={session.needsPractice} label="Incorrect" accent="warning" />
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() => {
                setFinished(false);
                setCurrentIndex(0);
                setSession({ reviewed: 0, gotIt: 0, needsPractice: 0 });
                setCardKey((k) => k + 1);
                setCanAdvance(false);
                setLoading(true);
                loadTopic().then(setTopic).finally(() => setLoading(false));
              }}
            >
              Study again
            </Button>
            <Link
              to={`/study/${topicId}`}
              state={{
                topic: { id: topicId, name: topic.name, totalCards: topic.totalAvailable },
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
  const modeLabel = isTest ? 'Test' : 'Learn';

  return (
    <Layout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleExit}
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Exit session
        </button>
        {timeLeft !== null && (
          <span className="rounded-full bg-[var(--warning-bg)] px-3 py-1 text-sm font-medium text-[var(--warning)]">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <StudyContextHeader
            subjectId={topic.subject?.id}
            subjectName={topic.subject?.name}
            topicName={topic.name}
            modeLabel={`${modeLabel} mode`}
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
        <PracticeQuestionCard
          card={card}
          onAnswer={handleAnswer}
          testMode={isTest}
          onAnswered={handleAnswered}
        />
      </div>

      <div className="sticky bottom-0 mt-6 pb-4 pt-2">
        <Button className="w-full" disabled={!canAdvance} onClick={goNext}>
          {currentIndex + 1 >= topic.flashcards.length ? 'Finish' : 'Next question'}
        </Button>
      </div>
    </Layout>
  );
}
