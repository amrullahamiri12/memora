export default function Select({ label, id, children, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--text-label)]">
          {label}
        </label>
      )}
      <select id={id} className={`input-field ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}
