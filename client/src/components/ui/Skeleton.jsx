export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--border)] ${className}`}
      aria-hidden="true"
    />
  );
}

export function SubjectCardSkeleton() {
  return (
    <div className="glass-card p-6">
      <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
      <Skeleton className="mb-2 h-6 w-3/4" />
      <Skeleton className="mb-4 h-4 w-1/2" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export default Skeleton;
