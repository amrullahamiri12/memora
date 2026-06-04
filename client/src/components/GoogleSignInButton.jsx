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

  if (!clientId) return null;

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
      if (!user.emailVerified && !user.isGuest) {
        navigate('/verify-email');
        return;
      }
      navigate(isStaff(user.role) ? '/admin' : '/dashboard');
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
      <div className="flex justify-center">
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
      </div>
    </div>
  );
}
