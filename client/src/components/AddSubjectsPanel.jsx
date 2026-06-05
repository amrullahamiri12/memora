import { useEffect, useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Alert from './ui/Alert';
import SubjectPicker from './SubjectPicker';
import { api } from '../utils/api';

const SUBJECT_LIMIT = 3;

async function fetchAvailableSubjects() {
  try {
    return await api('/subjects/available');
  } catch {
    const catalog = await api('/subjects/catalog');
    return catalog.map((s) => ({
      id: s.id,
      name: s.name,
      topicCount: s.topicCount ?? 0,
      totalCards: s.totalCards ?? 0,
    }));
  }
}

async function fetchEnrollmentStatus() {
  try {
    return await api('/subjects/enrollment-status');
  } catch {
    return null;
  }
}

export default function AddSubjectsPanel({ onEnrolled, defaultExpanded = false }) {
  const [available, setAvailable] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([fetchAvailableSubjects(), fetchEnrollmentStatus()])
      .then(([subjects, status]) => {
        setAvailable(subjects);
        setEnrollmentStatus(status);
      })
      .catch((err) => {
        setError(err.message);
        setAvailable([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (defaultExpanded) setExpanded(true);
  }, [defaultExpanded]);

  const activeCount = enrollmentStatus?.activeCount ?? 0;
  const hasUnmastered = enrollmentStatus?.hasUnmastered ?? false;
  const canAddMore = enrollmentStatus ? enrollmentStatus.canAddMore : true;
  const spotsLeft = Math.max(0, SUBJECT_LIMIT - activeCount);

  const handleEnroll = async () => {
    if (selectedIds.length === 0) {
      setError('Select at least one subject');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await api('/subjects/enroll', {
        method: 'POST',
        body: JSON.stringify({ subjectIds: selectedIds }),
      });
      setSelectedIds([]);
      setExpanded(false);
      if (data.enrollmentStatus) setEnrollmentStatus(data.enrollmentStatus);
      onEnrolled(data.subjects);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const title = defaultExpanded ? 'Choose subjects to practice' : 'Add more subjects';

  if (loading) {
    return (
      <Card className="mb-8 p-5">
        <h2 className="text-lg font-semibold text-[var(--text-heading)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Loading subjects…</p>
      </Card>
    );
  }

  // At limit with unmastered subjects — show the blocked state
  if (!defaultExpanded && !canAddMore && activeCount >= SUBJECT_LIMIT) {
    return (
      <Card className="mb-8 p-5">
        <h2 className="text-lg font-semibold text-[var(--text-heading)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          You have reached the {SUBJECT_LIMIT}-subject limit. Master your current subjects (100%
          progress) before enrolling in new ones.
        </p>
      </Card>
    );
  }

  if (error && available.length === 0) {
    return (
      <Card className="mb-8 p-5">
        <h2 className="text-lg font-semibold text-[var(--text-heading)]">{title}</h2>
        <Alert className="mt-3">{error}</Alert>
        <Button type="button" variant="secondary" className="mt-3" onClick={load}>
          Retry
        </Button>
      </Card>
    );
  }

  if (available.length === 0) {
    return (
      <Card className="mb-8 p-5">
        <h2 className="text-lg font-semibold text-[var(--text-heading)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {activeCount >= SUBJECT_LIMIT
            ? 'Master your current subjects to unlock more.'
            : 'No subjects are set up yet. Ask an admin to add subjects and flashcards.'}
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-8 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">{title}</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {defaultExpanded
              ? `Select up to ${SUBJECT_LIMIT} subjects to get started`
              : spotsLeft > 0
                ? `${available.length} available · ${spotsLeft} slot${spotsLeft !== 1 ? 's' : ''} remaining`
                : `Expand what you study — ${available.length} available`}
          </p>
        </div>
        {!defaultExpanded && (
          <Button
            type="button"
            variant="secondary"
            className="text-sm"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? 'Hide' : 'Browse subjects'}
          </Button>
        )}
      </div>

      {(expanded || defaultExpanded) && (
        <div className="mt-5">
          {hasUnmastered && activeCount > 0 && spotsLeft > 0 && (
            <Alert type="info" className="mb-4">
              You have {spotsLeft} slot{spotsLeft !== 1 ? 's' : ''} left. Once you reach {SUBJECT_LIMIT}{' '}
              subjects, you must master all of them before adding more.
            </Alert>
          )}
          {error && <Alert>{error}</Alert>}
          <SubjectPicker
            subjects={available}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            disabled={saving}
            maxSelectable={spotsLeft > 0 ? spotsLeft : SUBJECT_LIMIT}
          />
          <Button
            type="button"
            className="mt-4 w-full sm:w-auto"
            loading={saving}
            disabled={selectedIds.length === 0}
            onClick={handleEnroll}
          >
            {defaultExpanded ? 'Start practicing' : 'Add selected subjects'}
          </Button>
        </div>
      )}
    </Card>
  );
}
