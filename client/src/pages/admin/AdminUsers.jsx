import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import SubjectPicker from '../../components/SubjectPicker';
import { api } from '../../utils/api';

const PAGE_SIZE = 15;
import {
  isSuperAdmin,
  canEditUser,
  canDeleteUser,
  roleLabel,
} from '../../utils/roles';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'USER',
  subjectIds: [],
};

function roleBadgeClass(role) {
  if (role === 'SUPER_ADMIN') return 'bg-[var(--accent-deep)]/15 text-[var(--accent-deep)]';
  if (role === 'ADMIN') return 'bg-[var(--accent-glow)] text-[var(--accent)]';
  return 'bg-[var(--surface-solid)] text-[var(--text-muted)]';
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [catalogSubjects, setCatalogSubjects] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const actorIsSuperAdmin = isSuperAdmin(currentUser?.role);

  const loadUsers = (targetPage = page) => {
    setLoading(true);
    const inactiveParam = includeInactive ? '&includeInactive=1' : '';
    api(`/admin/users?page=${targetPage}&limit=${PAGE_SIZE}${inactiveParam}`)
      .then((data) => {
        setUsers(data.items);
        setPagination(data.pagination);
        setPage(data.pagination.page);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers(page);
  }, [page, includeInactive]);

  useEffect(() => {
    if (!showForm || editingId) return;
    setCatalogLoading(true);
    api('/subjects/catalog')
      .then(setCatalogSubjects)
      .catch(() => setCatalogSubjects([]))
      .finally(() => setCatalogLoading(false));
  }, [showForm, editingId]);

  const handleAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const handleEdit = (user) => {
    if (!canEditUser(currentUser, user)) {
      setError('You cannot edit this user');
      return;
    }
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setEditingId(user.id);
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleVerifyEmail = async (user) => {
    if (!actorIsSuperAdmin) return;
    if (!confirm(`Mark ${user.email} as verified? They can study without clicking the email link.`)) {
      return;
    }
    try {
      await api(`/admin/users/${user.id}/verify-email`, { method: 'POST' });
      loadUsers(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (user) => {
    if (!canDeleteUser(currentUser, user)) {
      setError(
        user.id === currentUser?.id
          ? 'Use Account settings to close your own account'
          : 'You cannot deactivate this user'
      );
      return;
    }
    if (
      !confirm(
        `Deactivate "${user.name}" (${user.email})? They will not be able to sign in. Progress is kept and a super admin can reactivate them.`
      )
    ) {
      return;
    }
    try {
      await api(`/admin/users/${user.id}`, { method: 'DELETE' });
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else loadUsers(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReactivate = async (user) => {
    if (!actorIsSuperAdmin) return;
    if (!confirm(`Reactivate "${user.name}" (${user.email})? They can sign in again.`)) {
      return;
    }
    try {
      await api(`/admin/users/${user.id}/reactivate`, { method: 'POST' });
      loadUsers(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password.trim()) {
        payload.password = form.password;
      }

      if (editingId) {
        await api(`/admin/users/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        if (!form.password.trim()) {
          throw new Error('Password is required for new users');
        }
        const createPayload = { ...payload, password: form.password };
        if (form.role === 'USER' && form.subjectIds.length > 0) {
          createPayload.subjectIds = form.subjectIds;
        }
        await api('/admin/users', {
          method: 'POST',
          body: JSON.stringify(createPayload),
        });
      }
      handleCancel();
      loadUsers(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editingSelf = editingId === currentUser?.id;
  const lockRoleOnSelf =
    editingSelf && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN');

  const activeCount = users.filter((u) => u.active !== false).length;

  return (
    <Layout>
      <PageHeader
        title="Users"
        subtitle={
          includeInactive
            ? `${pagination.total} users (${activeCount} active on this page)`
            : `${pagination.total} active users`
        }
        action={!showForm && <Button onClick={handleAdd}>+ Add user</Button>}
      />

      <div className="mb-4 flex items-center gap-2">
        <input
          id="include-inactive"
          type="checkbox"
          checked={includeInactive}
          onChange={(e) => {
            setIncludeInactive(e.target.checked);
            setPage(1);
          }}
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        <label htmlFor="include-inactive" className="text-sm text-[var(--text-muted)]">
          Show deactivated users
        </label>
      </div>

      {error && <Alert>{error}</Alert>}

      {showForm && (
        <Card className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? 'Edit user' : 'New user'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label={editingId ? 'New password (optional)' : 'Password'}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingId}
                minLength={8}
                autoComplete="new-password"
              />
              <Select
                label="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={lockRoleOnSelf}
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                {actorIsSuperAdmin && <option value="SUPER_ADMIN">Super admin</option>}
              </Select>
            </div>
            {lockRoleOnSelf && (
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                You cannot change your own role.
                {currentUser?.role === 'SUPER_ADMIN' &&
                  ' Super admins can update their name, email, and password.'}
              </p>
            )}
            {!actorIsSuperAdmin && !editingId && (
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Only a super admin can create super admin accounts.
              </p>
            )}
            {!editingId && form.role === 'USER' && (
              <div className="mt-6 border-t border-[var(--border)] pt-6">
                <p className="mb-1 font-medium text-[var(--text-heading)]">Subjects to practice</p>
                <p className="mb-3 text-sm text-[var(--text-muted)]">
                  Optional — the user can also add subjects from their dashboard after login.
                </p>
                {catalogLoading ? (
                  <p className="text-sm text-[var(--text-muted)]">Loading subjects…</p>
                ) : (
                  <SubjectPicker
                    subjects={catalogSubjects}
                    selectedIds={form.subjectIds}
                    onChange={(subjectIds) => setForm({ ...form, subjectIds })}
                  />
                )}
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <Button type="submit" loading={saving}>
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)]">
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Name</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Email</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Role</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Status</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Verified</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Joined</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const allowEdit = canEditUser(currentUser, user);
                const allowDeactivate = canDeleteUser(currentUser, user) && user.active !== false;
                const inactive = user.active === false;

                return (
                  <tr
                    key={user.id}
                    className={`border-b border-[var(--border)] transition hover:bg-[var(--surface-hover)] ${i % 2 === 1 ? 'bg-[var(--surface)]/50' : ''} ${inactive ? 'opacity-70' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--text-heading)]">
                      {user.name}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(user.role)}`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inactive ? (
                        <span className="text-xs font-medium text-[var(--text-muted)]">
                          Deactivated
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[var(--accent)]">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.emailVerified ? (
                        <span className="text-xs font-medium text-[var(--accent)]">Yes</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        {actorIsSuperAdmin && !user.emailVerified && user.role === 'USER' && !inactive && (
                          <button
                            type="button"
                            onClick={() => handleVerifyEmail(user)}
                            className="font-medium text-[var(--accent)] hover:underline"
                          >
                            Verify email
                          </button>
                        )}
                        {allowEdit && !inactive ? (
                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            className="font-medium text-[var(--accent)] hover:underline"
                          >
                            Edit
                          </button>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                        {inactive && actorIsSuperAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleReactivate(user)}
                            className="font-medium text-[var(--accent)] hover:underline"
                          >
                            Reactivate
                          </button>
                        ) : allowDeactivate ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(user)}
                            className="font-medium text-[var(--danger)] hover:underline"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]" title="Not permitted">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
