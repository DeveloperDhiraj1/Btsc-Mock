const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    required: true // in seconds
  },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
      },
      selectedOption: {
        type: Number, // index 0-3, or null/-1 if skipped
        default: null
      },
      isCorrect: {
        type: Boolean,
        default: false
      },
      timeSpent: {
        type: Number, // seconds spent on this question
        default: 0
      }
    }
  ],
  weakTopics: {
    type: [String],
    default: []
  },
  AIAnalysis: {
    strengths: {
      type: [String],
      default: []
    },
    weaknesses: {
      type: [String],
      default: []
    },
    timeManagement: {
      type: String,
      default: ''
    },
    studyPlanSuggestion: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Result', ResultSchema);
