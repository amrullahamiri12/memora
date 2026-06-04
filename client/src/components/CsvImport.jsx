import { useRef, useState } from 'react';
import { api, apiUrl, getToken } from '../utils/api';
import Button from './ui/Button';
import Alert from './ui/Alert';
import Card from './ui/Card';

async function downloadCsv(path, filename) {
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CsvImport({ onImported }) {
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setResult(null);
    setImporting(true);

    try {
      const csv = await file.text();
      const data = await api('/admin/flashcards/import', {
        method: 'POST',
        body: JSON.stringify({ csv }),
      });
      setResult(data);
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleExport = async () => {
    setError('');
    setExporting(true);
    try {
      await downloadCsv('/admin/flashcards/export', 'memora-flashcards-export.csv');
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-[var(--accent)]/30">
      <h2 className="mb-1 text-lg font-semibold">Import from CSV</h2>
      <p className="mb-2 text-sm text-[var(--text-muted)]">
        Each row needs{' '}
        <code className="rounded bg-[var(--surface-solid)] px-1.5 py-0.5 text-xs text-[var(--accent)]">
          subject, topic, question, answer, difficulty
        </code>
        . Optional{' '}
        <code className="rounded bg-[var(--surface-solid)] px-1.5 py-0.5 text-xs text-[var(--accent)]">
          questionType
        </code>{' '}
        is <code className="text-xs">MCQ</code> (default),{' '}
        <code className="text-xs">TRUE_FALSE</code>, or{' '}
        <code className="text-xs">FILL_BLANK</code> (use ___ in the question). For MCQ, optional{' '}
        <code className="rounded bg-[var(--surface-solid)] px-1.5 py-0.5 text-xs text-[var(--accent)]">
          distractor1–3
        </code>{' '}
        set wrong answers; otherwise they are auto-generated from other MCQ cards in the topic.
      </p>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Subjects and topics are created automatically if they don&apos;t exist.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-primary cursor-pointer">
          {importing ? 'Importing...' : 'Choose CSV file'}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
        </label>
        <Button
          type="button"
          variant="secondary"
          onClick={() => downloadCsv('/admin/flashcards/import/template', 'memora-mcq-template.csv')}
        >
          Download template
        </Button>
        <Button type="button" variant="secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export all cards'}
        </Button>
      </div>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <Alert type="success">
            <p className="font-medium">
              Imported {result.imported} card{result.imported !== 1 ? 's' : ''}
              {result.skipped > 0 && `, skipped ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''}`}
            </p>
            {result.errors?.length > 0 && (
              <ul className="mt-2 list-inside list-disc">
                {result.errors.map((err) => (
                  <li key={err.line}>
                    Line {err.line}: {err.message}
                  </li>
                ))}
              </ul>
            )}
          </Alert>
          {result.warnings?.length > 0 && (
            <Alert type="warning">
              <p className="font-medium">MCQ tips</p>
              <ul className="mt-2 list-inside list-disc">
                {result.warnings.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </Alert>
          )}
        </div>
      )}
    </Card>
  );
}
