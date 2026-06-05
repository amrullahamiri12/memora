const express = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { isStaff } = require('../lib/roles');
const { shouldRestrictToEnrolledSubjects } = require('../lib/learnerView');
const {
  enrollUserInSubjects,
  getEnrolledSubjectIds,
  getEnrollmentStatus,
  assertSubjectAccess,
  ensureUserEnrollments,
  MAX_ACTIVE_SUBJECTS,
} = require('../lib/userSubjects');
const { getSubjectsWithProgress, getTopicsWithProgress } = require('../lib/subjectProgress');
const { parsePagination, paginatedResponse } = require('../lib/pagination');

const router = express.Router();

/** Public catalog for registration */
router.get('/catalog', async (_req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true, _count: { select: { topics: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(
      subjects.map((s) => ({
        id: s.id,
        name: s.name,
        topicCount: s._count.topics,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.use(authMiddleware);

router.get('/enrollment-status', async (req, res) => {
  try {
    if (!shouldRestrictToEnrolledSubjects(req.user, req.learnerView)) {
      return res.json({ activeCount: 0, hasUnmastered: false, limit: MAX_ACTIVE_SUBJECTS, canAddMore: true });
    }
    const status = await getEnrollmentStatus(req.user.id);
    res.json({
      activeCount: status.activeCount,
      hasUnmastered: status.hasUnmastered,
      limit: MAX_ACTIVE_SUBJECTS,
      canAddMore: !status.hasUnmastered || status.activeCount < MAX_ACTIVE_SUBJECTS,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get enrollment status' });
  }
});

router.get('/available', async (req, res) => {
  try {
    if (!shouldRestrictToEnrolledSubjects(req.user, req.learnerView)) {
      return res.json([]);
    }

    const enrolledIds = await getEnrolledSubjectIds(req.user.id);
    const subjects = await prisma.subject.findMany({
      where: enrolledIds.length > 0 ? { id: { notIn: enrolledIds } } : undefined,
      select: {
        id: true,
        name: true,
        _count: { select: { topics: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (subjects.length === 0) {
      return res.json([]);
    }

    const subjectIds = subjects.map((s) => s.id);
    const cardCounts = await prisma.flashcard.groupBy({
      by: ['topicId'],
      where: { topic: { subjectId: { in: subjectIds } } },
      _count: { _all: true },
    });

    const topics = await prisma.topic.findMany({
      where: { subjectId: { in: subjectIds } },
      select: { id: true, subjectId: true },
    });
    const topicToSubject = new Map(topics.map((t) => [t.id, t.subjectId]));
    const totalCardsBySubject = new Map();
    for (const row of cardCounts) {
      const subjectId = topicToSubject.get(row.topicId);
      if (!subjectId) continue;
      totalCardsBySubject.set(
        subjectId,
        (totalCardsBySubject.get(subjectId) || 0) + row._count._all
      );
    }

    res.json(
      subjects.map((s) => ({
        id: s.id,
        name: s.name,
        topicCount: s._count.topics,
        totalCards: totalCardsBySubject.get(s.id) || 0,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch available subjects' });
  }
});

router.post(
  '/enroll',
  [body('subjectIds').isArray({ min: 1 }).withMessage('Select at least one subject')],
  validate,
  async (req, res) => {
    try {
      if (isStaff(req.user.role) && !req.learnerView) {
        return res.status(400).json({ error: 'Staff accounts have access to all subjects' });
      }

      const ids = req.body.subjectIds.filter((id) => typeof id === 'string' && id.trim());
      let enrolled;
      try {
        enrolled = await enrollUserInSubjects(req.user.id, ids);
      } catch (err) {
        if (err.code === 'SUBJECT_LIMIT_REACHED') {
          return res.status(err.status || 422).json({ error: err.message, code: err.code });
        }
        throw err;
      }
      if (enrolled.length === 0) {
        return res.status(400).json({ error: 'No valid subjects selected' });
      }

      const subjectIds = await getEnrolledSubjectIds(req.user.id);
      const subjects = await getSubjectsWithProgress(req.user.id, subjectIds);
      const enrollmentStatus = await getEnrollmentStatus(req.user.id);
      res.json({
        message: `Added ${enrolled.length} subject(s)`,
        subjects,
        enrollmentStatus: {
          activeCount: enrollmentStatus.activeCount,
          hasUnmastered: enrollmentStatus.hasUnmastered,
          limit: MAX_ACTIVE_SUBJECTS,
          canAddMore: !enrollmentStatus.hasUnmastered || enrollmentStatus.activeCount < MAX_ACTIVE_SUBJECTS,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to enroll in subjects' });
    }
  }
);

router.get('/', async (req, res) => {
  try {
    let subjectIds = null;
    if (shouldRestrictToEnrolledSubjects(req.user, req.learnerView)) {
      await ensureUserEnrollments(req.user.id);
      subjectIds = await getEnrolledSubjectIds(req.user.id);
      if (subjectIds.length === 0) {
        return res.json([]);
      }
    }

    const subjects = await getSubjectsWithProgress(req.user.id, subjectIds);
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.get('/:id/topics', async (req, res) => {
  try {
    const allowed = await assertSubjectAccess(req.user, req.params.id, {
      learnerView: req.learnerView,
    });
    if (!allowed) {
      return res.status(403).json({ error: 'You are not enrolled in this subject' });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true },
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const usePagination = req.query.page != null || req.query.limit != null;

    if (!usePagination) {
      const { items } = await getTopicsWithProgress(subject.id, req.user.id);
      return res.json({
        id: subject.id,
        name: subject.name,
        topics: items,
      });
    }

    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 12 });
    const { items, total } = await getTopicsWithProgress(subject.id, req.user.id, {
      skip,
      take: limit,
    });

    res.json({
      id: subject.id,
      name: subject.name,
      topics: items,
      topicsPagination: paginatedResponse(items, total, { page, limit }).pagination,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

module.exports = router;
