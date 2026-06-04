function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseQuestionTypes(query) {
  if (!query || query === 'all') return null;
  const allowed = ['MCQ', 'TRUE_FALSE', 'FILL_BLANK'];
  const types = String(query)
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter((t) => allowed.includes(t));
  return types.length > 0 ? types : null;
}

function filterByQuestionTypes(cards, types) {
  if (!types?.length) return cards;
  return cards.filter((c) => types.includes(c.questionType));
}

function orderCardsForStudy(cards, progressByCardId, { weakFirst = true, shuffle = true }) {
  const weak = [];
  const strong = [];
  const unseen = [];

  for (const card of cards) {
    const progress = progressByCardId.get(card.id);
    if (!progress) {
      unseen.push(card);
    } else if (progress.status === 'NEEDS_PRACTICE') {
      weak.push(card);
    } else {
      strong.push(card);
    }
  }

  let ordered = weakFirst
    ? [...shuffleArray(weak), ...shuffleArray(unseen), ...shuffleArray(strong)]
    : [...cards];

  if (shuffle) {
    const weakIds = new Set(weak.map((c) => c.id));
    const priority = ordered.filter((c) => weakIds.has(c.id) || !progressByCardId.has(c.id));
    const rest = ordered.filter((c) => !priority.find((p) => p.id === c.id));
    ordered = [...shuffleArray(priority), ...shuffleArray(rest)];
  }

  return ordered;
}

module.exports = {
  shuffleArray,
  parseQuestionTypes,
  filterByQuestionTypes,
  orderCardsForStudy,
};
