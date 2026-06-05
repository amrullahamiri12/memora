const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { submitContact } = require('../lib/contact');

const router = express.Router();

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be 10–2000 characters'),
    body('company').optional({ values: 'falsy' }).isEmpty().withMessage('Invalid submission'),
  ],
  validate,
  async (req, res) => {
    try {
      const result = await submitContact(req.body);
      res.status(result.status).json(result.body);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

module.exports = router;
