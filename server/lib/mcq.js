const { randomUUID } = require('crypto');

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalize(text) {
  return String(text).trim().toLowerCase().replace(/\s+/g, ' ');
}

const FALLBACK_DISTRACTORS = [
  'None of the above',
  'All of the above',
  'Not applicable in this context',
];

function buildOptions(correctAnswer, otherAnswers, customDistractors = []) {
  const unique = new Set();
  const distractors = [];

  for (const text of customDistractors) {
    const trimmed = String(text || '').trim();
    if (!trimmed || normalize(trimmed) === normalize(correctAnswer)) continue;
    if (unique.has(normalize(trimmed))) continue;
    unique.add(normalize(trimmed));
    distractors.push(trimmed);
  }

  for (const text of otherAnswers) {
    if (distractors.length >= 3) break;
    const trimmed = String(text).trim();
    if (!trimmed || normalize(trimmed) === normalize(correctAnswer)) continue;
    if (unique.has(normalize(trimmed))) continue;
    unique.add(normalize(trimmed));
    distractors.push(trimmed);
  }

  let i = 0;
  while (distractors.length < 3 && i < FALLBACK_DISTRACTORS.length) {
    const fallback = FALLBACK_DISTRACTORS[i++];
    if (normalize(fallback) !== normalize(correctAnswer) && !unique.has(normalize(fallback))) {
      unique.add(normalize(fallback));
      distractors.push(fallback);
    }
  }

  const chosen = distractors.slice(0, 3);
  return shuffle([
    { id: randomUUID(), text: correctAnswer },
    ...chosen.map((text) => ({ id: randomUUID(), text })),
  ]);
}

function attachMcqOptions(flashcards) {
  const answers = flashcards.map((c) => c.answer);

  return flashcards.map((card) => {
    const otherAnswers = answers.filter((_, i) => flashcards[i].id !== card.id);
    const customDistractors = [card.distractor1, card.distractor2, card.distractor3].filter(Boolean);
    const options = buildOptions(card.answer, otherAnswers, customDistractors);

    return {
      id: card.id,
      question: card.question,
      difficulty: card.difficulty,
      options,
    };
  });
}

function gradeAnswer(correctAnswer, selectedAnswer) {
  return normalize(correctAnswer) === normalize(selectedAnswer);
}

function pickDistractors(correctAnswer, otherAnswers, count = 3) {
  const unique = new Set();
  const distractors = [];

  for (const text of otherAnswers) {
    if (distractors.length >= count) break;
    const trimmed = String(text).trim();
    if (!trimmed || normalize(trimmed) === normalize(correctAnswer)) continue;
    if (unique.has(normalize(trimmed))) continue;
    unique.add(normalize(trimmed));
    distractors.push(trimmed);
  }

  let i = 0;
  while (distractors.length < count && i < FALLBACK_DISTRACTORS.length) {
    const fallback = FALLBACK_DISTRACTORS[i++];
    if (normalize(fallback) !== normalize(correctAnswer) && !unique.has(normalize(fallback))) {
      unique.add(normalize(fallback));
      distractors.push(fallback);
    }
  }

  return distractors.slice(0, count);
}

module.exports = {
  attachMcqOptions,
  buildOptions,
  gradeAnswer,
  normalize,
  pickDistractors,
  FALLBACK_DISTRACTORS,
};
