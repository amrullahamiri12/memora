const prisma = require('./prisma');

async function findOrCreateTopic(subjectName, topicName) {
  let subject = await prisma.subject.findUnique({ where: { name: subjectName } });
  if (!subject) {
    subject = await prisma.subject.create({ data: { name: subjectName } });
  }

  let topic = await prisma.topic.findUnique({
    where: { subjectId_name: { subjectId: subject.id, name: topicName } },
  });
  if (!topic) {
    topic = await prisma.topic.create({
      data: { subjectId: subject.id, name: topicName },
    });
  }

  return topic;
}

function normalizeDifficulty(value) {
  const map = {
    easy: 'EASY',
    e: 'EASY',
    medium: 'MEDIUM',
    med: 'MEDIUM',
    m: 'MEDIUM',
    hard: 'HARD',
    h: 'HARD',
  };
  const key = String(value || '').trim().toLowerCase();
  return map[key] || String(value || '').trim().toUpperCase();
}

module.exports = {
  findOrCreateTopic,
  normalizeDifficulty,
};
