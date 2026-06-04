const { randomUUID } = require('crypto');
const { buildOptions, gradeAnswer, normalize } = require('./mcq');

const QUESTION_TYPES = ['MCQ', 'TRUE_FALSE', 'FILL_BLANK'];
const BLANK_PATTERN = /_{3,}/;

const TYPE_ALIASES = {
  mcq: 'MCQ',
  'multiple choice': 'MCQ',
  'multiple-choice': 'MCQ',
  true_false: 'TRUE_FALSE',
  truefalse: 'TRUE_FALSE',
  'true/false': 'TRUE_FALSE',
  'true false': 'TRUE_FALSE',
  tf: 'TRUE_FALSE',
  boolean: 'TRUE_FALSE',
  fill_blank: 'FILL_BLANK',
  fillblank: 'FILL_BLANK',
  'fill in the blank': 'FILL_BLANK',
  'fill-in-the-blank': 'FILL_BLANK',
  fill: 'FILL_BLANK',
};

function normalizeQuestionType(value) {
  const key = String(value || 'MCQ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return TYPE_ALIASES[key] || TYPE_ALIASES[key.replace(/ /g, '_')] || 'MCQ';
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function splitFillBlank(question) {
  return question.split(BLANK_PATTERN);
}

function hasFillBlank(question) {
  return BLANK_PATTERN.test(question);
}

function normalizeTrueFalseAnswer(answer) {
  const value = normalize(answer);
  if (value === 'true') return 'True';
  if (value === 'false') return 'False';
  return null;
}

function validateFlashcardFields({ questionType, question, answer, distractor1, distractor2, distractor3 }) {
  const type = normalizeQuestionType(questionType);
  const errors = [];

  if (!question?.trim()) errors.push('Question is required');
  if (!answer?.trim()) errors.push('Answer is required');

  if (type === 'TRUE_FALSE') {
    if (!normalizeTrueFalseAnswer(answer)) {
      errors.push('True/False answer must be "True" or "False"');
    }
  }

  if (type === 'FILL_BLANK') {
    if (!hasFillBlank(question)) {
      errors.push('Fill-in-the-blank questions must include ___ where the answer goes');
    }
  }

  if (type === 'MCQ') {
    const distractors = [distractor1, distractor2, distractor3].filter((d) => d?.trim());
    const unique = new Set(distractors.map((d) => normalize(d)));
    if (unique.size !== distractors.length) {
      errors.push('MCQ distractors must be unique');
    }
    for (const d of distractors) {
      if (normalize(d) === normalize(answer)) {
        errors.push('MCQ distractors cannot match the correct answer');
      }
    }
  }

  return { type, errors };
}

function preparePracticeCard(card, allCards) {
  const questionType = normalizeQuestionType(card.questionType);
  const base = {
    id: card.id,
    questionType,
    difficulty: card.difficulty,
  };

  if (questionType === 'TRUE_FALSE') {
    return {
      ...base,
      question: card.question,
      options: shuffle([
        { id: randomUUID(), text: 'True' },
        { id: randomUUID(), text: 'False' },
      ]),
    };
  }

  if (questionType === 'FILL_BLANK') {
    const parts = splitFillBlank(card.question);
    return {
      ...base,
      question: card.question,
      parts,
    };
  }

  const mcqPool = allCards.filter((c) => normalizeQuestionType(c.questionType) === 'MCQ');
  const otherAnswers = mcqPool
    .filter((c) => c.id !== card.id)
    .map((c) => c.answer);
  const customDistractors = [card.distractor1, card.distractor2, card.distractor3].filter(Boolean);
  const options = buildOptions(card.answer, otherAnswers, customDistractors);

  return {
    ...base,
    question: card.question,
    options,
  };
}

function preparePracticeCards(flashcards) {
  return flashcards.map((card) => preparePracticeCard(card, flashcards));
}

function gradeFlashcardAnswer(flashcard, selectedAnswer) {
  const type = normalizeQuestionType(flashcard.questionType);

  if (type === 'TRUE_FALSE') {
    const expected = normalizeTrueFalseAnswer(flashcard.answer);
    const selected = normalizeTrueFalseAnswer(selectedAnswer);
    return expected !== null && selected !== null && expected === selected;
  }

  return gradeAnswer(flashcard.answer, selectedAnswer);
}

function formatCorrectAnswer(flashcard) {
  const type = normalizeQuestionType(flashcard.questionType);
  if (type === 'TRUE_FALSE') {
    return normalizeTrueFalseAnswer(flashcard.answer) || flashcard.answer;
  }
  return flashcard.answer;
}

module.exports = {
  QUESTION_TYPES,
  BLANK_PATTERN,
  normalizeQuestionType,
  normalizeTrueFalseAnswer,
  validateFlashcardFields,
  preparePracticeCards,
  gradeFlashcardAnswer,
  formatCorrectAnswer,
  hasFillBlank,
  splitFillBlank,
};
