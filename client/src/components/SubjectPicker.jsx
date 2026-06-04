import { useMemo, useState } from 'react';
import { subjectAccent } from '../utils/studyStorage';

export default function SubjectPicker({
  subjects,
  selectedIds,
  onChange,
  disabled = false,
}) {
  const [search, setSearch] = useState('');

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedSubjects = useMemo(
    () => subjects.filter((s) => selectedSet.has(s.id)),
    [subjects, selectedSet]
  );
  const unselected = useMemo(
    () => subjects.filter((s) => !selectedSet.has(s.id)),
    [subjects, selectedSet]
  );
  const filteredUnselected = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unselected;
    return unselected.filter((s) => s.name.toLowerCase().includes(q));
  }, [unselected, search]);

  if (!subjects.length) {
    return <p className="text-sm text-[var(--text-muted)]">No subjects available yet.</p>;
  }

  const addSubject = (id) => {
    if (disabled || !id || selectedSet.has(id)) return;
    onChange([...selectedIds, id]);
    setSearch('');
  };

  const removeSubject = (id) => {
    if (disabled) return;
    onChange(selectedIds.filter((s) => s !== id));
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(subjects.map((s) => s.id));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const topicLabel = (subject) => {
    if (subject.topicCount == null) return null;
    const topics = `${subject.topicCount} topic${subject.topicCount !== 1 ? 's' : ''}`;
    if (subject.totalCards != null) return `${topics} · ${subject.totalCards} cards`;
    return topics;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-muted)]">
          {selectedSubjects.length === 0
            ? 'Choose at least one subject'
            : `${selectedSubjects.length} selected`}
        </p>
        {subjects.length > 1 && (
          <div className="flex gap-3 text-xs font-medium">
            <button
              type="button"
              disabled={disabled || selectedSubjects.length === subjects.length}
              onClick={selectAll}
              className="text-[var(--accent)] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              Select all
            </button>
            <button
              type="button"
              disabled={disabled || selectedSubjects.length === 0}
              onClick={clearAll}
              className="text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {unselected.length > 0 && (
        <div className="space-y-2">
          {subjects.length > 6 && (
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={disabled}
              placeholder="Search subjects…"
              className="input-field text-sm"
              aria-label="Search subjects to add"
            />
          )}
          <div className="relative">
            <label htmlFor="subject-add" className="sr-only">
              Add a subject
            </label>
            <select
              id="subject-add"
              disabled={disabled || filteredUnselected.length === 0}
              onChange={(e) => addSubject(e.target.value)}
              defaultValue=""
              className="input-field w-full appearance-none pr-10 text-sm"
            >
              <option value="" disabled>
                {filteredUnselected.length === 0
                  ? 'No matches — try another search'
                  : '+ Add a subject…'}
              </option>
              {filteredUnselected.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                  {subject.topicCount != null ? ` (${subject.topicCount} topics)` : ''}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden
            >
              ▾
            </span>
          </div>
        </div>
      )}

      {selectedSubjects.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Selected subjects">
          {selectedSubjects.map((subject) => {
            const accent = subjectAccent(subject.name);
            const meta = topicLabel(subject);
            return (
              <li key={subject.id}>
                <span
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-solid)] py-1.5 pl-2 pr-1.5 text-sm shadow-sm"
                  style={{ boxShadow: `0 0 0 1px ${accent.border}22` }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: accent.gradient }}
                    aria-hidden
                  >
                    {subject.name.charAt(0)}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block font-medium leading-tight text-[var(--text-heading)]">
                      {subject.name}
                    </span>
                    {meta && (
                      <span className="block text-[10px] leading-tight text-[var(--text-muted)]">
                        {meta}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeSubject(subject.id)}
                    className="ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--accent-glow)] hover:text-[var(--accent)] disabled:opacity-40"
                    aria-label={`Remove ${subject.name}`}
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-solid)]/60 px-4 py-3 text-center text-sm text-[var(--text-muted)]">
          Pick subjects from the menu above
        </p>
      )}
    </div>
  );
}
