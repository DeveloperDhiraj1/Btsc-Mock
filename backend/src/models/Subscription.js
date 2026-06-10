const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planName: {
    type: String,
    required: true,
    default: 'Premium Mock Pass'
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true // Store amount in INR (in paise or standard Rupees, we will standardise as standard rupees)
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'failed'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
