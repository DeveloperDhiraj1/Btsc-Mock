const express = require('express');
const {
  createTest,
  getTests,
  getTestForAttempt,
  getTestFull,
  submitTest,
  getResultDetails,
  getMyResults,
  getAdminStats,
  toggleTestStatus,
  updateTest,
  deleteTest,
  assignQuestions,
  getAllResults,
  getAdminAnalytics
} = require('../controllers/test.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

// General student/admin list
router.get('/', protect, getTests);

// Student Exam attempt route (strips answers for integrity)
router.get('/:id/attempt', protect, getTestForAttempt);

// Student Submit exam evaluation
router.post('/submit', protect, submitTest);

// Student retrieve own results history
router.get('/results', protect, getMyResults);

// Student retrieve results scorecard
router.get('/results/:id', protect, getResultDetails);

// Admin Test management
router.get('/admin/stats', protect, authorize('admin'), getAdminStats);
router.get('/admin/analytics', protect, authorize('admin'), getAdminAnalytics);
router.get('/admin/results', protect, authorize('admin'), getAllResults);
router.post('/', protect, authorize('admin'), createTest);
router.get('/:id/full', protect, authorize('admin'), getTestFull);
router.put('/:id', protect, authorize('admin'), updateTest);
router.delete('/:id', protect, authorize('admin'), deleteTest);
router.put('/:id/toggle', protect, authorize('admin'), toggleTestStatus);
router.put('/:id/assign-questions', protect, authorize('admin'), assignQuestions);

module.exports = router;
