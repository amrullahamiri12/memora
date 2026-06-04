import { useEffect, useState } from 'react';
import DifficultyBadge from './DifficultyBadge';
import QuestionTypeBadge from './QuestionTypeBadge';
import QuestionFeedback from './QuestionFeedback';

export default function McqCard({
  question,
  difficulty,
  options,
  onAnswer,
  testMode = false,
  onAnswered,
  optionIndexOffset = 0,
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
          selectedText: option.text,
        });
        onAnswered?.(result);
      }
    } catch (err) {
      setSelectedId(null);
      setSubmitting(false);
      throw err;
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (feedback || submitting) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4) {
        const opt = options[num - 1];
        if (opt) handleSelect(opt);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [feedback, submitting, options]);

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
          <QuestionTypeBadge type="MCQ" />
        </div>
        <p className="text-center text-xl font-medium leading-relaxed text-[var(--text-heading)] sm:text-2xl">
          {question}
        </p>
        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          {testMode ? 'Select an answer, then press Next' : 'Choose the best answer (keys 1–4)'}
        </p>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            disabled={!!feedback || submitting || (testMode && !!selectedId)}
            onClick={() => handleSelect(option)}
            className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition active:scale-[0.99] disabled:cursor-default sm:text-base ${optionClass(option)}`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-glow)] text-xs font-bold text-[var(--accent)]">
              {optionIndexOffset + index + 1}
            </span>
            <span className="pt-0.5 text-[var(--text-heading)]">{option.text}</span>
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
