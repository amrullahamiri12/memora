import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../utils/roles';
import Alert from './ui/Alert';

export default function GoogleSignInButton({ onSuccess }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const { loginWithGoogle, googleSessionNonce } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (!clientId) {
    if (import.meta.env.DEV) {
      return (
        <p className="text-center text-xs text-[var(--text-muted)]">
          Google sign-in is off: add <code className="text-[var(--text-heading)]">VITE_GOOGLE_CLIENT_ID</code>{' '}
          to <code className="text-[var(--text-heading)]">client/.env</code> (not <code>server/.env</code>) and
          restart Vite.
        </p>
      );
    }
    return null;
  }

  const handleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      onSuccess?.(data);
      if (data.needsSubjectSetup) {
        navigate('/guest/setup');
        return;
      }
      const user = data.user;
      if (isStaff(user.role)) {
        navigate('/admin/dashboard');
        return;
      }
      if (!user.emailVerified && !user.isGuest) {
        navigate('/verify-email');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <GoogleLogin
          key={googleSessionNonce}
          onSuccess={handleSuccess}
          onError={() => setError('Google sign-in was cancelled or failed')}
          theme="outline"
          size="large"
          text="signin_with"
          shape="rectangular"
          width="320"
        />
        <p className="max-w-xs text-center text-xs text-[var(--text-muted)]">
          This button uses your browser&apos;s Google account. Logging out of Memora does not sign you
          out of Google.
        </p>
      </div>
    </div>
  );
}
