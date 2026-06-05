import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { subjectAccent } from '../utils/studyStorage';

export default function SubjectPicker({
  subjects,
  selectedIds,
  onChange,
  disabled = false,
  maxSelectable = null,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const rootRef = useRef(null);
  const inputId = useId();
  const listId = useId();

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedSubjects = useMemo(
    () => subjects.filter((s) => selectedSet.has(s.id)),
    [subjects, selectedSet]
  );
  const unselected = useMemo(
    () => subjects.filter((s) => !selectedSet.has(s.id)),
    [subjects, selectedSet]
  );
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return unselected;
    return unselected.filter((s) => s.name.toLowerCase().includes(q));
  }, [unselected, query]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  if (!subjects.length) {
    return <p className="text-sm text-[var(--text-muted)]">No subjects available yet.</p>;
  }

  const atMax = maxSelectable !== null && selectedIds.length >= maxSelectable;

  const addSubject = (id) => {
    if (disabled || !id || selectedSet.has(id)) return;
    if (maxSelectable !== null && selectedIds.length >= maxSelectable) return;
    onChange([...selectedIds, id]);
    setQuery('');
    setOpen(false);
  };

  const removeSubject = (id) => {
    if (disabled) return;
    onChange(selectedIds.filter((s) => s !== id));
  };

  const selectAll = () => {
    if (disabled) return;
    const all = subjects.map((s) => s.id);
    onChange(maxSelectable !== null ? all.slice(0, maxSelectable) : all);
    setQuery('');
    setOpen(false);
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

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filteredOptions[highlightIndex]) {
      e.preventDefault();
      addSubject(filteredOptions[highlightIndex].id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-muted)]">
          {selectedSubjects.length === 0
            ? maxSelectable !== null
              ? `Choose up to ${maxSelectable} subject${maxSelectable !== 1 ? 's' : ''}`
              : 'Choose at least one subject'
            : maxSelectable !== null
              ? `${selectedSubjects.length} / ${maxSelectable} selected`
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
        <div ref={rootRef} className="relative">
          <label htmlFor={inputId} className="sr-only">
            Search and add subjects
          </label>
          <div className="relative">
            <input
              id={inputId}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
              disabled={disabled || atMax}
              value={query}
              placeholder={atMax ? 'Selection limit reached' : 'Search or pick a subject…'}
              className="input-field w-full pr-9 text-sm"
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
            />
            {query && !disabled && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--accent-glow)] hover:text-[var(--accent)]"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('');
                  setOpen(true);
                }}
              >
                ×
              </button>
            )}
          </div>

          {open && (
            <ul
              id={listId}
              role="listbox"
              className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-[var(--border-strong)] bg-[var(--surface-solid)] py-1 shadow-lg"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-[var(--text-muted)]">No matching subjects</li>
              ) : (
                filteredOptions.map((subject, index) => {
                  const accent = subjectAccent(subject.name);
                  const meta = topicLabel(subject);
                  const active = index === highlightIndex;
                  return (
                    <li key={subject.id} role="option" aria-selected={active}>
                      <button
                        type="button"
                        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition ${
                          active ? 'bg-[var(--accent-glow)]' : 'hover:bg-[var(--accent-glow)]/60'
                        }`}
                        onMouseEnter={() => setHighlightIndex(index)}
                        onClick={() => addSubject(subject.id)}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{ background: accent.gradient }}
                          aria-hidden
                        >
                          {subject.name.charAt(0)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-[var(--text-heading)]">
                            {subject.name}
                          </span>
                          {meta && (
                            <span className="block text-xs text-[var(--text-muted)]">{meta}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      )}

      {selectedSubjects.length > 0 ? (
        <>
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
        {unselected.length > 0 && (
          <p className="text-xs text-[var(--text-muted)]">
            Use the search field above to add more subjects.
          </p>
        )}
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-solid)]/60 px-4 py-3 text-center text-sm text-[var(--text-muted)]">
          Type to search, then click a subject to add it
        </p>
      )}
    </div>
  );
}
