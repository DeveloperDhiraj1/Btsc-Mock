const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],
    index: true
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider !== 'google';
    },
    minlength: 8,
    select: false
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  firebaseUid: {
    type: String,
    sparse: true,
    index: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  profileImage: {
    type: String,
    default: 'https://res.cloudinary.com/mock-cloud/image/upload/v1/default-avatar.png'
  },
  testsAttempted: {
    type: Number,
    default: 0
  },
  scores: [
    {
      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
      },
      score: Number,
      maxScore: Number,
      accuracy: Number,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  accuracy: {
    type: Number,
    default: 0
  },
  weakTopics: [
    {
      topic: String,
      subject: String,
      errorCount: {
        type: Number,
        default: 0
      }
    }
  ],
  subscriptionPlan: {
    planType: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    expiresAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: String,
  otpExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }
  ]
}, {
  timestamps: true
});

// Encrypt password using bcryptjs
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  if (!this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
