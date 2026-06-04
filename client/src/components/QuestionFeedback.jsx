export default function QuestionFeedback({ correct, correctAnswer, testMode }) {
  if (testMode || correct == null) return null;

  return (
    <div
      className={`mt-6 rounded-xl border px-4 py-4 text-center animate-[fadeInUp_0.3s_ease] ${
        correct
          ? 'border-[var(--success)]/30 bg-[var(--success-bg)]'
          : 'border-[var(--danger)]/30 bg-[var(--danger-bg)]'
      }`}
      role="status"
      aria-live="polite"
    >
      <p
        className={`text-lg font-bold ${correct ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}
      >
        {correct ? 'Correct!' : 'Not quite'}
      </p>
      {!correct && correctAnswer && (
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          The right answer is:{' '}
          <span className="font-medium text-[var(--text-heading)]">{correctAnswer}</span>
        </p>
      )}
    </div>
  );
}
