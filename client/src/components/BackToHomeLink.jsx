import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMarketingHomePath } from '../utils/appHome';

export default function BackToHomeLink({ className = '' }) {
  const { user, loading } = useAuth();
  const to = loading ? '/' : getMarketingHomePath(user);

  return (
    <Link
      to={to}
      className={`text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] hover:underline ${className}`.trim()}
    >
      ← Home
    </Link>
  );
}
