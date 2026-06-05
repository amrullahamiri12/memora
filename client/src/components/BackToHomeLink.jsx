import { Link } from 'react-router-dom';

export default function BackToHomeLink({ className = '' }) {
  return (
    <Link
      to="/"
      className={`text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] hover:underline ${className}`.trim()}
    >
      ← Home
    </Link>
  );
}
