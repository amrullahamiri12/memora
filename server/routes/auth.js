const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const validate = require('../middleware/validate');
const fastAuth = require('../lib/fastAuth');
const { isGuestEmail } = require('../lib/guestIdentity');
const { publicUser } = require('../lib/authUser');
const { buildRequestContext } = require('../lib/audit');

const router = express.Router();

function send(res, result) {
  res.status(result.status).json(result.body);
}

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
      send(res, await fastAuth.register(req.body, buildRequestContext(req)));
    } catch (err) {
      console.error('Register error:', err);
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
      send(res, await fastAuth.login(req.body.email, req.body.password, buildRequestContext(req)));
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.post('/guest', async (req, res) => {
  try {
    send(res, await fastAuth.createGuest());
  } catch (err) {
    console.error('Guest auth error:', err);
    res.status(500).json({ error: 'Could not start guest session' });
  }
});

router.post(
  '/upgrade-guest',
  authMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      send(res, await fastAuth.upgradeGuest(req.user.id, req.body));
    } catch (err) {
      console.error('Upgrade guest error:', err);
      res.status(500).json({ error: 'Failed to create account' });
    }
  }
);

router.post('/verify-email', optionalAuth, async (req, res) => {
  try {
    send(res, await fastAuth.verifyEmail(req.body.token, {
      userId: req.user?.id,
      auditCtx: buildRequestContext(req),
    }));
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    send(res, await fastAuth.resendVerification(req.user.id, buildRequestContext(req)));
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Could not send verification email' });
  }
});

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  async (req, res) => {
    try {
      send(res, await fastAuth.forgotPassword(req.body.email, buildRequestContext(req)));
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Request failed' });
    }
  }
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      send(res, await fastAuth.resetPassword(
        req.body.token,
        req.body.password,
        buildRequestContext(req)
      ));
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Reset failed' });
    }
  }
);

router.post('/google', async (req, res) => {
  try {
    send(res, await fastAuth.loginWithGoogle(req.body, buildRequestContext(req)));
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google sign-in failed' });
  }
});

router.get('/config', async (_req, res) => {
  send(res, fastAuth.authConfig());
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    send(res, await fastAuth.me(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load user' });
  }
});

router.post('/close-account', authMiddleware, async (req, res) => {
  try {
    send(res, await fastAuth.closeUserAccount(req.user.id, req.body.password, buildRequestContext(req)));
  } catch (err) {
    console.error('Close account error:', err);
    res.status(500).json({ error: 'Failed to close account' });
  }
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

      if (isGuestEmail(user.email)) {
        return res.status(400).json({
          error: 'Guest accounts cannot change password. Create your account from Account settings.',
        });
      }

      if (!user.passwordHash) {
        return res.status(400).json({
          error: 'This account uses Google sign-in. Set a password from forgot-password if needed.',
        });
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
