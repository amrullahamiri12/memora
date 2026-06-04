import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChangePassword from '../components/ChangePassword';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { isGuestUser } from '../utils/guest';
import GuestAccountUpgrade from '../components/GuestAccountUpgrade';

export default function AccountPage() {
  const { user, resendVerification, closeAccount } = useAuth();
  const navigate = useNavigate();
  const guest = isGuestUser(user);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyErr, setVerifyErr] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [closePassword, setClosePassword] = useState('');
  const [closeErr, setCloseErr] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);

  const needsPasswordToClose = user?.hasPassword !== false;

  const handleCloseAccount = async () => {
    if (
      !confirm(
        guest
          ? 'Close this guest session? Your progress on this device will no longer be tied to this account.'
          : 'Close your account? You will be signed out and will not be able to sign in again until an admin reactivates your email. Your study data is kept.'
      )
    ) {
      return;
    }
    setCloseLoading(true);
    setCloseErr('');
    try {
      const data = await closeAccount(needsPasswordToClose ? closePassword : undefined);
      navigate('/login', {
        replace: true,
        state: { message: data.message },
      });
    } catch (err) {
      setCloseErr(err.message);
    } finally {
      setCloseLoading(false);
    }
  };

  const handleResendVerify = async () => {
    setVerifyLoading(true);
    setVerifyMsg('');
    setVerifyErr('');
    try {
      const data = await resendVerification();
      setVerifyMsg(data.message || 'Verification email sent.');
    } catch (err) {
      setVerifyErr(err.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Account Settings"
        subtitle={
          guest ? 'Create an account to keep your study progress' : 'Manage your account and password'
        }
      />

      {guest ? (
        <GuestAccountUpgrade />
      ) : (
        <>
          {user?.emailVerified === false && (
            <Card className="mb-6 border-[var(--accent)]/30 bg-[var(--accent-glow)]/20 p-5">
              <h2 className="mb-2 text-lg font-semibold text-[var(--text-heading)]">
                Verify your email
              </h2>
              <p className="mb-4 text-sm text-[var(--text-muted)]">
                Study progress is saved, but you need to verify {user.email} before enrolling in
                new subjects or saving study sessions.
              </p>
              {verifyErr && (
                <div className="mb-3">
                  <Alert>{verifyErr}</Alert>
                </div>
              )}
              {verifyMsg && (
                <div className="mb-3">
                  <Alert type="success">{verifyMsg}</Alert>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Button type="button" loading={verifyLoading} onClick={handleResendVerify}>
                  Resend verification email
                </Button>
                <Link
                  to="/verify-email"
                  className="inline-flex items-center text-sm font-semibold text-[var(--accent)] hover:underline"
                >
                  Verification page
                </Link>
              </div>
            </Card>
          )}
          <Card className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">Your Details</h2>
            <dl className="space-y-4 text-sm">
              <div className="flex gap-4 border-b border-[var(--border)] pb-3">
                <dt className="w-20 font-medium text-[var(--text-muted)]">Name</dt>
                <dd className="text-[var(--text-heading)]">{user?.name}</dd>
              </div>
              <div className="flex gap-4 border-b border-[var(--border)] pb-3">
                <dt className="w-20 font-medium text-[var(--text-muted)]">Email</dt>
                <dd className="text-[var(--text-heading)]">{user?.email}</dd>
              </div>
              <div className="flex gap-4 border-b border-[var(--border)] pb-3">
                <dt className="w-20 font-medium text-[var(--text-muted)]">Role</dt>
                <dd>
                  <span className="rounded-full bg-[var(--accent-glow)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
                    {user?.role}
                  </span>
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-20 font-medium text-[var(--text-muted)]">Email status</dt>
                <dd className="text-[var(--text-heading)]">
                  {user?.emailVerified ? 'Verified' : 'Not verified'}
                </dd>
              </div>
            </dl>
          </Card>

          <ChangePassword />

          <Card className="mt-8 border-[var(--danger)]/25">
            <h2 className="mb-2 text-lg font-semibold text-[var(--text-heading)]">
              {guest ? 'Close guest session' : 'Close account'}
            </h2>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              {guest
                ? 'Ends this temporary guest session. You can start a new guest session anytime.'
                : 'Marks your account as inactive. You will be signed out immediately. Contact support or a super admin to reopen the same email.'}
            </p>
            {closeErr && (
              <div className="mb-3">
                <Alert>{closeErr}</Alert>
              </div>
            )}
            {needsPasswordToClose && !guest && (
              <div className="mb-4 max-w-sm">
                <Input
                  label="Confirm password"
                  type="password"
                  value={closePassword}
                  onChange={(e) => setClosePassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            )}
            <Button
              type="button"
              variant="secondary"
              loading={closeLoading}
              onClick={handleCloseAccount}
              className="!border-[var(--danger)]/40 !text-[var(--danger)] hover:!bg-[var(--danger)]/10"
            >
              {guest ? 'Close guest session' : 'Close my account'}
            </Button>
          </Card>
        </>
      )}
    </Layout>
  );
}
