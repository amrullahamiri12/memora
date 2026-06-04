export default function Alert({ type = 'error', children }) {
  const styles = {
    error: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger)]/20',
    success: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]/20',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]/25',
  };

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>{children}</div>
  );
}
