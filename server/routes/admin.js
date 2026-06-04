const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { findOrCreateTopic } = require('../lib/flashcards');
const {
  importFlashcardsFromCsv,
  exportFlashcardsCsv,
  getCsvTemplate,
} = require('../lib/csvFlashcards');
const {
  QUESTION_TYPES,
  normalizeQuestionType,
  normalizeTrueFalseAnswer,
  validateFlashcardFields,
} = require('../lib/questionTypes');
const {
  isSuperAdmin,
  canAssignRole,
  canEditUser,
  assertRoleChangeAllowed,
} = require('../lib/roles');
const { enrollUserInSubjects } = require('../lib/userSubjects');
const { deactivateUser, reactivateUser } = require('../lib/userLifecycle');
const { isGuestEmail } = require('../lib/guestIdentity');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const validate = require('../middleware/validate');
const { parsePagination, paginatedResponse } = require('../lib/pagination');
const { getMaxCsvBytes } = require('../lib/config');

const router = express.Router();

function normalizeDistractor(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
}

function flashcardToJson(flashcard) {
  return {
    id: flashcard.id,
    questionType: flashcard.questionType,
    question: flashcard.question,
    answer: flashcard.answer,
    distractor1: flashcard.distractor1,
    distractor2: flashcard.distractor2,
    distractor3: flashcard.distractor3,
    difficulty: flashcard.difficulty,
    topicId: flashcard.topicId,
    topicName: flashcard.topic.name,
    subjectId: flashcard.topic.subjectId,
    subjectName: flashcard.topic.subject.name,
  };
}

function flashcardDataFromBody(body) {
  const { subject, topic, question, answer, difficulty } = body;
  const questionType = normalizeQuestionType(body.questionType);
  const distractor1 = normalizeDistractor(body.distractor1);
  const distractor2 = normalizeDistractor(body.distractor2);
  const distractor3 = normalizeDistractor(body.distractor3);

  const { errors } = validateFlashcardFields({
    questionType,
    question,
    answer,
    distractor1,
    distractor2,
    distractor3,
  });
  if (errors.length > 0) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    throw err;
  }

  const storedAnswer =
    questionType === 'TRUE_FALSE' ? normalizeTrueFalseAnswer(answer) || answer.trim() : answer.trim();

  return {
    subject,
    topic,
    questionType,
    question: question.trim(),
    answer: storedAnswer,
    difficulty,
    distractor1: questionType === 'MCQ' ? distractor1 : null,
    distractor2: questionType === 'MCQ' ? distractor2 : null,
    distractor3: questionType === 'MCQ' ? distractor3 : null,
  };
}

router.use(authMiddleware, adminMiddleware);

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  emailVerifiedAt: true,
  deactivatedAt: true,
};

function formatAdminUser(user) {
  const staff = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    emailVerified: staff || Boolean(user.emailVerifiedAt) || isGuestEmail(user.email),
    active: !user.deactivatedAt,
  };
}

