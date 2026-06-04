const {
  normalizeQuestionType,
  normalizeTrueFalseAnswer,
  validateFlashcardFields,
  gradeFlashcardAnswer,
  hasFillBlank,
} = require('../lib/questionTypes');

describe('questionTypes', () => {
  it('normalizes aliases to canonical types', () => {
    expect(normalizeQuestionType('true/false')).toBe('TRUE_FALSE');
    expect(normalizeQuestionType('fill-in-the-blank')).toBe('FILL_BLANK');
    expect(normalizeQuestionType('unknown')).toBe('MCQ');
  });

  it('validates true/false answers', () => {
    const valid = validateFlashcardFields({
      questionType: 'TRUE_FALSE',
      question: 'The sky is blue.',
      answer: 'True',
    });
    expect(valid.errors).toHaveLength(0);

    const invalid = validateFlashcardFields({
      questionType: 'TRUE_FALSE',
      question: 'The sky is blue.',
      answer: 'Maybe',
    });
    expect(invalid.errors.some((e) => e.includes('True/False'))).toBe(true);
  });

  it('requires blank marker for fill-in-the-blank', () => {
    const missing = validateFlashcardFields({
      questionType: 'FILL_BLANK',
      question: 'No blank here',
      answer: 'word',
    });
    expect(missing.errors.some((e) => e.includes('___'))).toBe(true);
    expect(hasFillBlank('Cross-validation checks ___.')).toBe(true);
  });

  it('rejects duplicate MCQ distractors', () => {
    const result = validateFlashcardFields({
      questionType: 'MCQ',
      question: 'Pick one',
      answer: 'Correct',
      distractor1: 'Wrong',
      distractor2: 'wrong',
    });
    expect(result.errors.some((e) => e.includes('unique'))).toBe(true);
  });

  it('grades answers by type', () => {
    expect(
      gradeFlashcardAnswer(
        { questionType: 'TRUE_FALSE', answer: 'True' },
        'true'
      )
    ).toBe(true);
    expect(
      gradeFlashcardAnswer({ questionType: 'MCQ', answer: 'Paris' }, '  paris ')
    ).toBe(true);
  });
});
