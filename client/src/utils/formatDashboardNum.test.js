import { describe, it, expect } from 'vitest';
import { formatDashboardNum } from './formatDashboardNum';

describe('formatDashboardNum', () => {
  it('formats numbers and preserves percentages', () => {
    expect(formatDashboardNum(1200)).toBe('1,200');
    expect(formatDashboardNum('42%')).toBe('42%');
    expect(formatDashboardNum(null)).toBe('—');
  });
});
