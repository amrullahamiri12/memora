export default function Textarea({ label, id, className = '', rows = 3, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <textarea id={id} rows={rows} className={`input-field resize-y ${className}`} {...props} />
    </div>
  );
}
