const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');
const { getQueue } = require('../jobs/queue');
const { analyzeResult } = require('../services/ai.service');
const { getResultTemplate } = require('../services/email.service');
const logger = require('../utils/logger');

// Create Test Template
exports.createTest = async (req, res, next) => {
  try {
    const { title, duration, negativeMarking, examCategory, questions, totalMarks } = req.body;
    
    const test = await Test.create({
      title,
      duration,
      negativeMarking,
      examCategory,
      questions,
      totalMarks
    });

    res.status(201).json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

// Get All Tests
exports.getTests = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    // Admins can see all tests, students see only active ones
    const filter = req.user && req.user.role === 'admin' ? {} : { isActive: true };
    if (category) {
      const escaped = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.examCategory = new RegExp(`^${escaped}`, 'i');
    }
    if (search) filter.title = new RegExp(search, 'i');

    const tests = await Test.find(filter)
      .populate({ path: 'questions', select: '-correctAnswer -explanation' }) // default strip solutions
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tests.length, data: tests });
  } catch (error) {
    next(error);
  }
};

// Fetch single test WITH questions stripped (for student active exam session)
exports.getTestForAttempt = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate({ path: 'questions', select: '-correctAnswer -explanation' });
      
    if (!test || !test.isActive) {
      return res.status(404).json({ success: false, message: 'Test not found or deactivated' });
    }

    res.status(200).json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

// Admin retrieve test with full questions (including answers)
exports.getTestFull = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id).populate('questions');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.status(200).json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

// Submit Test & Calculate Score with AI Analysis
exports.submitTest = async (req, res, next) => {
  try {
    const { testId, answers, timeSpent } = req.body; // answers: [{ questionId, selectedOption, timeSpent }]
    const userId = req.user.id;

    // Load full test template
    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    const gradedAnswers = [];
    const weakTopicsSet = new Set();

    // Grade each question
    const questionsMap = new Map(test.questions.map(q => [q._id.toString(), q]));
    const marksPerQuestion = test.totalMarks / (test.questions.length || 1);

    for (const ans of answers) {
      const dbQ = questionsMap.get(ans.questionId.toString());
      if (!dbQ) continue;

      const isSkipped = ans.selectedOption === null || ans.selectedOption === undefined || ans.selectedOption === -1;
      
      let isCorrect = false;
      if (!isSkipped) {
        isCorrect = parseInt(ans.selectedOption) === dbQ.correctAnswer;
        if (isCorrect) {
          correctCount++;
        } else {
          incorrectCount++;
          weakTopicsSet.add(dbQ.topic);
        }
      } else {
        skippedCount++;
      }

      gradedAnswers.push({
        questionId: dbQ._id,
        selectedOption: isSkipped ? null : ans.selectedOption,
        isCorrect,
        timeSpent: ans.timeSpent || 0
      });
    }

    // Score: (correct * weight) - (incorrect * negativeMarking * weight)
    const grossScore = correctCount * marksPerQuestion;
    const penalty = incorrectCount * (test.negativeMarking || 0) * marksPerQuestion;
    const finalScore = Math.max(0, parseFloat((grossScore - penalty).toFixed(2)));
    
    // Accuracy
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    const weakTopics = Array.from(weakTopicsSet);

    // Call Gemini AI Result Analysis Service
    let aiAnalysisResult = {};
    try {
      aiAnalysisResult = await analyzeResult(
        finalScore,
        accuracy,
        timeSpent,
        weakTopics,
        gradedAnswers
      );
    } catch (aiErr) {
      logger.error('Failed to parse AI Analysis: %O', aiErr);
      aiAnalysisResult = {
        strengths: ['Exam Attempt Completed'],
        weaknesses: weakTopics,
        timeManagement: 'Pacing analytics calculation failed due to network.',
        studyPlanSuggestion: 'Revise topics where questions were answered incorrectly.'
      };
    }

    // Save Attempt Results
    const resultDoc = await Result.create({
      user: userId,
      test: testId,
      score: finalScore,
      accuracy,
      timeSpent,
      answers: gradedAnswers,
      weakTopics,
      AIAnalysis: aiAnalysisResult
    });

    // Update User Record via background analytics queue (or fallback directly)
    await User.findByIdAndUpdate(userId, {
      $inc: { testsAttempted: 1 },
      $push: {
        scores: {
          testId: test._id,
          score: finalScore,
          maxScore: test.totalMarks,
          accuracy
        }
      }
    });

    // Add job to re-calculate long-term stats (accuracy trend, weak subjects)
    const analyticsQueue = getQueue('result-analytics-queue');
    await analyticsQueue.add('recalculateStats', {
      userId,
      score: finalScore,
      accuracy,
      weakTopics
    });

    // Add job to email report
    const emailQueue = getQueue('email-queue');
    const emailBody = getResultTemplate(req.user.name, test.title, finalScore, test.totalMarks, accuracy);
    await emailQueue.add('sendResultSummary', {
      to: req.user.email,
      subject: `Exam Report: ${test.title}`,
      html: emailBody
    });

    res.status(201).json({
      success: true,
      message: 'Test submitted and graded successfully',
      data: resultDoc
    });
  } catch (error) {
    next(error);
  }
};

