import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function AuthPageTopBar() {
  return (
    <>
      <div className="absolute left-6 top-6 z-10">
        <Link
          to="/"
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] hover:underline"
        >
          ← Home
        </Link>
      </div>
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>
    </>
  );
}
