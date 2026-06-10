const Razorpay = require('razorpay');
const crypto = require('crypto');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const logger = require('../utils/logger');

let razorpayInstance;
const useMock = process.env.USE_RAZORPAY_MOCK === 'true' || 
                !process.env.RAZORPAY_KEY_ID || 
                !process.env.RAZORPAY_KEY_SECRET ||
                process.env.RAZORPAY_KEY_ID.includes('mock');

if (!useMock) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (error) {
    logger.error('Failed to initialize Razorpay Client: %O', error);
  }
} else {
  logger.warn('Running Razorpay Payments in Simulation Mode (Checkout Sandbox Fallback)');
}

const createMockOrder = (amountInPaise, currency, receipt) => ({
  id: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
  entity: 'order',
  amount: amountInPaise,
  currency,
  receipt,
  status: 'created'
});

const createRazorpayOrder = async (options) => {
  if (!razorpayInstance) {
    throw new Error('Razorpay client is not initialized. Check your payment gateway configuration.');
  }

  return await razorpayInstance.orders.create(options);
};

// 1. Create a Premium Subscription Order
// POST /api/payments/checkout
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const amount = 299; // Rs 299 for Premium pass
    const amountInPaise = amount * 100;

    const receipt = `receipt_sub_${userId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;

    let order;

    if (useMock) {
      // Mock order generation
      order = createMockOrder(amountInPaise, 'INR', receipt);
      logger.info(`[Razorpay Simulation] Created Mock Payment Order: ${order.id}`);
    } else {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt
      };

      try {
        order = await createRazorpayOrder(options);
      } catch (razorpayError) {
        logger.error('Razorpay order creation failed: %O', razorpayError);
        const message = razorpayError.error?.description || razorpayError.message || 'Payment gateway is temporarily unavailable. Please try again later.';
        return res.status(502).json({ success: false, message });
      }
    }

    // Save pending subscription in DB
    await Subscription.create({
      user: userId,
      planName: 'Premium Exam Pass',
      orderId: order.id,
      amount: amount,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: useMock ? 'rzp_test_mock_id' : process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Verify Razorpay Payment Signature
// POST /api/payments/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Missing payment signature details' });
    }

    let isValid = false;

    if (useMock) {
      // Simulation verification always succeeds
      isValid = true;
      logger.info(`[Razorpay Simulation] Auto-verifying signature for Order: ${razorpay_order_id}`);
    } else {
      const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest('hex');
      isValid = digest === razorpay_signature;
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update Subscription Record
    const subscription = await Subscription.findOne({ orderId: razorpay_order_id });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription record not found' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12); // 1 Year Premium Pass

    subscription.status = 'active';
    subscription.paymentId = razorpay_payment_id;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    await subscription.save();

    // Unlock Premium in User Object
    await User.findByIdAndUpdate(userId, {
      subscriptionPlan: {
        planType: 'premium',
        expiresAt: endDate,
        status: 'active'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      data: {
        expiresAt: endDate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: get all subscriptions
exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skipIndex = (page - 1) * limit;
    const total = await Subscription.countDocuments(filter);
    const subs = await Subscription.find(filter)
      .populate('user', 'name email profileImage role')
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    const summary = await Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: subs.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      summary,
      data: subs
    });
  } catch (error) {
    next(error);
  }
};

// Admin: update subscription status (force-activate, expire, etc.)
exports.updateSubscriptionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'active', 'expired', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const sub = await Subscription.findById(req.params.id);
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (sub.status === status) {
      return res.status(200).json({ success: true, message: 'No change required', data: sub });
    }

    const targetUser = await User.findById(sub.user);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Subscriber account no longer exists' });
    }

    sub.status = status;
    if (status === 'active') {
      const start = sub.startDate || new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + 12);
      sub.startDate = start;
      sub.endDate = end;
      targetUser.subscriptionPlan = { planType: 'premium', expiresAt: end, status: 'active' };
      await targetUser.save();
    } else if (status === 'expired') {
      targetUser.subscriptionPlan = { planType: 'free', expiresAt: null, status: 'expired' };
      await targetUser.save();
    }
    await sub.save();

    res.status(200).json({ success: true, message: 'Subscription updated', data: sub });
  } catch (error) {
    next(error);
  }
};
