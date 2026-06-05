const {
  marketRankForName,
  sortCatalogSubjects,
  DEFAULT_MARKET_RANK,
} = require('../lib/subjectCatalog');

describe('subjectCatalog popularity', () => {
  describe('marketRankForName', () => {
    it('ranks core STEM subjects ahead of niche topics', () => {
      expect(marketRankForName('Mathematics')).toBeLessThan(marketRankForName('Music Theory'));
      expect(marketRankForName('Biology')).toBeLessThan(marketRankForName('Philosophy'));
      expect(marketRankForName('Algebra I')).toBeLessThan(marketRankForName('Art History'));
    });

    it('recognizes AI and web dev subjects', () => {
      expect(marketRankForName('AI Concepts')).toBeLessThan(DEFAULT_MARKET_RANK);
      expect(marketRankForName('Web Dev')).toBeLessThan(DEFAULT_MARKET_RANK);
    });

    it('returns default rank for unknown names', () => {
      expect(marketRankForName('Obscure Niche Topic')).toBe(DEFAULT_MARKET_RANK);
    });
  });

  describe('sortCatalogSubjects', () => {
    it('orders by market rank then enrollment count', () => {
      const sorted = sortCatalogSubjects([
        { id: '1', name: 'Philosophy', topicCount: 5, enrollmentCount: 100 },
        { id: '2', name: 'Mathematics', topicCount: 8, enrollmentCount: 10 },
        { id: '3', name: 'Biology', topicCount: 6, enrollmentCount: 50 },
      ]);

      expect(sorted.map((s) => s.name)).toEqual(['Mathematics', 'Biology', 'Philosophy']);
    });

    it('uses enrollment as tiebreaker within same market tier', () => {
      const sorted = sortCatalogSubjects([
        { id: '1', name: 'AI Concepts', topicCount: 10, enrollmentCount: 5 },
        { id: '2', name: 'Web Dev', topicCount: 3, enrollmentCount: 40 },
      ]);

      expect(sorted[0].name).toBe('Web Dev');
    });
  });
});
