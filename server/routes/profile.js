const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const { parsePagination, paginatedResponse } = require('../lib/pagination');

const router = express.Router();

router.use(authMiddleware);

function calculateStreak(practiceDates) {
  if (practiceDates.length === 0) return 0;

  const dateSet = new Set(
    practiceDates.map((d) => d.toISOString().slice(0, 10))
  );

  const today = new Date();
  let streak = 0;
  const cursor = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );

  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const [progress, dailyPractice, user] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId },
        include: {
          flashcard: {
            include: {
              topic: {
                include: { subject: true },
              },
            },
          },
        },
      }),
      prisma.userDailyPractice.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    const mastered = progress.filter((p) => p.status === 'GOT_IT').length;
    const needsPractice = progress.filter((p) => p.status === 'NEEDS_PRACTICE').length;
    const totalReviewed = progress.length;

    const topicMap = new Map();
    for (const p of progress) {
      const topic = p.flashcard.topic;
      const key = topic.id;
      if (!topicMap.has(key)) {
        topicMap.set(key, {
          id: topic.id,
          name: topic.name,
          subjectId: topic.subjectId,
          subjectName: topic.subject.name,
          mastered: 0,
          needsPractice: 0,
          totalReviewed: 0,
        });
      }
      const entry = topicMap.get(key);
      entry.totalReviewed++;
      if (p.status === 'GOT_IT') entry.mastered++;
      else entry.needsPractice++;
    }

    const topicIds = Array.from(topicMap.keys());
    if (topicIds.length > 0) {
      const cardCounts = await prisma.flashcard.groupBy({
        by: ['topicId'],
        where: { topicId: { in: topicIds } },
        _count: { _all: true },
      });
      const countByTopic = new Map(cardCounts.map((c) => [c.topicId, c._count._all]));
      for (const entry of topicMap.values()) {
        entry.totalCards = countByTopic.get(entry.id) ?? 0;
      }
    }

    const streak = calculateStreak(dailyPractice.map((d) => d.date));

    const dateSet = new Set(
      dailyPractice.map((d) => new Date(d.date).toISOString().slice(0, 10))
    );
    const today = new Date();
    const streakDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      streakDays.push({ date: key, practiced: dateSet.has(key) });
    }

    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10 });
    const allTopics = Array.from(topicMap.values()).sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName) || a.name.localeCompare(b.name)
    );
    const topicPage = paginatedResponse(
      allTopics.slice(skip, skip + limit),
      allTopics.length,
      { page, limit }
    );

    res.json({
      user,
      stats: {
        totalReviewed,
        mastered,
        needsPractice,
        streak,
        topicsStudied: topicMap.size,
      },
      streakDays,
      topics: topicPage.items,
      topicsPagination: topicPage.pagination,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
