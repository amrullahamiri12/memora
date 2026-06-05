import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Alert from './ui/Alert';

export default function ContinueAsGuestButton({
  className = 'w-full',
  buttonClassName = '',
  showDescription = true,
  variant = 'button',
}) {
  const { continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      await continueAsGuest();
      navigate('/guest/setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const description = (
    <p className="mt-2 text-center text-sm leading-relaxed text-[var(--text-muted)] sm:text-left sm:text-base">
      Try the app with no sign-up — you&apos;ll choose subjects next. Create an account later to keep
      progress.
    </p>
  );

  return (
    <div className={className}>
      {error && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}
      {variant === 'link' ? (
        <button
          type="button"
          disabled={loading}
          onClick={handleClick}
          className={`text-base font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)] hover:underline disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`.trim()}
        >
          {loading ? 'Loading...' : 'Continue as guest'}
        </button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className={`w-full py-3 ${buttonClassName}`.trim()}
          loading={loading}
          onClick={handleClick}
        >
          Continue as guest
        </Button>
      )}
      {showDescription && description}
    </div>
  );
}
