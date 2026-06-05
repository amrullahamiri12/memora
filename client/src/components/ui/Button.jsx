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
    <button className={`${base} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? loadingText ?? 'Loading...' : children}
    </button>
  );
}
