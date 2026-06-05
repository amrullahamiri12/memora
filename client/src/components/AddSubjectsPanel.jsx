import { useEffect, useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Alert from './ui/Alert';
import SubjectPicker from './SubjectPicker';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { isStaff } from '../utils/roles';
import {
  AT_ACTIVE_LIMIT_HINT,
  deriveEnrollmentQuota,
  MAX_ACTIVE_SUBJECTS,
} from '../utils/enrollmentQuota';

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

export default function AddSubjectsPanel({
  onEnrolled,
  defaultExpanded = false,
  enrolledSubjects = [],
}) {
  const [available, setAvailable] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { user } = useAuth();
  const enrollmentLimitApplies = Boolean(user && !isStaff(user.role));

  const load = () => {
    setLoading(true);
    setError('');
    fetchAvailableSubjects()
      .then(setAvailable)
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

  const enrollmentQuota = enrollmentLimitApplies
    ? deriveEnrollmentQuota(enrolledSubjects)
    : null;
  const maxSelectable = enrollmentLimitApplies
    ? defaultExpanded
      ? MAX_ACTIVE_SUBJECTS
      : enrollmentQuota.spotsRemaining
    : null;

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
          {enrollmentLimitApplies && enrollmentQuota.spotsRemaining === 0
            ? `You are at the ${MAX_ACTIVE_SUBJECTS}-subject active limit. ${AT_ACTIVE_LIMIT_HINT}`
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
              ? enrollmentLimitApplies
                ? `Select up to ${MAX_ACTIVE_SUBJECTS} subjects to get started`
                : 'Select one or more subjects to get started'
              : enrollmentLimitApplies && enrollmentQuota.spotsRemaining === 0
                ? `At the ${MAX_ACTIVE_SUBJECTS}-subject limit. ${AT_ACTIVE_LIMIT_HINT}`
                : enrollmentLimitApplies
                  ? `Expand what you study — ${available.length} available · ${enrollmentQuota.spotsRemaining} active slot${enrollmentQuota.spotsRemaining === 1 ? '' : 's'} left`
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
          {enrollmentLimitApplies && enrollmentQuota.spotsRemaining === 0 && (
            <Alert type="warning">
              You already have {MAX_ACTIVE_SUBJECTS} active subjects. {AT_ACTIVE_LIMIT_HINT}
            </Alert>
          )}
          {error && <Alert>{error}</Alert>}
          <SubjectPicker
            subjects={available}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            disabled={saving}
            maxSelectable={maxSelectable}
          />
          <Button
            type="button"
            className="mt-4 w-full sm:w-auto"
            loading={saving}
            disabled={
              selectedIds.length === 0 ||
              (enrollmentLimitApplies && !defaultExpanded && enrollmentQuota.spotsRemaining === 0)
            }
            onClick={handleEnroll}
          >
            {defaultExpanded ? 'Start practicing' : 'Add selected subjects'}
          </Button>
        </div>
      )}
    </Card>
  );
}
