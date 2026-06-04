export default function Spinner({ className = '' }) {
  return (
    <div className={`flex justify-center py-20 ${className}`}>
      <div
        className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
