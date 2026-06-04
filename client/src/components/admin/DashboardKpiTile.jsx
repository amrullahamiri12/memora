const TONE_STYLES = {
  accent: {
    shell: 'bg-[var(--accent-glow)]/60 border-[var(--accent)]/20',
    value: 'text-[var(--accent-deep)]',
  },
  cyan: {
    shell: 'bg-[var(--tone-cyan-bg)] border-[var(--tone-cyan)]/25',
    value: 'text-[var(--tone-cyan)]',
  },
  forest: {
    shell: 'bg-[var(--tone-forest-bg)] border-[var(--tone-forest)]/25',
    value: 'text-[var(--tone-forest)]',
  },
  olive: {
    shell: 'bg-[var(--tone-olive-bg)] border-[var(--tone-olive)]/25',
    value: 'text-[var(--tone-olive)]',
  },
  sage: {
    shell: 'bg-[var(--tone-sage-bg)] border-[var(--tone-sage)]/25',
    value: 'text-[var(--tone-sage)]',
  },
  success: {
    shell: 'bg-[var(--success-bg)] border-[var(--success)]/25',
    value: 'text-[var(--success)]',
  },
  default: {
    shell: 'bg-[var(--surface-solid)] border-[var(--border)]',
    value: 'text-[var(--text-heading)]',
  },
};

import { formatDashboardNum } from '../../utils/formatDashboardNum';

export default function DashboardKpiTile({ label, value, hint, tone = 'default' }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.default;

  return (
    <div
      className={`glass-card flex min-h-[7.5rem] flex-col justify-between rounded-2xl border p-5 shadow-[var(--shadow)] ${styles.shell}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <div>
        <p className={`font-display text-3xl font-bold tracking-tight ${styles.value}`}>
          {formatDashboardNum(value)}
        </p>
        {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
    </div>
  );
}
