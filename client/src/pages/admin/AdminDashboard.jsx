import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Layout from '../../components/Layout';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import { api } from '../../utils/api';
import { defaultReportRange, buildReportQuery } from '../../utils/reportDates';

const REPORT_LINKS = [
  {
    to: '/admin/reports/learners',
    title: 'Learner engagement',
    description: 'Streaks, mastery, last practice, and inactive learners. Export CSV.',
  },
  {
    to: '/admin/reports/content',
    title: 'Content health',
    description: 'Enrollment vs usage and low-mastery topics across subjects.',
  },
];

export default function AdminDashboard() {
  const [range, setRange] = useState(defaultReportRange);
  const [draftFrom, setDraftFrom] = useState(range.from);
  const [draftTo, setDraftTo] = useState(range.to);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (from, to) => {
    setLoading(true);
    setError('');
    api(`/admin/reports/overview${buildReportQuery({ from, to })}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(range.from, range.to);
  }, [range.from, range.to]);

  const applyRange = (e) => {
    e.preventDefault();
    setRange({ from: draftFrom, to: draftTo });
  };

  const kpis = data?.kpis;
  const growth = data?.growth;

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of learners, activity, and growth"
      />

      <Card className="mb-6">
        <h2 className="mb-1 text-lg font-semibold text-[var(--text-heading)]">Reports</h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Drill down into detailed tables beyond this overview.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {REPORT_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]"
            >
              <p className="font-semibold text-[var(--text-heading)]">{item.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{item.description}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <form onSubmit={applyRange} className="flex flex-wrap items-end gap-4">
          <Input
            label="From"
            type="date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
          />
          <Button type="submit">Apply range</Button>
        </form>
        {data?.range && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Showing activity from {data.range.from} to {data.range.to} (UTC)
          </p>
        )}
      </Card>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : (
        data && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard value={kpis.dau} label="Active today (DAU)" accent="accent" />
              <StatCard value={kpis.wau} label="Active last 7 days (WAU)" accent="secondary" />
              <StatCard value={kpis.mau} label="Active in range (MAU)" accent="forest" />
              <StatCard value={kpis.registeredActive} label="Registered users (active)" />
              <StatCard value={kpis.newSignups} label="New signups in range" accent="olive" />
              <StatCard value={kpis.cardsReviewedInRange} label="Card reviews in range" />
              <StatCard
                value={`${kpis.avgMasteryPercent}%`}
                label="Avg mastery (all progress)"
                accent="success"
              />
            </div>

            <Card className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-[var(--text-heading)]">
                Growth & operations
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard value={growth.signupsThisWeek} label="Signups this week" />
                <StatCard value={growth.signupsThisMonth} label="Signups this month" />
                <StatCard value={growth.verifiedUsers} label="Verified learners" accent="success" />
                <StatCard
                  value={growth.pendingVerification}
                  label="Pending verification"
                  accent="warning"
                />
                <StatCard value={growth.deactivatedUsers} label="Deactivated accounts" />
                <StatCard value={growth.guestAccounts} label="Guest sessions (total)" />
              </div>
            </Card>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <Card>
                <h2 className="mb-4 text-lg font-semibold text-[var(--text-heading)]">
                  Daily active learners
                </h2>
                {data.series.dailyActive.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No practice in this range.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={data.series.dailyActive}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="active_learners"
                        name="Learners"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <h2 className="mb-4 text-lg font-semibold text-[var(--text-heading)]">
                  Weekly signups
                </h2>
                {data.series.weeklySignups.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No signups in this range.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.series.weeklySignups}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        dataKey="signups"
                        name="Signups"
                        fill="var(--accent-deep)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>
          </>
        )
      )}
    </Layout>
  );
}
