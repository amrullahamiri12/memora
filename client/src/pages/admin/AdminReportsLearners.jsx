import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import { api, downloadAuthenticatedFile } from '../../utils/api';
import { buildReportQuery } from '../../utils/reportDates';

const PAGE_SIZE = 20;

export default function AdminReportsLearners() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('USER');
  const [inactiveDays, setInactiveDays] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = (targetPage = page) => {
    setLoading(true);
    setError('');
    api(
      `/admin/reports/learners${buildReportQuery({
        page: targetPage,
        limit: PAGE_SIZE,
        role,
        inactiveDays: inactiveDays || undefined,
        includeInactive: includeInactive ? '1' : undefined,
      })}`
    )
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
        setPage(data.pagination.page);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page);
  }, [page, role, inactiveDays, includeInactive]);

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      await downloadAuthenticatedFile(
        `/admin/reports/learners${buildReportQuery({
          format: 'csv',
          role,
          inactiveDays: inactiveDays || undefined,
          includeInactive: includeInactive ? '1' : undefined,
        })}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Learner engagement"
        subtitle={`${pagination.total} learners match filters`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/users">
              <Button variant="secondary">Manage users</Button>
            </Link>
            <Button onClick={handleExport} loading={exporting}>
              Export CSV
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="USER">Learners (USER)</option>
            <option value="ADMIN">Admins</option>
            <option value="SUPER_ADMIN">Super admins</option>
            <option value="ALL">All roles</option>
          </Select>
          <Select
            label="Inactive"
            value={inactiveDays}
            onChange={(e) => { setInactiveDays(e.target.value); setPage(1); }}
          >
            <option value="">Any activity</option>
            <option value="7">Inactive 7+ days</option>
            <option value="14">Inactive 14+ days</option>
            <option value="30">Inactive 30+ days</option>
          </Select>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => {
                  setIncludeInactive(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-[var(--border)]"
              />
              Include deactivated
            </label>
          </div>
        </div>
      </Card>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)]">
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Name</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Email</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Subjects</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Mastery</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Streak</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Last practice</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-[var(--border)] ${i % 2 === 1 ? 'bg-[var(--surface)]/50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-[var(--text-heading)]">{row.name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{row.email}</td>
                  <td className="px-4 py-3">{row.enrolledSubjects}</td>
                  <td className="px-4 py-3">
                    {row.mastered + row.needsPractice === 0
                      ? '—'
                      : `${row.masteryPercent}% (${row.mastered}/${row.mastered + row.needsPractice})`}
                  </td>
                  <td className="px-4 py-3">{row.streak}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {row.lastPracticed
                      ? new Date(row.lastPracticed).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {!row.active ? (
                      <span className="text-xs font-medium text-[var(--text-muted)]">Deactivated</span>
                    ) : (
                      <span className="text-xs font-medium text-[var(--accent)]">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        </div>
      )}
    </Layout>
  );
}
