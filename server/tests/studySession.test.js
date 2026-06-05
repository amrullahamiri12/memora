import { describe, it, expect } from 'vitest';
import {
  injectMasteryRepeats,
  orderCardsForStudy,
  MASTERY_REPEAT_FRACTION,
} from '../lib/studySession.js';

function cards(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    question: `Q${i}`,
    questionType: 'MCQ',
  }));
}

function countById(list) {
  const m = new Map();
  for (const c of list) {
    m.set(c.id, (m.get(c.id) || 0) + 1);
  }
  return m;
}

describe('injectMasteryRepeats', () => {
  it('does nothing when disabled (test mode)', () => {
    const ordered = cards(10);
    const progress = new Map();
    const result = injectMasteryRepeats(ordered, progress, { enabled: false });
    expect(result).toHaveLength(10);
    expect(result).toEqual(ordered);
  });

  it('does nothing for a single-card deck', () => {
    const ordered = cards(1);
    const result = injectMasteryRepeats(ordered, new Map());
    expect(result).toHaveLength(1);
  });

  it('adds roughly 30% extra presentations for a 10-card deck', () => {
    const ordered = cards(10);
    const result = injectMasteryRepeats(ordered, new Map(), { fraction: 0.3 });
    expect(result).toHaveLength(13);

    const counts = countById(result);
    const repeated = [...counts.values()].filter((n) => n > 1).length;
    expect(repeated).toBe(3);
    expect([...counts.values()].every((n) => n <= 2)).toBe(true);
  });

  it('spaces repeats through the deck instead of appending at the end', () => {
    const ordered = cards(10);
    const result = injectMasteryRepeats(ordered, new Map(), { fraction: 0.3 });
    const counts = countById(result);

    const repeatIds = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
    const lastThree = result.slice(-3).map((c) => c.id);
    const allRepeatsAtEnd = repeatIds.every((id) => lastThree.includes(id));
    expect(allRepeatsAtEnd).toBe(false);
  });

  it('only repeats non-mastered cards (needs practice or unseen)', () => {
    const ordered = cards(6);
    const progress = new Map([
      ['c0', { status: 'NEEDS_PRACTICE' }],
      ['c1', { status: 'NEEDS_PRACTICE' }],
      ['c2', { status: 'GOT_IT' }],
      ['c3', { status: 'GOT_IT' }],
      ['c4', { status: 'GOT_IT' }],
      ['c5', { status: 'GOT_IT' }],
    ]);

    const result = injectMasteryRepeats(ordered, progress, { fraction: 0.3 });
    const repeatedIds = [...countById(result).entries()]
      .filter(([, n]) => n > 1)
      .map(([id]) => id);

    expect(repeatedIds).toContain('c0');
    expect(repeatedIds).toContain('c1');
    expect(repeatedIds).not.toContain('c2');
    expect(repeatedIds).not.toContain('c5');
  });

  it('does not repeat when every card is mastered', () => {
    const ordered = cards(10);
    const progress = new Map(
      ordered.map((c) => [c.id, { status: 'GOT_IT' }])
    );

    const result = injectMasteryRepeats(ordered, progress, { fraction: 0.3 });
    expect(result).toHaveLength(10);
    expect(result).toEqual(ordered);
  });

  it('composes with orderCardsForStudy without throwing', () => {
    const deck = cards(8);
    const progress = new Map([['c1', { status: 'NEEDS_PRACTICE' }]]);
    const ordered = orderCardsForStudy(deck, progress, { weakFirst: true, shuffle: false });
    const withRepeats = injectMasteryRepeats(ordered, progress, { enabled: true });
    expect(withRepeats.length).toBeGreaterThan(ordered.length);
  });

  it('uses 30% as the default fraction constant', () => {
    expect(MASTERY_REPEAT_FRACTION).toBe(0.3);
  });
});
