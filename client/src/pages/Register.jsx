import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthPanel from '../components/AuthPanel';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import AuthPageTopBar from '../components/AuthPageTopBar';
import AuthFormHeader from '../components/AuthFormHeader';
import SubjectPicker from '../components/SubjectPicker';
import { api } from '../utils/api';
import ContinueAsGuestButton from '../components/ContinueAsGuestButton';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [subjectIds, setSubjectIds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    api('/subjects/catalog')
      .then(setCatalog)
      .catch((err) => setError(err.message))
      .finally(() => setCatalogLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!email) {
      setError('Email is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (subjectIds.length === 0) {
      setError('Select at least one subject to practice');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email, password, subjectIds);
      navigate('/dashboard');
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
        <div className="mx-auto w-full max-w-lg page-enter">
          <AuthFormHeader
            title="Create account"
            subtitle="Tell us what you want to study"
          />

          {error && <Alert>{error}</Alert>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <Input
              label="Name"
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
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
              placeholder="At least 8 characters"
            />

            <div>
              <p className="mb-1 text-sm font-semibold text-[var(--text-heading)]">
                Subjects to practice
              </p>
              <p className="mb-3 text-xs text-[var(--text-muted)]">
                Search and click subjects to add them. You can enroll in more later from your dashboard.
              </p>
              {catalogLoading ? (
                <p className="text-sm text-[var(--text-muted)]">Loading subjects…</p>
              ) : catalog.length === 0 ? (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  No subjects in the database yet. Run{' '}
                  <code className="rounded bg-black/5 px-1 dark:bg-white/10">npm run db:seed</code>{' '}
                  in the server folder (with your Supabase URLs in{' '}
                  <code className="rounded bg-black/5 px-1 dark:bg-white/10">server/.env</code>), or
                  set <code className="rounded bg-black/5 px-1 dark:bg-white/10">SEED_ON_BUILD=true</code>{' '}
                  on Vercel and redeploy once.
                </p>
              ) : (
                <SubjectPicker
                  subjects={catalog}
                  selectedIds={subjectIds}
                  onChange={setSubjectIds}
                  disabled={loading}
                />
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full py-3">
              Create account
            </Button>
          </form>

          <div className="mt-8 border-t border-[var(--border)] pt-8">
            <ContinueAsGuestButton />
          </div>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
