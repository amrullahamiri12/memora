export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
