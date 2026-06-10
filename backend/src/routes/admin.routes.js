const express = require('express');
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllSubscriptions,
  updateSubscriptionStatus,
  getAdminStats,
  getAdminAnalytics,
  getAllResults,
  getTests
} = require('../controllers/admin.controller');
const { getAISettings, updateAISettings } = require('../controllers/appSettings.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

// All admin routes are protected and require admin role
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/subscriptions', getAllSubscriptions);
router.put('/subscriptions/:id', updateSubscriptionStatus);

router.get('/stats', getAdminStats);
router.get('/analytics', getAdminAnalytics);
router.get('/results', getAllResults);
router.get('/tests', getTests);

router.get('/ai-settings', getAISettings);
router.put('/ai-settings', updateAISettings);

module.exports = router;
