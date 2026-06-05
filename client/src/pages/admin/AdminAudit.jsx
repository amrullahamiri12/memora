import { useEffect, useState, Fragment } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import { api } from '../../utils/api';
import { isSuperAdmin } from '../../utils/roles';

const PAGE_SIZE = 50;

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'AUTH_LOGIN_SUCCESS', label: 'Login success' },
  { value: 'AUTH_LOGIN_FAILED', label: 'Login failed' },
  { value: 'AUTH_GOOGLE_FAILED', label: 'Google auth failed' },
  { value: 'AUTH_REGISTER', label: 'Register' },
  { value: 'AUTH_VERIFY_EMAIL', label: 'Verify email' },
  { value: 'AUTH_CLOSE_ACCOUNT', label: 'Close account' },
  { value: 'USER_DEACTIVATED', label: 'User deactivated' },
  { value: 'USER_REACTIVATED', label: 'User reactivated' },
  { value: 'USER_DELETED_DB', label: 'User deleted (DB)' },
  { value: 'ADMIN_USER_CREATED', label: 'Admin: user created' },
  { value: 'ADMIN_USER_UPDATED', label: 'Admin: user updated' },
  { value: 'ADMIN_VERIFY_EMAIL', label: 'Admin: verify email' },
  { value: 'SUBJECT_CREATED', label: 'Subject created' },
  { value: 'SUBJECT_UPDATED', label: 'Subject updated' },
  { value: 'SUBJECT_DELETED', label: 'Subject deleted' },
  { value: 'TOPIC_CREATED', label: 'Topic created' },
  { value: 'TOPIC_UPDATED', label: 'Topic updated' },
  { value: 'TOPIC_DELETED', label: 'Topic deleted' },
  { value: 'FLASHCARD_CREATED', label: 'Flashcard created' },
  { value: 'FLASHCARD_UPDATED', label: 'Flashcard updated' },
  { value: 'FLASHCARD_DELETED', label: 'Flashcard deleted' },
  { value: 'FLASHCARD_CSV_IMPORTED', label: 'CSV imported' },
  { value: 'FLASHCARD_CSV_EXPORTED', label: 'CSV exported' },
  { value: 'CONTACT_FORM_SUBMITTED', label: 'Contact form' },
  { value: 'RATE_LIMIT_HIT', label: 'Rate limit hit' },
];

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatActor(row) {
  if (row.actorEmail) return row.actorEmail;
  if (row.actorUserId) return row.actorUserId.slice(0, 8);
  return '—';
}

function formatMetadata(metadata) {
  if (!metadata) return null;
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}

export default function AdminAudit() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [source, setSource] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = (targetPage = page) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      page: String(targetPage),
      limit: String(PAGE_SIZE),
    });
    if (action) params.set('action', action);
    if (source) params.set('source', source);
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(`${to}T23:59:59`).toISOString());

    api(`/admin/audit-events?${params}`)
      .then((data) => {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? targetPage);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isSuperAdmin(user?.role)) return;
    load(page);
  }, [page, action, source, from, to, user?.role]);

  if (!isSuperAdmin(user?.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <Layout>
      <PageHeader
        title="Audit log"
        subtitle={`${total} events — append-only security and admin history`}
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Action"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="Source"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All sources</option>
            <option value="APP">Application</option>
            <option value="DB_TRIGGER">Database trigger</option>
          </Select>
          <Input
            label="From date"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <Input
            label="To date"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">
                      No audit events match your filters.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <Fragment key={row.id}>
                      <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)]">
                        <td className="whitespace-nowrap px-4 py-3">{formatWhen(row.occurredAt)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                        <td className="px-4 py-3">{row.source}</td>
                        <td className="px-4 py-3">
                          <div>{formatActor(row)}</div>
                          {row.actorRole && (
                            <div className="text-xs text-[var(--text-muted)]">{row.actorRole}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.entityType ? (
                            <span>
                              {row.entityType}
                              {row.entityId ? `: ${row.entityId.slice(0, 8)}…` : ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                          {row.ipAddress || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {row.metadata && (
                            <button
                              type="button"
                              className="text-[var(--accent)] hover:underline"
                              onClick={() =>
                                setExpandedId((prev) => (prev === row.id ? null : row.id))
                              }
                            >
                              {expandedId === row.id ? 'Hide' : 'Details'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedId === row.id && row.metadata && (
                        <tr>
                          <td colSpan={7} className="bg-[var(--surface-solid)] px-4 py-3">
                            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-[var(--text-muted)]">
                              {formatMetadata(row.metadata)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