// Get all results for logged-in student
exports.getMyResults = async (req, res, next) => {
  try {
    const results = await Result.find({ user: req.user.id })
      .populate('test', 'title examCategory totalMarks duration')
      .sort({ createdAt: -1 })
      .select('-answers -AIAnalysis');
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// Get Single Result Details
exports.getResultDetails = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('test')
      .populate({
        path: 'answers.questionId',
        model: 'Question'
      });
      
    if (!result) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }
    
    // Safety check: ensure student only views their own results
    if (req.user.role !== 'admin' && result.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this scorecard' });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Get Admin Platform Stats (Admin Only)
exports.getAdminStats = async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    const questionCount = await Question.countDocuments();
    const testCount = await Test.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        students: userCount,
        questions: questionCount,
        tests: testCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Toggle Test Status (Active / Inactive) - Admin Only
exports.toggleTestStatus = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test template not found' });
    }

    test.isActive = !test.isActive;
    await test.save();

    res.status(200).json({
      success: true,
      message: `Test status successfully toggled to ${test.isActive ? 'Active' : 'Inactive'}`,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// Update Test Template (Admin Only)
exports.updateTest = async (req, res, next) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test template not found' });
    }
    res.status(200).json({ success: true, message: 'Test updated successfully', data: test });
  } catch (error) {
    next(error);
  }
};

// Delete Test Template (Admin Only)
exports.deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test template not found' });
    }
    res.status(200).json({ success: true, message: 'Test template deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Assign Questions to a Test (Admin Only)
exports.assignQuestions = async (req, res, next) => {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ success: false, message: 'questionIds must be an array' });
    }
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { questions: questionIds },
      { new: true, runValidators: true }
    ).populate('questions');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Questions assigned to test successfully',
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// Get All Results (Admin Only) — paginated, filterable
exports.getAllResults = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, testId, userId } = req.query;
    const filter = {};
    if (testId) filter.test = testId;
    if (userId) filter.user = userId;

    const skipIndex = (page - 1) * limit;
    const total = await Result.countDocuments(filter);
    const results = await Result.find(filter)
      .populate('user', 'name email role profileImage')
      .populate('test', 'title examCategory totalMarks duration')
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: results.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Get Admin Platform Analytics (Admin Only) — charts data
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Registrations over last 30 days
    const userTrend = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Submissions over last 30 days
    const submissionsTrend = await Result.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgAccuracy: { $avg: '$accuracy' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Score buckets (0-25, 26-50, 51-75, 76-100)
    const scoreDistRaw = await Result.aggregate([
      {
        $bucket: {
          groupBy: '$accuracy',
          boundaries: [0, 26, 51, 76, 101],
          default: 'other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);
    const bucketMap = { 0: '0-25%', 26: '26-50%', 51: '51-75%', 76: '76-100%' };
    const counts = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0 };
    for (const row of scoreDistRaw) {
      const label = bucketMap[row._id];
      if (label) counts[label] = row.count;
    }
    const scoreDistribution = Object.keys(counts).map(bucket => ({
      bucket,
      count: counts[bucket]
    }));

    // Exam Category breakdown
    const categoryBreakdown = await Test.aggregate([
      {
        $group: {
          _id: '$examCategory',
          tests: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    // Top 10 performers (by average accuracy)
    const topPerformers = await User.find({ testsAttempted: { $gt: 0 } })
      .sort({ accuracy: -1, testsAttempted: -1 })
      .limit(10)
      .select('name email accuracy testsAttempted profileImage');

    // Revenue from active subscriptions
    const Subscription = require('../models/Subscription');
    const revenueAgg = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const revenue = revenueAgg[0] || { total: 0, count: 0 };

    res.status(200).json({
      success: true,
      data: {
        userTrend,
        submissionsTrend,
        scoreDistribution,
        categoryBreakdown,
        topPerformers,
        revenue: { total: revenue.total, activeSubs: revenue.count }
      }
    });
  } catch (error) {
    next(error);
  }
};
