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
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const actorIsSuperAdmin = isSuperAdmin(currentUser?.role);

  const loadUsers = (targetPage = page) => {
    setLoading(true);
    api(`/admin/users?page=${targetPage}&limit=${PAGE_SIZE}`)
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
  }, [page]);

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

  const handleDelete = async (user) => {
    if (!canDeleteUser(currentUser, user)) {
      setError(
        user.id === currentUser?.id
          ? 'You cannot delete your own account while logged in'
          : 'You cannot delete this user'
      );
      return;
    }
    if (!confirm(`Delete user "${user.name}" (${user.email})? Their progress will be removed.`)) {
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
        await api('/admin/users', {
          method: 'POST',
          body: JSON.stringify({ ...payload, password: form.password }),
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

  return (
    <Layout>
      <PageHeader
        title="Users"
        subtitle={`${pagination.total} registered users`}
        action={!showForm && <Button onClick={handleAdd}>+ Add user</Button>}
      />

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
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Joined</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const allowEdit = canEditUser(currentUser, user);
                const allowDelete = canDeleteUser(currentUser, user);

                return (
                  <tr
                    key={user.id}
                    className={`border-b border-[var(--border)] transition hover:bg-[var(--surface-hover)] ${i % 2 === 1 ? 'bg-[var(--surface)]/50' : ''}`}
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
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        {allowEdit ? (
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
                        {allowDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            className="font-medium text-[var(--danger)] hover:underline"
                          >
                            Delete
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
