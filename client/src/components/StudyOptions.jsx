import Card from './ui/Card';

export default function StudyOptions({ options, onChange, showTypeToggles = true }) {
  const toggleType = (type) => {
    const next = { ...options.types, [type]: !options.types[type] };
    const enabled = Object.values(next).filter(Boolean).length;
    if (enabled === 0) return;
    onChange({ ...options, types: next });
  };

  return (
    <Card className="mb-8 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Study options
      </h2>
      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.shuffle}
            onChange={(e) => onChange({ ...options, shuffle: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
          />
          Shuffle cards
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.weakOnly}
            onChange={(e) => onChange({ ...options, weakOnly: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
          />
          Need practice only
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.autoAdvance}
            onChange={(e) => onChange({ ...options, autoAdvance: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
          />
          Auto-advance after feedback
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <span>Test timer (min):</span>
          <select
            value={options.timerMinutes || 0}
            onChange={(e) =>
              onChange({ ...options, timerMinutes: parseInt(e.target.value, 10) })
            }
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] px-2 py-1 text-sm"
          >
            <option value={0}>Off</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </label>
      </div>
      {showTypeToggles && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Question types</p>
          <div className="flex flex-wrap gap-4">
            {['MCQ', 'TRUE_FALSE', 'FILL_BLANK'].map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={options.types?.[type] !== false}
                  onChange={() => toggleType(type)}
                  className="h-4 w-4 rounded accent-[var(--accent)]"
                />
                {type === 'MCQ' ? 'Multiple choice' : type === 'TRUE_FALSE' ? 'True / False' : 'Fill in blank'}
              </label>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
