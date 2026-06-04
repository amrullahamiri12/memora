import { describe, it, expect } from 'vitest';
import { getSiteUrl } from './seo';

describe('seo', () => {
  it('getSiteUrl falls back to memora.cards', () => {
    expect(getSiteUrl()).toMatch(/^https?:\/\//);
  });
});
