export default function Input({ label, id, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--text-label)]">
          {label}
        </label>
      )}
      <input id={id} className={`input-field ${className}`} {...props} />
    </div>
  );
}
