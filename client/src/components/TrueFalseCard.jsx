import { useState } from 'react';
import DifficultyBadge from './DifficultyBadge';
import QuestionTypeBadge from './QuestionTypeBadge';
import QuestionFeedback from './QuestionFeedback';

export default function TrueFalseCard({
  question,
  difficulty,
  options,
  onAnswer,
  testMode = false,
  onAnswered,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = async (option) => {
    if (selectedId || submitting) return;

    setSelectedId(option.id);
    setSubmitting(true);

    try {
      const result = await onAnswer(option.text);
      if (testMode) {
        onAnswered?.(result);
      } else {
        setFeedback({
          correct: result.correct,
          correctAnswer: result.correctAnswer,
        });
        onAnswered?.(result);
      }
    } catch (err) {
      setSelectedId(null);
      setSubmitting(false);
      throw err;
    }
  };

  const optionClass = (option) => {
    if (testMode && selectedId === option.id) {
      return 'border-[var(--accent)] bg-[var(--accent-glow)]';
    }
    if (!feedback) {
      return 'border-[var(--border-strong)] bg-[var(--surface-solid)] hover:border-[var(--accent)] hover:bg-[var(--accent-glow)]';
    }
    if (option.id === selectedId) {
      return feedback.correct
        ? 'border-[var(--success)] bg-[var(--success-bg)] text-[var(--success)]'
        : 'border-[var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]';
    }
    if (normalize(option.text) === normalize(feedback.correctAnswer)) {
      return 'border-[var(--success)] bg-[var(--success-bg)]/50';
    }
    return 'border-[var(--border)] bg-[var(--surface)] opacity-60';
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="glass-card mb-6 p-8">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <DifficultyBadge difficulty={difficulty} />
          <QuestionTypeBadge type="TRUE_FALSE" />
        </div>
        <p className="text-center text-xl font-medium leading-relaxed text-[var(--text-heading)] sm:text-2xl">
          {question}
        </p>
        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">True or false?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={!!feedback || submitting || (testMode && !!selectedId)}
            onClick={() => handleSelect(option)}
            className={`rounded-xl border-2 px-4 py-4 text-center text-lg font-bold transition active:scale-[0.99] disabled:cursor-default ${optionClass(option)}`}
          >
            {option.text}
          </button>
        ))}
      </div>

      <QuestionFeedback
        correct={feedback?.correct}
        correctAnswer={feedback?.correctAnswer}
        testMode={testMode}
      />
    </div>
  );
}

function normalize(text) {
  return String(text).trim().toLowerCase().replace(/\s+/g, ' ');
}
