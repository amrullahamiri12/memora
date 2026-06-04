const express = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { gradeFlashcardAnswer, formatCorrectAnswer } = require('../lib/questionTypes');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { assertFlashcardAccess } = require('../lib/userSubjects');

const router = express.Router();

router.use(authMiddleware);

function getTodayDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

router.post(
  '/',
  [
    body('flashcardId').notEmpty().withMessage('Flashcard ID is required'),
    body('status')
      .optional()
      .isIn(['GOT_IT', 'NEEDS_PRACTICE'])
      .withMessage('Status must be GOT_IT or NEEDS_PRACTICE'),
    body('selectedAnswer').optional().isString().trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { flashcardId, selectedAnswer } = req.body;
      let { status } = req.body;
      const userId = req.user.id;

      if (!status && !selectedAnswer) {
        return res.status(400).json({ error: 'Provide selectedAnswer or status' });
      }

      const access = await assertFlashcardAccess(req.user, flashcardId);
      if (!access.allowed) {
        return res.status(access.status).json({ error: access.error });
      }

      const flashcard = access.flashcard;

      let correct = null;
      if (selectedAnswer !== undefined) {
        correct = gradeFlashcardAnswer(flashcard, selectedAnswer);
        status = correct ? 'GOT_IT' : 'NEEDS_PRACTICE';
      }

      const progress = await prisma.userProgress.upsert({
        where: {
          userId_flashcardId: { userId, flashcardId },
        },
        update: { status, lastReviewed: new Date() },
        create: { userId, flashcardId, status },
      });

      const today = getTodayDate();
      await prisma.userDailyPractice.upsert({
        where: {
          userId_date: { userId, date: today },
        },
        update: {},
        create: { userId, date: today },
      });

      res.json({
        ...progress,
        correct,
        correctAnswer: formatCorrectAnswer(flashcard),
        status,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save progress' });
    }
  }
);

module.exports = router;
