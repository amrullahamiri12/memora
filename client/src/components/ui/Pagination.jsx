import Button from './Button';

export function paginationRange(page, limit, total) {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return { from, to };
}

export default function Pagination({ page, totalPages, total, limit, onPageChange, className = '' }) {
  if (!total || totalPages <= 1) return null;

  const { from, to } = paginationRange(page, limit, total);

  const pages = [];
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] px-4 py-3 ${className}`}
    >
      <p className="text-sm text-[var(--text-muted)]">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="py-1.5 text-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        {start > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="min-w-[2rem] rounded-lg px-2 py-1 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
            >
              1
            </button>
            {start > 2 && <span className="text-[var(--text-muted)]">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[2rem] rounded-lg px-2 py-1 text-sm font-medium transition ${
              p === page
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-[var(--text-muted)]">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="min-w-[2rem] rounded-lg px-2 py-1 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
            >
              {totalPages}
            </button>
          </>
        )}
        <Button
          type="button"
          variant="secondary"
          className="py-1.5 text-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
