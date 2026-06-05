const express = require('express');
const prisma = require('../lib/prisma');
const { preparePracticeCards } = require('../lib/questionTypes');
const {
  parseQuestionTypes,
  filterByQuestionTypes,
  orderCardsForStudy,
} = require('../lib/studySession');
const authMiddleware = require('../middleware/auth');
const { assertSubjectAccess } = require('../lib/userSubjects');
const { getMaxStudyCards } = require('../lib/config');

const router = express.Router();

router.use(authMiddleware);

router.get('/:id/flashcards', async (req, res) => {
  try {
    const userId = req.user.id;
    const mode = String(req.query.mode || 'learn').toLowerCase();
    const shuffle = req.query.shuffle !== 'false';
    const weakOnly = req.query.weakOnly === 'true';
    const questionTypes = parseQuestionTypes(req.query.types);

    const topic = await prisma.topic.findUnique({
      where: { id: req.params.id },
      include: {
        subject: { select: { id: true, name: true } },
        flashcards: {
          select: {
            id: true,
            question: true,
            answer: true,
            questionType: true,
            distractor1: true,
            distractor2: true,
            distractor3: true,
            difficulty: true,
          },
        },
      },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const allowed = await assertSubjectAccess(req.user, topic.subject.id, {
      learnerView: req.learnerView,
    });
    if (!allowed) {
      return res.status(403).json({ error: 'You are not enrolled in this subject' });
    }

    const progressRows = await prisma.userProgress.findMany({
      where: {
        userId,
        flashcardId: { in: topic.flashcards.map((c) => c.id) },
      },
    });
    const progressByCardId = new Map(progressRows.map((p) => [p.flashcardId, p]));

    let cards = filterByQuestionTypes(topic.flashcards, questionTypes);

    if (weakOnly) {
      cards = cards.filter((c) => {
        const p = progressByCardId.get(c.id);
        return !p || p.status === 'NEEDS_PRACTICE';
      });
    }

    cards = orderCardsForStudy(cards, progressByCardId, {
      weakFirst: mode !== 'test',
      shuffle,
    });

    let flashcards;
    if (mode === 'flashcards') {
      flashcards = cards.map((c) => ({
        id: c.id,
        question: c.question,
        answer: c.answer,
        difficulty: c.difficulty,
        questionType: c.questionType,
      }));
    } else {
      flashcards = preparePracticeCards(cards);
    }

    const maxCards = getMaxStudyCards();
    const truncated = flashcards.length > maxCards;
    if (truncated) {
      flashcards = flashcards.slice(0, maxCards);
    }

    res.json({
      id: topic.id,
      name: topic.name,
      subject: topic.subject,
      mode,
      totalAvailable: topic.flashcards.length,
      flashcards,
      ...(truncated ? { truncated: true, maxCards } : {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

module.exports = router;
