import { subjectAccent } from '../utils/studyStorage';

export default function SubjectPicker({
  subjects,
  selectedIds,
  onChange,
  disabled = false,
}) {
  if (!subjects.length) {
    return <p className="text-sm text-[var(--text-muted)]">No subjects available yet.</p>;
  }

  const toggle = (id) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {subjects.map((subject) => {
        const checked = selectedIds.includes(subject.id);
        const accent = subjectAccent(subject.name);
        return (
          <label
            key={subject.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
              checked
                ? 'border-[var(--accent)] bg-[var(--accent-glow)]'
                : 'border-[var(--border-strong)] bg-[var(--surface-solid)] hover:border-[var(--accent)]/50'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(subject.id)}
              className="mt-1 h-4 w-4 rounded accent-[var(--accent)]"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ background: accent.gradient }}
                >
                  {subject.name.charAt(0)}
                </span>
                <span className="font-semibold text-[var(--text-heading)]">{subject.name}</span>
              </span>
              {subject.topicCount != null && (
                <span className="mt-1 block text-xs text-[var(--text-muted)]">
                  {subject.topicCount} topic{subject.topicCount !== 1 ? 's' : ''}
                  {subject.totalCards != null ? ` · ${subject.totalCards} cards` : ''}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
