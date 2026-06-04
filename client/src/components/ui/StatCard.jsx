export default function StatCard({ value, label, accent = 'default' }) {
  const accentColors = {
    default: 'text-[var(--text-heading)]',
    accent: 'text-[var(--accent)]',
    success: 'text-[var(--success)]',
    warning: 'text-[var(--warning)]',
    secondary: 'text-[var(--tone-cyan)]',
    forest: 'text-[var(--tone-forest)]',
    olive: 'text-[var(--tone-olive)]',
  };

  return (
    <div className="glass-card p-6 text-center">
      <p className={`text-3xl font-bold font-display ${accentColors[accent] || accentColors.default}`}>
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
