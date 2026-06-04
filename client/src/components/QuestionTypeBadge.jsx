const LABELS = {
  MCQ: 'Multiple choice',
  TRUE_FALSE: 'True / False',
  FILL_BLANK: 'Fill in blank',
};

const STYLES = {
  MCQ: 'bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/20',
  TRUE_FALSE: 'bg-[var(--tone-cyan-bg)] text-[var(--tone-cyan)] border border-[var(--tone-cyan)]/25',
  FILL_BLANK: 'bg-[var(--tone-olive-bg)] text-[var(--tone-olive)] border border-[var(--tone-olive)]/25',
};

export default function QuestionTypeBadge({ type = 'MCQ' }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[type] || STYLES.MCQ}`}
    >
      {LABELS[type] || type}
    </span>
  );
}
