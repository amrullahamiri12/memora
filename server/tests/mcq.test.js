const { buildOptions, gradeAnswer, normalize } = require('../lib/mcq');

describe('mcq', () => {
  it('normalizes answers for comparison', () => {
    expect(normalize('  Hello   World ')).toBe('hello world');
  });

  it('builds four options including the correct answer', () => {
    const options = buildOptions('Paris', ['London', 'Berlin'], ['Rome']);
    expect(options).toHaveLength(4);
    expect(options.some((o) => o.text === 'Paris')).toBe(true);
  });

  it('grades with case-insensitive match', () => {
    expect(gradeAnswer('Paris', 'paris')).toBe(true);
    expect(gradeAnswer('Paris', 'London')).toBe(false);
  });
});
