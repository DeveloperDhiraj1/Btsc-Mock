// const express = require('express');
// const {
//   getAllUsers,
//   updateUserRole,
//   deleteUser,
//   getAllSubscriptions,
//   updateSubscriptionStatus,
//   getAdminStats,
//   getAdminAnalytics,
//   getAllResults,
//   getTests
// } = require('../controllers/admin.controller');
// const { getAISettings, updateAISettings } = require('../controllers/appSettings.controller');
// const { protect } = require('../middlewares/auth.middleware');
// const { authorize } = require('../middlewares/role.middleware');

// const router = express.Router();

// // All admin routes are protected and require admin role
// router.use(protect, authorize('admin'));

// router.get('/users', getAllUsers);
// router.put('/users/:id/role', updateUserRole);
// router.delete('/users/:id', deleteUser);

// router.get('/subscriptions', getAllSubscriptions);
// router.put('/subscriptions/:id', updateSubscriptionStatus);

// router.get('/stats', getAdminStats);
// router.get('/analytics', getAdminAnalytics);
// router.get('/results', getAllResults);
// router.get('/tests', getTests);

// router.get('/ai-settings', getAISettings);
// router.put('/ai-settings', updateAISettings);

// module.exports = router;

const express = require('express');

const adminController = require('../controllers/admin.controller');
const settingsController = require('../controllers/appSettings.controller');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

// All admin routes protected
router.use(protect, authorize('admin'));

// ================= USERS =================
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// ================= SUBSCRIPTIONS =================
router.get('/subscriptions', adminController.getAllSubscriptions);
router.put('/subscriptions/:id', adminController.updateSubscriptionStatus);

// ================= STATS / ANALYTICS =================
router.get('/stats', adminController.getAdminStats);
router.get('/analytics', adminController.getAdminAnalytics);

// ================= RESULTS / TESTS =================
router.get('/results', adminController.getAllResults);
router.get('/tests', adminController.getTests);

// ================= AI SETTINGS =================
router.get('/ai-settings', settingsController.getAISettings);
router.put('/ai-settings', settingsController.updateAISettings);

module.exports = router;