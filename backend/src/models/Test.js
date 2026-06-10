const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a test title'],
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Please add duration in minutes'],
    min: [1, 'Duration must be at least 1 minute']
  },
  negativeMarking: {
    type: Number,
    default: 0.25 // marks deducted per incorrect answer
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }
  ],
  totalMarks: {
    type: Number,
    required: true,
    default: 100
  },
  generatedByAI: {
    type: Boolean,
    default: false
  },
  examCategory: {
    type: String,
    required: [true, 'Please specify an exam category (e.g. BTSC, SSC, Railway)'],
    trim: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Test', TestSchema);
