import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthPageTopBar from '../components/AuthPageTopBar';
import AuthFormHeader from '../components/AuthFormHeader';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../utils/roles';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const user = await resetPassword(token, password);
      navigate(isStaff(user.role) ? '/admin/reports' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6">
        <Alert>Invalid reset link. Request a new one from forgot password.</Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <div className="auth-form-panel relative flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <AuthPageTopBar />
        <div className="mx-auto w-full max-w-md page-enter">
          <AuthFormHeader title="Reset password" subtitle="Choose a new password for your account" />
          {error && <Alert>{error}</Alert>}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="New password"
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <Input
              label="Confirm password"
              id="reset-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <Button type="submit" loading={loading} className="w-full py-3">
              Update password
            </Button>
          </form>
          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
