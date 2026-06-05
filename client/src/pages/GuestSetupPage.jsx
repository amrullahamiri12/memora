import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import SubjectPicker from '../components/SubjectPicker';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { CardGridSkeleton } from '../components/ui/Skeleton';
import GuestBanner from '../components/GuestBanner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { MAX_ACTIVE_SUBJECTS_GUEST, GUEST_UPSELL_HINT } from '../utils/enrollmentQuota';
import { isGuestUser } from '../utils/guest';

export default function GuestSetupPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [catalog, setCatalog] = useState([]);
  const [subjectIds, setSubjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

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
        const preselect = (searchParams.get('subjects') || '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);
        if (preselect.length > 0) {
          const valid = preselect.filter((id) => rows.some((s) => s.id === id)).slice(0, MAX_ACTIVE_SUBJECTS_GUEST);
          if (valid.length > 0) setSubjectIds(valid);
        }
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
  }, [user, navigate, searchParams, reloadKey]);

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
      toast.success(
        `Added ${subjectIds.length} subject${subjectIds.length === 1 ? '' : 's'} — let's practice!`
      );
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
        subtitle={`Pick up to ${MAX_ACTIVE_SUBJECTS_GUEST} subjects for your guest session. ${GUEST_UPSELL_HINT}`}
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : error && catalog.length === 0 ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load subjects"
          message="Something went wrong while loading. Check your connection and try again."
          actionLabel="Try again"
          onAction={() => setReloadKey((k) => k + 1)}
        />
      ) : catalog.length === 0 ? (
        <EmptyState
          title="No subjects available yet"
          message="There aren't any subjects to practice right now. Please check back a little later."
          actionLabel="Refresh"
          onAction={() => setReloadKey((k) => k + 1)}
        />
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
              maxSelectable={MAX_ACTIVE_SUBJECTS_GUEST}
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
