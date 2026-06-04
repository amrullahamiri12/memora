import { useState } from 'react';
import DifficultyBadge from './DifficultyBadge';
import QuestionTypeBadge from './QuestionTypeBadge';
import QuestionFeedback from './QuestionFeedback';
import Button from './ui/Button';
import Input from './ui/Input';

export default function FillBlankCard({ parts, difficulty, onAnswer, testMode = false, onAnswered }) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim() || submitting) return;
    if (!testMode && feedback) return;

    setSubmitting(true);
    try {
      const result = await onAnswer(value.trim());
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
      setSubmitting(false);
      throw err;
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="glass-card mb-6 p-8">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <DifficultyBadge difficulty={difficulty} />
          <QuestionTypeBadge type="FILL_BLANK" />
        </div>
        <p className="text-center text-xl font-medium leading-relaxed text-[var(--text-heading)] sm:text-2xl">
          {parts[0]}
          <span className="mx-1 inline-block min-w-[5rem] border-b-2 border-[var(--accent)] text-[var(--accent)]">
            {feedback && !testMode ? (feedback.correct ? value : feedback.correctAnswer) : '___'}
          </span>
          {parts.slice(1).join('___')}
        </p>
        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">Type the missing word or phrase</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Your answer"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={(!testMode && !!feedback) || submitting}
          placeholder="Enter answer..."
          autoComplete="off"
        />
        <Button
          type="submit"
          className="w-full"
          disabled={(!testMode && !!feedback) || submitting || !value.trim()}
        >
          {testMode ? 'Save answer' : 'Check answer'}
        </Button>
      </form>

      <QuestionFeedback
        correct={feedback?.correct}
        correctAnswer={feedback?.correctAnswer}
        testMode={testMode}
      />
    </div>
  );
}
