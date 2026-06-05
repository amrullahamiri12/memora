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

const MASTERY_REPEAT_FRACTION = 0.3;

function isEligibleForRepeat(card, progressByCardId) {
  const progress = progressByCardId.get(card.id);
  if (!progress) return true;
  return progress.status === 'NEEDS_PRACTICE';
}

function pickCardsToRepeat(ordered, progressByCardId, repeatCount) {
  const weak = [];
  const unseen = [];

  for (const card of ordered) {
    const progress = progressByCardId.get(card.id);
    if (!progress) unseen.push(card);
    else if (progress.status === 'NEEDS_PRACTICE') weak.push(card);
  }

  const pool = [...shuffleArray(weak), ...shuffleArray(unseen)];
  const seen = new Set();
  const picked = [];

  for (const card of pool) {
    if (picked.length >= repeatCount) break;
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    picked.push(card);
  }

  return picked;
}

/**
 * Re-present ~30% of cards once more, spaced through the session (not clustered at the end).
 * Skipped for test mode and very small decks.
 */
function injectMasteryRepeats(
  ordered,
  progressByCardId,
  { fraction = MASTERY_REPEAT_FRACTION, enabled = true } = {}
) {
  if (!enabled || ordered.length < 2) return ordered;

  const eligibleCount = ordered.filter((c) => isEligibleForRepeat(c, progressByCardId)).length;
  if (eligibleCount === 0) return ordered;

  const repeatCount = Math.min(
    eligibleCount,
    ordered.length - 1,
    Math.max(ordered.length >= 3 ? 1 : 0, Math.round(ordered.length * fraction))
  );
  if (repeatCount === 0) return ordered;

  const toRepeat = pickCardsToRepeat(ordered, progressByCardId, repeatCount);
  if (toRepeat.length === 0) return ordered;

  const result = [...ordered];
  const segmentSize = ordered.length / (toRepeat.length + 1);

  const insertions = toRepeat
    .map((card, i) => ({
      card,
      index: Math.min(ordered.length - 1, Math.max(1, Math.floor((i + 1) * segmentSize))),
    }))
    .sort((a, b) => b.index - a.index);

  for (const { card, index } of insertions) {
    result.splice(index, 0, card);
  }

  return result;
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
  MASTERY_REPEAT_FRACTION,
  shuffleArray,
  parseQuestionTypes,
  filterByQuestionTypes,
  orderCardsForStudy,
  injectMasteryRepeats,
};
