export function formatDashboardNum(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'string' && value.endsWith('%')) return value;
  return Number(value).toLocaleString();
}
