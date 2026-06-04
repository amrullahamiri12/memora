const difficultyStyles = {
  EASY: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]/30',
  MEDIUM: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]/30',
  HARD: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger)]/30',
};

const difficultyLabels = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export default function DifficultyBadge({ difficulty }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wide ${difficultyStyles[difficulty] || 'bg-[var(--surface)] text-[var(--text-muted)]'}`}
    >
      {difficultyLabels[difficulty] || difficulty}
    </span>
  );
}
