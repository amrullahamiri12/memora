import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../utils/roles';
import AuthPanel from '../components/AuthPanel';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import AuthPageTopBar from '../components/AuthPageTopBar';
import AuthFormHeader from '../components/AuthFormHeader';
import ContinueAsGuestButton from '../components/ContinueAsGuestButton';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(isStaff(user.role) ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <AuthPanel />
      <div className="auth-form-panel relative flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <AuthPageTopBar />
        <div className="mx-auto w-full max-w-md page-enter">
          <AuthFormHeader
            title="Welcome back"
            subtitle="Sign in to continue studying"
          />

          {error && <Alert>{error}</Alert>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button type="submit" loading={loading} className="w-full py-3">
              Sign in
            </Button>
          </form>

          <div className="mt-8 border-t border-[var(--border)] pt-8">
            <ContinueAsGuestButton />
          </div>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
