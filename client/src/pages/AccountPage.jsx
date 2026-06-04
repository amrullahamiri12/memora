import Layout from '../components/Layout';
import ChangePassword from '../components/ChangePassword';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { isGuestUser } from '../utils/guest';
import GuestAccountUpgrade from '../components/GuestAccountUpgrade';

export default function AccountPage() {
  const { user } = useAuth();
  const guest = isGuestUser(user);

  return (
    <Layout>
      <PageHeader
        title="Account Settings"
        subtitle={
          guest ? 'Create an account to keep your study progress' : 'Manage your account and password'
        }
      />

      {guest ? (
        <GuestAccountUpgrade />
      ) : (
        <>
          <Card className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">Your Details</h2>
            <dl className="space-y-4 text-sm">
              <div className="flex gap-4 border-b border-[var(--border)] pb-3">
                <dt className="w-20 font-medium text-[var(--text-muted)]">Name</dt>
                <dd className="text-[var(--text-heading)]">{user?.name}</dd>
              </div>
              <div className="flex gap-4 border-b border-[var(--border)] pb-3">
                <dt className="w-20 font-medium text-[var(--text-muted)]">Email</dt>
                <dd className="text-[var(--text-heading)]">{user?.email}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-20 font-medium text-[var(--text-muted)]">Role</dt>
                <dd>
                  <span className="rounded-full bg-[var(--accent-glow)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
                    {user?.role}
                  </span>
                </dd>
              </div>
            </dl>
          </Card>

          <ChangePassword />
        </>
      )}
    </Layout>
  );
}
