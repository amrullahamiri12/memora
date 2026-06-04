import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Alert from './ui/Alert';

export default function ContinueAsGuestButton({ className = 'w-full' }) {
  const { continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      await continueAsGuest();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {error && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        className="w-full py-3"
        loading={loading}
        onClick={handleClick}
      >
        Continue as guest
      </Button>
      <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
        Try the app with no sign-up. Create an account later to keep your progress.
      </p>
    </div>
  );
}
