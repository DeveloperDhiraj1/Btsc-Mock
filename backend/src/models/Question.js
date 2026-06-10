const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Please add a subject name'],
    trim: true,
    index: true
  },
  topic: {
    type: String,
    required: [true, 'Please add a topic name'],
    trim: true,
    index: true
  },
  question: {
    type: String,
    required: [true, 'Please add the question body'],
    trim: true
  },
  options: {
    type: [String],
    validate: {
      validator: function(arr) {
        return arr.length === 4;
      },
      message: 'A question must have exactly 4 options'
    },
    required: true
  },
  correctAnswer: {
    type: Number,
    required: [true, 'Please add the correct option index (0 to 3)'],
    min: 0,
    max: 3
  },
  explanation: {
    type: String,
    required: [true, 'Please add an explanation for the answer'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    index: true
  },
  tags: {
    type: [String],
    default: []
  },
  generatedByAI: {
    type: Boolean,
    default: false
  },
  editedByAdmin: {
    type: Boolean,
    default: false
  },
  examType: {
    type: String,
    required: [true, 'Please add target exam category (e.g., BTSC, SSC, Railway)'],
    trim: true,
    index: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', QuestionSchema);
