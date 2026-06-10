const express = require('express');
const {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  uploadCSV
} = require('../controllers/question.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { upload } = require('../services/upload.service');

const router = express.Router();

// General student/admin viewing (protected)
router.get('/', protect, getQuestions);
router.get('/:id', protect, getQuestion);

// Admin-only question modifications
router.post('/', protect, authorize('admin'), createQuestion);
router.put('/:id', protect, authorize('admin'), updateQuestion);
router.delete('/:id', protect, authorize('admin'), deleteQuestion);
router.post('/upload-csv', protect, authorize('admin'), upload.any(), uploadCSV);

module.exports = router;
