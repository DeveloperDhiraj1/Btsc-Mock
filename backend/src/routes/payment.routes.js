const express = require('express');
const {
  createOrder,
  verifyPayment,
  getAllSubscriptions,
  updateSubscriptionStatus
} = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.post('/checkout', protect, createOrder);
router.post('/verify', protect, verifyPayment);

router.get('/admin/subscriptions', protect, authorize('admin'), getAllSubscriptions);
router.put('/admin/subscriptions/:id', protect, authorize('admin'), updateSubscriptionStatus);

module.exports = router;
