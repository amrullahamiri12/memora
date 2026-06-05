export default function Button({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  loadingText,
  disabled,
  ...props
}) {
  const base = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-secondary';
  return (
    <button
      className={`${base} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
            aria-hidden="true"
          />
          {loadingText ?? 'Loading…'}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
