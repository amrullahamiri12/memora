import { describe, it, expect } from 'vitest';
import { defaultReportRange, buildReportQuery } from './reportDates';

describe('reportDates', () => {
  it('defaultReportRange spans 30 days ending today (UTC dates)', () => {
    const { from, to } = defaultReportRange();
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate = new Date(`${to}T00:00:00Z`);
    const diffDays = Math.round((toDate - fromDate) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBe(29);
  });

  it('buildReportQuery omits empty values', () => {
    expect(buildReportQuery({ from: '2026-01-01', to: '', page: 2 })).toBe(
      '?from=2026-01-01&page=2'
    );
    expect(buildReportQuery({})).toBe('');
  });
});
