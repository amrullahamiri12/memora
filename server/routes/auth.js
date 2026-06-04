const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { withTimeout } = require('../lib/withTimeout');
const authMiddleware = require('../middleware/auth');

const DB_TIMEOUT_MS = 8000;
const validate = require('../middleware/validate');
const { enrollUserInSubjects } = require('../lib/userSubjects');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('subjectIds')
      .isArray({ min: 1 })
      .withMessage('Select at least one subject to practice'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, subjectIds } = req.body;

      const existing = await withTimeout(
        prisma.user.findUnique({ where: { email } }),
        DB_TIMEOUT_MS,
        'Database connection timed out. Check DATABASE_URL on Vercel (Supabase pooler, port 6543).'
      );
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const ids = (subjectIds || []).filter((id) => typeof id === 'string' && id.trim());
      const subjectCount = await withTimeout(
        prisma.subject.count({ where: { id: { in: ids } } }),
        DB_TIMEOUT_MS
      );
      if (subjectCount === 0) {
        return res.status(400).json({ error: 'Select at least one valid subject' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, passwordHash, role: 'USER' },
        select: { id: true, name: true, email: true, role: true },
      });

      await enrollUserInSubjects(user.id, ids);

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      res.status(201).json({ token, user });
    } catch (err) {
      console.error('Register error:', err);
      if (err.message?.includes('timed out')) {
        return res.status(503).json({ error: err.message });
      }
      if (err.code === 'P1001' || err.code === 'P1000' || err.code === 'P1017') {
        return res.status(500).json({
          error:
            'Cannot reach the database. On Vercel, set DATABASE_URL to the Supabase pooler URL (port 6543, ?pgbouncer=true).',
        });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await withTimeout(
        prisma.user.findUnique({ where: { email } }),
        DB_TIMEOUT_MS,
        'Database connection timed out. Check DATABASE_URL on Vercel (Supabase pooler, port 6543).'
      );
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      if (err.message?.includes('timed out')) {
        return res.status(503).json({ error: err.message });
      }
      if (err.code === 'P1001' || err.code === 'P1000' || err.code === 'P1017') {
        return res.status(500).json({
          error:
            'Cannot reach the database. On Vercel, set DATABASE_URL to the Supabase pooler URL (port 6543, ?pgbouncer=true).',
        });
      }
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.post(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords do not match'),
  ],
  validate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
      if (samePassword) {
        return res.status(400).json({ error: 'New password must be different from current password' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

module.exports = router;
