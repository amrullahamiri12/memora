export default function ProgressBar({ percent, label }) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex justify-between text-sm text-[var(--text-muted)]">
          <span>{label}</span>
          <span className="font-medium text-[var(--accent)]">{clamped}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clamped}%`,
            background:
              'linear-gradient(90deg, var(--tone-forest) 0%, var(--accent) 45%, var(--tone-cyan) 100%)',
          }}
        />
      </div>
    </div>
  );
}
