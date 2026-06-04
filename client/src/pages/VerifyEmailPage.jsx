import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const { user, resendVerification, verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(location.state?.emailConfigured);
  const token = searchParams.get('token');

  useEffect(() => {
    api('/auth/config')
      .then((cfg) => setEmailConfigured(cfg.emailConfigured))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.emailConfigured === false || location.state?.emailSent === false) {
      setError(
        'Your account was created, but verification email is not set up on the server yet. Ask an admin to verify your email or try again later.'
      );
    }
  }, [location.state]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setVerifying(true);
    setError('');
    verifyEmail(token)
      .then(() => {
        if (!cancelled) {
          setMessage('Email verified! You can start studying.');
          navigate('/dashboard', { replace: true });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, navigate, verifyEmail]);

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await resendVerification();
      setMessage(data.message || 'Verification email sent.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Verify your email"
        subtitle={
          user?.email
            ? `We sent a link to ${user.email}. Check your inbox (and spam).`
            : 'Check your inbox for the verification link.'
        }
      />
      <Card className="max-w-md p-6">
        {verifying && <p className="text-sm text-[var(--text-muted)]">Verifying…</p>}
        {error && <Alert>{error}</Alert>}
        {message && <Alert type="success">{message}</Alert>}
        {emailConfigured === false && !error && (
          <Alert>
            Email delivery is not configured yet. You cannot receive a verification link until the
            site owner adds Resend to production.
          </Alert>
        )}
        {!token && (
          <>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              You need to verify your email before studying. Click the link in your email
              {user ? ', or resend it below.' : '.'}
            </p>
            {user ? (
              <Button
                type="button"
                className="w-full"
                loading={loading}
                disabled={emailConfigured === false}
                onClick={handleResend}
              >
                Resend verification email
              </Button>
            ) : (
              <p className="text-center text-sm text-[var(--text-muted)]">
                <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
                  Sign in
                </Link>{' '}
                to resend the verification email.
              </p>
            )}
          </>
        )}
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          {user ? (
            <Link to="/account" className="text-[var(--accent)] hover:underline">
              Account settings
            </Link>
          ) : (
            <Link to="/login" className="text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          )}
        </p>
      </Card>
    </Layout>
  );
}
