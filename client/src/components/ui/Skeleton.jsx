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

/** A responsive grid of card skeletons — matches subject/topic list layouts. */
export function CardGridSkeleton({ count = 6, className = '' }) {
  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SubjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Page heading placeholder (title + subtitle). */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8" aria-hidden="true">
      <Skeleton className="mb-3 h-8 w-2/3 max-w-xs" />
      <Skeleton className="h-4 w-3/4 max-w-sm" />
    </div>
  );
}

/** A stack of full-width rows — matches list/table layouts. */
export function ListSkeleton({ rows = 5, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default Skeleton;
