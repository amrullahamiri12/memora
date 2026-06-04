import { useEffect, useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Alert from './ui/Alert';
import SubjectPicker from './SubjectPicker';
import { api } from '../utils/api';

export default function AddSubjectsPanel({ onEnrolled, defaultExpanded = false }) {
  const [available, setAvailable] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(defaultExpanded);

  const load = () => {
    setLoading(true);
    api('/subjects/available')
      .then(setAvailable)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (defaultExpanded) setExpanded(true);
  }, [defaultExpanded]);

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

  if (loading) {
    return null;
  }

  if (available.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">Add more subjects</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Expand what you study — {available.length} available
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="text-sm"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Hide' : 'Browse subjects'}
        </Button>
      </div>

      {expanded && (
        <div className="mt-5">
          {error && <Alert>{error}</Alert>}
          <SubjectPicker
            subjects={available}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            disabled={saving}
          />
          <Button
            type="button"
            className="mt-4 w-full sm:w-auto"
            loading={saving}
            disabled={selectedIds.length === 0}
            onClick={handleEnroll}
          >
            Add selected subjects
          </Button>
        </div>
      )}
    </Card>
  );
}
