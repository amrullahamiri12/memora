const prisma = require('./prisma');

function rollupTopicsToSubject(subject, topicsForSubject, cardsByTopic, masteredByTopic) {
  let totalCards = 0;
  let mastered = 0;
  for (const topic of topicsForSubject) {
    totalCards += cardsByTopic.get(topic.id) || 0;
    mastered += masteredByTopic.get(topic.id) || 0;
  }
  return {
    id: subject.id,
    name: subject.name,
    topicCount: subject._count?.topics ?? topicsForSubject.length,
    totalCards,
    mastered,
    progressPercent: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0,
  };
}

async function loadTopicAggregates(topicIds, userId) {
  if (topicIds.length === 0) {
    return {
      cardsByTopic: new Map(),
      masteredByTopic: new Map(),
      needsPracticeByTopic: new Map(),
    };
  }

  const [cardCounts, progressRows] = await Promise.all([
    prisma.flashcard.groupBy({
      by: ['topicId'],
      where: { topicId: { in: topicIds } },
      _count: { _all: true },
    }),
    prisma.userProgress.findMany({
      where: { userId, flashcard: { topicId: { in: topicIds } } },
      select: { status: true, flashcard: { select: { topicId: true } } },
    }),
  ]);

  const cardsByTopic = new Map(cardCounts.map((c) => [c.topicId, c._count._all]));
  const masteredByTopic = new Map();
  const needsPracticeByTopic = new Map();

  for (const row of progressRows) {
    const topicId = row.flashcard.topicId;
    if (row.status === 'GOT_IT') {
      masteredByTopic.set(topicId, (masteredByTopic.get(topicId) || 0) + 1);
    } else {
      needsPracticeByTopic.set(topicId, (needsPracticeByTopic.get(topicId) || 0) + 1);
    }
  }

  return { cardsByTopic, masteredByTopic, needsPracticeByTopic };
}

function mapTopicWithStats(topic, cardsByTopic, masteredByTopic, needsPracticeByTopic) {
  const totalCards = cardsByTopic.get(topic.id) || 0;
  const mastered = masteredByTopic.get(topic.id) || 0;
  const needsPractice = needsPracticeByTopic.get(topic.id) || 0;
  return {
    id: topic.id,
    name: topic.name,
    totalCards,
    mastered,
    needsPractice,
    progressPercent: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0,
  };
}

async function getSubjectsWithProgress(userId, subjectIds) {
  const where = subjectIds?.length ? { id: { in: subjectIds } } : {};

  const subjects = await prisma.subject.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: { select: { topics: true } },
    },
  });

  if (subjects.length === 0) return [];

  const ids = subjects.map((s) => s.id);
  const topics = await prisma.topic.findMany({
    where: { subjectId: { in: ids } },
    select: { id: true, subjectId: true },
  });

  const topicIds = topics.map((t) => t.id);
  const { cardsByTopic, masteredByTopic } = await loadTopicAggregates(topicIds, userId);

  const topicsBySubject = new Map();
  for (const topic of topics) {
    if (!topicsBySubject.has(topic.subjectId)) {
      topicsBySubject.set(topic.subjectId, []);
    }
    topicsBySubject.get(topic.subjectId).push(topic);
  }

  return subjects.map((subject) =>
    rollupTopicsToSubject(
      subject,
      topicsBySubject.get(subject.id) || [],
      cardsByTopic,
      masteredByTopic
    )
  );
}

async function getTopicsWithProgress(subjectId, userId, { skip, take } = {}) {
  const [total, topicRows] = await Promise.all([
    prisma.topic.count({ where: { subjectId } }),
    prisma.topic.findMany({
      where: { subjectId },
      orderBy: { name: 'asc' },
      ...(take != null ? { skip: skip || 0, take } : {}),
      select: { id: true, name: true },
    }),
  ]);

  const topicIds = topicRows.map((t) => t.id);
  const { cardsByTopic, masteredByTopic, needsPracticeByTopic } = await loadTopicAggregates(
    topicIds,
    userId
  );

  const items = topicRows.map((topic) =>
    mapTopicWithStats(topic, cardsByTopic, masteredByTopic, needsPracticeByTopic)
  );

  return { items, total };
}

module.exports = {
  getSubjectsWithProgress,
  getTopicsWithProgress,
  mapTopicWithStats,
  loadTopicAggregates,
};
