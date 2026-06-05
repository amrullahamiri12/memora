import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import Card from './ui/Card';

export default function ChangePassword() {
  const { user } = useAuth();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (user?.hasPassword === false) {
    return (
      <Card>
        <h2 className="mb-2 text-lg font-semibold">Password</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {user.hasGoogle
            ? 'You sign in with Google. To add a password for email login, use forgot password with your account email.'
            : 'No password is set on this account yet.'}
        </p>
        <p className="mt-4">
          <Link to="/forgot-password" className="font-semibold text-[var(--accent)] hover:underline">
            Set a password via email reset
          </Link>
        </p>
      </Card>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Change Password</h2>

      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <Input
          label="Current password"
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label="New password"
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />
        <Input
          label="Confirm new password"
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" loading={saving}>
          Update password
        </Button>
      </form>
    </Card>
  );
}
