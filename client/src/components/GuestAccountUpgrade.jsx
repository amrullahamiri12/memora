import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import Card from './ui/Card';

export default function GuestAccountUpgrade() {
  const { upgradeGuest } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await upgradeGuest(name.trim(), email.trim(), password);
      setPassword('');
      navigate('/verify-email', {
        replace: true,
        state: {
          emailSent: result.emailSent,
          emailConfigured: result.emailConfigured,
          emailWarning: result.emailWarning,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold text-[var(--text-heading)]">Create your account</h2>
      <p className="mb-6 text-sm text-[var(--text-muted)]">
        You&apos;re using a guest session. Add your name, email, and password to keep your study
        progress permanently.
      </p>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert type="success">{success}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          id="guest-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <Input
          label="Email"
          id="guest-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          id="guest-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
        <Button type="submit" loading={loading} className="w-full py-3">
          Save my account
        </Button>
      </form>
    </Card>
  );
}
