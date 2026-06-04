const prisma = require('./prisma');
const { findOrCreateTopic, normalizeDifficulty } = require('./flashcards');
const {
  normalizeQuestionType,
  normalizeTrueFalseAnswer,
  validateFlashcardFields,
} = require('./questionTypes');

const REQUIRED_COLUMNS = ['subject', 'topic', 'question', 'answer', 'difficulty'];
const OPTIONAL_COLUMNS = ['questionType', 'distractor1', 'distractor2', 'distractor3'];
const COLUMN_ALIASES = {
  distractor_1: 'distractor1',
  distractor_2: 'distractor2',
  distractor_3: 'distractor3',
  question_type: 'questionType',
  type: 'questionType',
  correct_answer: 'answer',
  correctanswer: 'answer',
};

function parseCsvRow(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function normalizeHeader(header) {
  const key = header.toLowerCase().replace(/^\ufeff/, '').trim();
  return COLUMN_ALIASES[key] || key;
}

function escapeCsvField(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function parseFlashcardCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row');
  }

  const headers = parseCsvRow(lines[0]).map(normalizeHeader);
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new Error(`CSV missing required columns: ${missing.join(', ')}`);
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvRow(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return { ...row, lineNumber: index + 2 };
  });
}

function rowToFlashcardData(row) {
  const questionType = normalizeQuestionType(row.questionType || 'MCQ');
  const distractor1 = row.distractor1?.trim() || null;
  const distractor2 = row.distractor2?.trim() || null;
  const distractor3 = row.distractor3?.trim() || null;
  const question = row.question?.trim();
  const answer = row.answer?.trim();

  const { errors } = validateFlashcardFields({
    questionType,
    question,
    answer,
    distractor1,
    distractor2,
    distractor3,
  });

  const storedAnswer =
    questionType === 'TRUE_FALSE'
      ? normalizeTrueFalseAnswer(answer) || answer
      : answer;

  return {
    questionType,
    question,
    answer: storedAnswer,
    distractor1: questionType === 'MCQ' ? distractor1 : null,
    distractor2: questionType === 'MCQ' ? distractor2 : null,
    distractor3: questionType === 'MCQ' ? distractor3 : null,
    difficulty: normalizeDifficulty(row.difficulty),
    validationErrors: errors,
  };
}

async function importFlashcardsFromCsv(csvText) {
  const { importFlashcardsFromCsvFast } = require('./csvImportFast');
  return importFlashcardsFromCsvFast(csvText);
}

async function exportFlashcardsCsv() {
  const flashcards = await prisma.flashcard.findMany({
    include: { topic: { include: { subject: true } } },
    orderBy: [{ topic: { subject: { name: 'asc' } } }, { topic: { name: 'asc' } }, { question: 'asc' }],
  });

  const headers = [
    'subject',
    'topic',
    'questionType',
    'question',
    'answer',
    'distractor1',
    'distractor2',
    'distractor3',
    'difficulty',
  ];

  const lines = [headers.join(',')];

  for (const card of flashcards) {
    lines.push(
      [
        card.topic.subject.name,
        card.topic.name,
        card.questionType,
        card.question,
        card.answer,
        card.distractor1,
        card.distractor2,
        card.distractor3,
        card.difficulty,
      ]
        .map(escapeCsvField)
        .join(',')
    );
  }

  return lines.join('\n');
}

function getCsvTemplate() {
  return [
    'subject,topic,questionType,question,answer,distractor1,distractor2,distractor3,difficulty',
    'AI Concepts,Machine Learning Basics,MCQ,What is supervised learning?,Learning from labeled input-output pairs,Learning without any training data,Clustering unlabeled data only,Reinforcement from rewards only,Easy',
    'AI Concepts,Machine Learning Basics,TRUE_FALSE,Supervised learning requires labeled training data.,True,,,,Easy',
    'AI Concepts,Machine Learning Basics,FILL_BLANK,Cross-validation helps assess how well a model ___.,generalizes,,,,Medium',
    'AI Concepts,Neural Networks,MCQ,What is backpropagation?,Algorithm that updates weights using gradients,Algorithm that only runs at inference,Method for deleting hidden layers,Technique for data augmentation only,Medium',
    'AI Concepts,Prompt Engineering,TRUE_FALSE,Few-shot prompting includes example pairs in the prompt.,True,,,,Easy',
  ].join('\n');
}

module.exports = {
  parseFlashcardCsv,
  rowToFlashcardData,
  importFlashcardsFromCsv,
  exportFlashcardsCsv,
  getCsvTemplate,
  REQUIRED_COLUMNS,
  OPTIONAL_COLUMNS,
};
