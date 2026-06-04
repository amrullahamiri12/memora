import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthPanel from '../components/AuthPanel';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import ThemeToggle from '../components/ThemeToggle';
import AuthFormHeader from '../components/AuthFormHeader';
import SubjectPicker from '../components/SubjectPicker';
import { api } from '../utils/api';

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
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
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
              placeholder="At least 6 characters"
            />

            <div>
              <p className="mb-3 text-sm font-semibold text-[var(--text-heading)]">
                Which subjects do you want to practice?
              </p>
              {catalogLoading ? (
                <p className="text-sm text-[var(--text-muted)]">Loading subjects…</p>
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
