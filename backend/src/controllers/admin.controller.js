const {
  getAllUsers,
  updateUserRole,
  deleteUser
} = require('./auth.controller');
const {
  getAllSubscriptions,
  updateSubscriptionStatus
} = require('./payment.controller');
const {
  getAdminStats,
  getAdminAnalytics,
  getAllResults,
  getTests
} = require('./test.controller');

module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllSubscriptions,
  updateSubscriptionStatus,
  getAdminStats,
  getAdminAnalytics,
  getAllResults,
  getTests
};
