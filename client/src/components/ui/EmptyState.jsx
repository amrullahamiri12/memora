import { Link } from 'react-router-dom';
import Button from './Button';

export default function EmptyState({ message, actionLabel, actionTo, onAction }) {
  return (
    <div className="glass-card py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-glow)] text-3xl">
        📭
      </div>
      <p className="mx-auto max-w-sm text-[var(--text-muted)]">{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="mt-6 inline-block">
          <Button>{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}
