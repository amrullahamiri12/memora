import { useRef, useState } from 'react';
import { api, apiUrl, getToken } from '../utils/api';
import Button from './ui/Button';
import Alert from './ui/Alert';
import Card from './ui/Card';

const ROWS_PER_CHUNK = 80;

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

function mergeImportResults(accum, chunk) {
  return {
    imported: accum.imported + (chunk.imported || 0),
    skipped: accum.skipped + (chunk.skipped || 0),
    errors: [...accum.errors, ...(chunk.errors || [])],
    warnings: [...new Set([...accum.warnings, ...(chunk.warnings || [])])],
  };
}

async function importCsvInChunks(fullCsv) {
  const lines = fullCsv.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row');
  }

  const header = lines[0];
  const dataLines = lines.slice(1);
  const totalChunks = Math.ceil(dataLines.length / ROWS_PER_CHUNK);

  let merged = { imported: 0, skipped: 0, errors: [], warnings: [] };

  for (let c = 0; c < totalChunks; c++) {
    const start = c * ROWS_PER_CHUNK;
    const chunkLines = dataLines.slice(start, start + ROWS_PER_CHUNK);
    const chunkCsv = [header, ...chunkLines].join('\n');

    const chunkResult = await api('/admin/flashcards/import', {
      method: 'POST',
      body: JSON.stringify({ csv: chunkCsv }),
    });

    const lineOffset = start;
    if (chunkResult.errors?.length) {
      chunkResult.errors = chunkResult.errors.map((err) => ({
        ...err,
        line: err.line != null ? err.line + lineOffset : err.line,
      }));
    }

    merged = mergeImportResults(merged, chunkResult);
  }

  return merged;
}

export default function CsvImport({ onImported }) {
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setResult(null);
    setImporting(true);
    setImportProgress('Reading file…');

    try {
      const csv = await file.text();
      const rowCount = csv.trim().split(/\r?\n/).length - 1;
      if (rowCount > ROWS_PER_CHUNK) {
        setImportProgress(`Importing ${rowCount} rows in batches…`);
      }
      const data = await importCsvInChunks(csv);
      setResult(data);
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
      setImportProgress('');
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
        Subjects and topics are created automatically if they don&apos;t exist. Large files are
        imported in batches of {ROWS_PER_CHUNK} rows.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-primary cursor-pointer">
          {importing ? importProgress || 'Importing...' : 'Choose CSV file'}
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
              <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto">
                {result.errors.slice(0, 20).map((err) => (
                  <li key={`${err.line}-${err.message}`}>
                    Line {err.line}: {err.message}
                  </li>
                ))}
                {result.errors.length > 20 && (
                  <li>…and {result.errors.length - 20} more errors</li>
                )}
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
