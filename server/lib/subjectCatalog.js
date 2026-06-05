/**
 * Market popularity ranks for catalog ordering (lower = more in-demand in K–12 / college).
 * Based on typical US course enrollment and search interest (math, sciences, CS, etc.).
 */
const DEFAULT_MARKET_RANK = 500;

const MARKET_RANK_RULES = [
  { rank: 10, match: /\b(math|mathematics|arithmetic|numeracy)\b/i },
  { rank: 15, match: /\b(algebra|pre-?algebra|linear algebra)\b/i },
  { rank: 20, match: /\b(geometry|trigonometry|trig)\b/i },
  { rank: 25, match: /\b(calculus|precalc|pre-?calculus|multivariable)\b/i },
  { rank: 30, match: /\b(statistics|stats|probability|data analysis)\b/i },
  { rank: 35, match: /\b(english|language arts|ela|reading|writing|literature|grammar|composition)\b/i },
  { rank: 40, match: /\b(biology|life science|anatomy|physiology|ecology|genetics)\b/i },
  { rank: 45, match: /\b(chemistry|organic chem|biochem|biochemistry)\b/i },
  { rank: 50, match: /\b(physics|mechanics|thermodynamics|electromagnetism)\b/i },
  { rank: 55, match: /\b(history|social studies|civics|government|political science)\b/i },
  { rank: 60, match: /\b(us history|american history|world history|european history)\b/i },
  { rank: 65, match: /\b(geography|earth science|environmental science)\b/i },
  { rank: 70, match: /\b(computer science|programming|coding|software development|\bcs\b)\b/i },
  { rank: 75, match: /\b(web dev|web development|html|css|javascript|frontend|backend|full stack)\b/i },
  {
    rank: 80,
    match: /\b(ai|artificial intelligence|machine learning|\bml\b|data science|deep learning|llm|nlp)\b/i,
  },
  { rank: 85, match: /\b(economics|microeconomics|macroeconomics|finance|accounting|business)\b/i },
  { rank: 90, match: /\b(psychology|sociology|anthropology)\b/i },
  { rank: 95, match: /\b(sat|act|ap exam|test prep|standardized test)\b/i },
  { rank: 100, match: /\b(spanish|french|german|mandarin|language learning|foreign language)\b/i },
  { rank: 110, match: /\b(nursing|medicine|mcat|health science|pharmacology)\b/i },
  { rank: 120, match: /\b(engineering|electrical|mechanical|civil engineering)\b/i },
  { rank: 130, match: /\b(philosophy|ethics)\b/i },
  { rank: 140, match: /\b(art history|music theory|fine arts)\b/i },
];

function marketRankForName(name) {
  if (!name || typeof name !== 'string') return DEFAULT_MARKET_RANK;
  let best = DEFAULT_MARKET_RANK;
  for (const { rank, match } of MARKET_RANK_RULES) {
    if (match.test(name.trim())) {
      best = Math.min(best, rank);
    }
  }
  return best;
}

/**
 * Sort catalog rows: market demand first, then Memora enrollments, then content size, then name.
 */
function sortCatalogSubjects(subjects) {
  return [...subjects].sort((a, b) => {
    const marketA = marketRankForName(a.name);
    const marketB = marketRankForName(b.name);
    if (marketA !== marketB) return marketA - marketB;

    const enrollA = a.enrollmentCount ?? 0;
    const enrollB = b.enrollmentCount ?? 0;
    if (enrollA !== enrollB) return enrollB - enrollA;

    const topicsA = a.topicCount ?? 0;
    const topicsB = b.topicCount ?? 0;
    if (topicsA !== topicsB) return topicsB - topicsA;

    return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
  });
}

/** Public API shape — omits internal sort fields. */
function toPublicCatalogItem({ id, name, topicCount }) {
  return { id, name, topicCount: topicCount ?? 0 };
}

module.exports = {
  DEFAULT_MARKET_RANK,
  marketRankForName,
  sortCatalogSubjects,
  toPublicCatalogItem,
};
