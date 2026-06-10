const express = require('express');
const {
  generateQuestions,
  generateMockTest,
  generateRevisionNotes,
  generateExplanation
} = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

// Student & Admin accessible AI routes
router.post('/generate-notes', protect, generateRevisionNotes);
router.post('/generate-explanation', protect, generateExplanation);

// Admin-only AI creation tasks
router.post('/generate-questions', protect, authorize('admin'), generateQuestions);
router.post('/generate-mock', protect, authorize('admin'), generateMockTest);

module.exports = router;