async function countSuperAdmins(excludeUserId) {
  return prisma.user.count({
    where: {
      role: 'SUPER_ADMIN',
      deactivatedAt: null,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

const userValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role')
    .isIn(['USER', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('Role must be USER, ADMIN, or SUPER_ADMIN'),
];

router.get('/users', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15 });
    const includeInactive =
      req.query.includeInactive === 'true' || req.query.includeInactive === '1';
    const where = {
      NOT: { email: { endsWith: '@guest.memora.local' } },
      ...(includeInactive ? {} : { deactivatedAt: null }),
    };
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    res.json(paginatedResponse(users.map(formatAdminUser), total, { page, limit }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post(
  '/users',
  [
    ...userValidators,
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!canAssignRole(req.user.role, role)) {
        return res.status(403).json({ error: 'You cannot assign that role' });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, passwordHash, emailVerifiedAt: new Date(), role },
        select: userSelect,
      });

      if (role === 'USER' && Array.isArray(req.body.subjectIds) && req.body.subjectIds.length > 0) {
        await enrollUserInSubjects(user.id, req.body.subjectIds);
      }

      res.status(201).json(formatAdminUser(user));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

router.put(
  '/users/:id',
  [
    ...userValidators,
    body('password')
      .optional({ values: 'falsy' })
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, role, password } = req.body;
      const targetId = req.params.id;

      const existing = await prisma.user.findUnique({ where: { id: targetId } });
      if (!existing) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!canEditUser(req.user, existing)) {
        return res.status(403).json({ error: 'You cannot edit this user' });
      }

      const roleError = assertRoleChangeAllowed(req.user, existing, role);
      if (roleError) {
        return res.status(400).json({ error: roleError });
      }

      if (existing.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
        const otherSuperAdmins = await countSuperAdmins(targetId);
        if (otherSuperAdmins === 0) {
          return res.status(400).json({ error: 'Cannot demote the last super admin' });
        }
      }

      const emailTaken = await prisma.user.findFirst({
        where: { email, id: { not: targetId } },
      });
      if (emailTaken) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      const data = { name, email, role };
      if (password) {
        data.passwordHash = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id: targetId },
        data,
        select: userSelect,
      });

      res.json(formatAdminUser(user));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

router.delete('/users/:id', async (req, res) => {
  try {
    const result = await deactivateUser(req.user, req.params.id);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

router.post('/users/:id/reactivate', async (req, res) => {
  try {
    const result = await reactivateUser(req.user, req.params.id);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reactivate user' });
  }
});

router.get('/subjects', async (_req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        topics: {
          include: { _count: { select: { flashcards: true } } },
          orderBy: { name: 'asc' },
        },
        _count: { select: { topics: true } },
      },
      orderBy: { name: 'asc' },
    });

    const result = subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      topicCount: subject._count.topics,
      cardCount: subject.topics.reduce((sum, t) => sum + t._count.flashcards, 0),
      topics: subject.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        subjectId: topic.subjectId,
        cardCount: topic._count.flashcards,
      })),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.post(
  '/subjects',
  [body('name').trim().notEmpty().withMessage('Subject name is required')],
  validate,
  async (req, res) => {
    try {
      const name = req.body.name.trim();
      const existing = await prisma.subject.findUnique({ where: { name } });
      if (existing) {
        return res.status(409).json({ error: 'Subject already exists' });
      }

      const subject = await prisma.subject.create({ data: { name } });
      res.status(201).json({ id: subject.id, name: subject.name, topicCount: 0, cardCount: 0, topics: [] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create subject' });
    }
  }
);

router.put(
  '/subjects/:id',
  [body('name').trim().notEmpty().withMessage('Subject name is required')],
  validate,
  async (req, res) => {
    try {
      const name = req.body.name.trim();
      const conflict = await prisma.subject.findFirst({
        where: { name, NOT: { id: req.params.id } },
      });
      if (conflict) {
        return res.status(409).json({ error: 'Subject name already in use' });
      }

      const subject = await prisma.subject.update({
        where: { id: req.params.id },
        data: { name },
      });
      res.json({ id: subject.id, name: subject.name });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Subject not found' });
      }
      console.error(err);
      res.status(500).json({ error: 'Failed to update subject' });
    }
  }
);

router.delete('/subjects/:id', async (req, res) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Subject not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

router.post(
  '/topics',
  [
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('name').trim().notEmpty().withMessage('Topic name is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { subjectId } = req.body;
      const name = req.body.name.trim();

      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      const existing = await prisma.topic.findUnique({
        where: { subjectId_name: { subjectId, name } },
      });
      if (existing) {
        return res.status(409).json({ error: 'Topic already exists in this subject' });
      }

      const topic = await prisma.topic.create({ data: { subjectId, name } });
      res.status(201).json({ id: topic.id, name: topic.name, subjectId, cardCount: 0 });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create topic' });
    }
  }
);

router.put(
  '/topics/:id',
  [body('name').trim().notEmpty().withMessage('Topic name is required')],
  validate,
  async (req, res) => {
    try {
      const name = req.body.name.trim();
      const topic = await prisma.topic.findUnique({ where: { id: req.params.id } });
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }

      const conflict = await prisma.topic.findFirst({
        where: { subjectId: topic.subjectId, name, NOT: { id: req.params.id } },
      });
      if (conflict) {
        return res.status(409).json({ error: 'Topic name already exists in this subject' });
      }

      const updated = await prisma.topic.update({
        where: { id: req.params.id },
        data: { name },
      });
      res.json({ id: updated.id, name: updated.name, subjectId: updated.subjectId });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Topic not found' });
      }
      console.error(err);
      res.status(500).json({ error: 'Failed to update topic' });
    }
  }
);

router.delete('/topics/:id', async (req, res) => {
  try {
    await prisma.topic.delete({ where: { id: req.params.id } });
    res.json({ message: 'Topic deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Topic not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

router.post(
  '/flashcards/import',
  [body('csv').isString().notEmpty().withMessage('CSV content is required')],
  validate,
  async (req, res) => {
    try {
      const csv = req.body.csv;
      if (Buffer.byteLength(csv, 'utf8') > getMaxCsvBytes()) {
        return res.status(413).json({ error: 'CSV file is too large (max 2MB)' });
      }
      const results = await importFlashcardsFromCsv(csv);
      res.json(results);
    } catch (err) {
      res.status(400).json({ error: err.message || 'Invalid CSV' });
    }
  }
);

router.get('/flashcards/import/template', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="memora-mcq-template.csv"');
  res.send(getCsvTemplate());
});

router.get('/flashcards/export', async (_req, res) => {
  try {
    const csv = await exportFlashcardsCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="memora-flashcards-export.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export flashcards' });
  }
});

router.get('/flashcards', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const where = search
      ? {
          OR: [
            { question: { contains: search } },
            { answer: { contains: search } },
            { topic: { name: { contains: search } } },
            { topic: { subject: { name: { contains: search } } } },
          ],
        }
      : {};

    const [total, flashcards] = await Promise.all([
      prisma.flashcard.count({ where }),
      prisma.flashcard.findMany({
        where,
        include: {
          topic: {
            include: { subject: true },
          },
        },
        orderBy: [{ topic: { subject: { name: 'asc' } } }, { topic: { name: 'asc' } }],
        skip,
        take: limit,
      }),
    ]);

    const result = flashcards.map(flashcardToJson);
    res.json(paginatedResponse(result, total, { page, limit }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

const flashcardValidators = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('answer').trim().notEmpty().withMessage('Answer is required'),
  body('difficulty')
    .isIn(['EASY', 'MEDIUM', 'HARD'])
    .withMessage('Difficulty must be EASY, MEDIUM, or HARD'),
  body('questionType')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      const type = normalizeQuestionType(value);
      if (!QUESTION_TYPES.includes(type)) {
        throw new Error('Question type must be MCQ, TRUE_FALSE, or FILL_BLANK');
      }
      return true;
    }),
  body('distractor1').optional().trim(),
  body('distractor2').optional().trim(),
  body('distractor3').optional().trim(),
];

router.post(
  '/flashcards',
  flashcardValidators,
  validate,
  async (req, res) => {
    try {
      const data = flashcardDataFromBody(req.body);
      const topicRecord = await findOrCreateTopic(data.subject, data.topic);

      const flashcard = await prisma.flashcard.create({
        data: {
          topicId: topicRecord.id,
          questionType: data.questionType,
          question: data.question,
          answer: data.answer,
          distractor1: data.distractor1,
          distractor2: data.distractor2,
          distractor3: data.distractor3,
          difficulty: data.difficulty,
        },
        include: {
          topic: { include: { subject: true } },
        },
      });

      res.status(201).json(flashcardToJson(flashcard));
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({ error: err.message });
      }
      console.error(err);
      res.status(500).json({ error: 'Failed to create flashcard' });
    }
  }
);

router.put(
  '/flashcards/:id',
  flashcardValidators,
  validate,
  async (req, res) => {
    try {
      const data = flashcardDataFromBody(req.body);
      const topicRecord = await findOrCreateTopic(data.subject, data.topic);

      const flashcard = await prisma.flashcard.update({
        where: { id: req.params.id },
        data: {
          topicId: topicRecord.id,
          questionType: data.questionType,
          question: data.question,
          answer: data.answer,
          distractor1: data.distractor1,
          distractor2: data.distractor2,
          distractor3: data.distractor3,
          difficulty: data.difficulty,
        },
        include: {
          topic: { include: { subject: true } },
        },
      });

      res.json(flashcardToJson(flashcard));
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Flashcard not found' });
      }
      console.error(err);
      res.status(500).json({ error: 'Failed to update flashcard' });
    }
  }
);

router.delete('/flashcards/:id', async (req, res) => {
  try {
    await prisma.flashcard.delete({ where: { id: req.params.id } });
    res.json({ message: 'Flashcard deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Flashcard not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to delete flashcard' });
  }
});

module.exports = router;
