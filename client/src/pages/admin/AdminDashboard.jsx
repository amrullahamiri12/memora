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
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import DashboardKpiTile from '../../components/admin/DashboardKpiTile';
import { formatDashboardNum } from '../../utils/formatDashboardNum';
import { api } from '../../utils/api';
import { defaultReportRange, buildReportQuery } from '../../utils/reportDates';

const REPORT_LINKS = [
  {
    to: '/admin/reports/learners',
    title: 'Learner engagement',
    description: 'Streaks, mastery, inactive learners, and CSV export.',
    tone: 'accent',
  },
  {
    to: '/admin/reports/content',
    title: 'Content health',
    description: 'Topic usage, enrollments, and low-mastery areas.',
    tone: 'cyan',
  },
];

const TONE_ICON_BG = {
  accent: 'bg-[var(--accent-glow)] text-[var(--accent-deep)]',
  cyan: 'bg-[var(--tone-cyan-bg)] text-[var(--tone-cyan)]',
};

function PanelHeading({ title, subtitle }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-heading)]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>}
      </div>
    </div>
  );
}

function OpsRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 last:border-0">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span
        className={`text-sm font-semibold ${
          tone === 'success'
            ? 'text-[var(--success)]'
            : tone === 'warning'
              ? 'text-[var(--warning)]'
              : 'text-[var(--text-heading)]'
        }`}
      >
        {formatDashboardNum(value)}
      </span>
    </div>
  );
}

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
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-heading)]">
            Dashboard
          </h1>
          <p className="mt-1.5 max-w-xl text-base text-[var(--text-muted)]">
            Activity, growth, and learning outcomes at a glance.
          </p>
          {data?.range && !loading && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {data.range.from} → {data.range.to} (UTC)
            </p>
          )}
        </div>

        <form
          onSubmit={applyRange}
          className="glass-card flex w-full max-w-lg flex-wrap items-end gap-3 rounded-2xl p-4 lg:justify-end"
        >
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
          <Button type="submit" className="shrink-0">
            Apply
          </Button>
        </form>
      </header>

      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <Spinner />
        </div>
      ) : (
        data && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardKpiTile
                label="Active today"
                value={kpis.dau}
                hint="Daily active learners"
                tone="accent"
              />
              <DashboardKpiTile
                label="Active (7 days)"
                value={kpis.wau}
                hint="Weekly active learners"
                tone="cyan"
              />
              <DashboardKpiTile
                label="Active in range"
                value={kpis.mau}
                hint="Monthly active in period"
                tone="forest"
              />
              <DashboardKpiTile
                label="Registered users"
                value={kpis.registeredActive}
                hint="Active accounts"
                tone="olive"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <Card className="rounded-2xl p-6">
                  <PanelHeading
                    title="Daily active learners"
                    subtitle="Distinct learners who practiced each day"
                  />
                  {data.series.dailyActive.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No practice in this range.</p>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.series.dailyActive} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--surface-solid)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="active_learners"
                            name="Learners"
                            stroke="var(--accent)"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <Card className="rounded-2xl p-6">
                  <PanelHeading title="Weekly signups" subtitle="New accounts by week in range" />
                  {data.series.weeklySignups.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No signups in this range.</p>
                  ) : (
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.series.weeklySignups} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--surface-solid)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                            }}
                          />
                          <Bar
                            dataKey="signups"
                            name="Signups"
                            fill="var(--accent-deep)"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={48}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <Card className="rounded-2xl p-6">
                  <PanelHeading title="Learning snapshot" subtitle="Outcomes in selected period" />
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <DashboardKpiTile
                      label="Avg mastery"
                      value={`${kpis.avgMasteryPercent}%`}
                      tone="success"
                    />
                    <DashboardKpiTile
                      label="Card reviews"
                      value={kpis.cardsReviewedInRange}
                      tone="sage"
                    />
                  </div>
                  <div className="mt-4">
                    <DashboardKpiTile
                      label="New signups"
                      value={kpis.newSignups}
                      hint="In selected date range"
                      tone="default"
                    />
                  </div>
                </Card>

                <Card className="rounded-2xl p-6">
                  <PanelHeading title="Operations" subtitle="Accounts and verification" />
                  <OpsRow label="Signups this week" value={growth.signupsThisWeek} />
                  <OpsRow label="Signups this month" value={growth.signupsThisMonth} />
                  <OpsRow label="Verified learners" value={growth.verifiedUsers} tone="success" />
                  <OpsRow
                    label="Pending verification"
                    value={growth.pendingVerification}
                    tone="warning"
                  />
                  <OpsRow label="Deactivated" value={growth.deactivatedUsers} />
                  <OpsRow label="Guest sessions" value={growth.guestAccounts} />
                </Card>
              </div>
            </section>
          </div>
        )
      )}

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-[var(--text-heading)]">Reports</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Open detailed tables for learners and curriculum.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {REPORT_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="glass-card glass-card-hover group flex items-start gap-4 rounded-2xl border p-6"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${TONE_ICON_BG[item.tone]}`}
              >
                →
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--text-heading)] group-hover:text-[var(--accent)]">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
