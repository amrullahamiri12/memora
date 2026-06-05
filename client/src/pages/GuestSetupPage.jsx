import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import SubjectPicker from '../components/SubjectPicker';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import GuestBanner from '../components/GuestBanner';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { isGuestUser } from '../utils/guest';

export default function GuestSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [subjectIds, setSubjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !isGuestUser(user)) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const enrolled = await api('/subjects');
        if (cancelled) return;
        if (enrolled.length > 0) {
          navigate('/dashboard', { replace: true });
          return;
        }
        const rows = await api('/subjects/catalog');
        if (cancelled) return;
        setCatalog(rows);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (user && isGuestUser(user)) load();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (subjectIds.length === 0) {
      setError('Select at least one subject to practice');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api('/subjects/enroll', {
        method: 'POST',
        body: JSON.stringify({ subjectIds }),
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <GuestBanner />
      <PageHeader
        title="What do you want to practice?"
        subtitle="Pick one or more subjects for your guest session. You can add more later from your dashboard."
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : catalog.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-[var(--text-muted)]">
            No subjects are available yet. Please try again later.
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Search and click subjects to add them to your session.
            </p>
            <SubjectPicker
              subjects={catalog}
              selectedIds={subjectIds}
              onChange={setSubjectIds}
              disabled={saving}
              maxSelectable={3}
            />
            <Button
              type="submit"
              className="mt-6 w-full py-3 sm:w-auto"
              loading={saving}
              disabled={subjectIds.length === 0}
            >
              Start practicing
            </Button>
          </form>
        </Card>
      )}
    </Layout>
  );
}
