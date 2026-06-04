import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthPageTopBar from '../components/AuthPageTopBar';
import AuthFormHeader from '../components/AuthFormHeader';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <div className="auth-form-panel relative flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <AuthPageTopBar />
        <div className="mx-auto w-full max-w-md page-enter">
          <AuthFormHeader title="Forgot password" subtitle="We'll email you a reset link" />
          {error && <Alert>{error}</Alert>}
          {message && <Alert type="success">{message}</Alert>}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="Email"
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button type="submit" loading={loading} className="w-full py-3">
              Send reset link
            </Button>
          </form>
          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
