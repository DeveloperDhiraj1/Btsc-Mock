const Question = require('../models/Question');
const Test = require('../models/Test');
const fs = require('fs');
const csvParser = require('csv-parser');
const logger = require('../utils/logger');

const normalizeCsvRow = (row) => {
  const normalized = {};
  for (const key of Object.keys(row)) {
    const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    normalized[normalizedKey] = String(row[key] || '').trim();
  }
  return normalized;
};

const parseCorrectAnswerIndex = (value, options = []) => {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const letters = { a: 0, b: 1, c: 2, d: 3 };
  if (letters.hasOwnProperty(raw.toLowerCase())) return letters[raw.toLowerCase()];

  const parsed = parseInt(raw, 10);
  if (!Number.isNaN(parsed)) {
    if (parsed >= 0 && parsed <= 3) return parsed;
    if (parsed >= 1 && parsed <= 4) return parsed - 1;
  }

  const lowerRaw = raw.toLowerCase();
  const optionIndex = options.findIndex((opt) => String(opt || '').trim().toLowerCase() === lowerRaw);
  if (optionIndex !== -1) return optionIndex;

  return null;
};

const normalizeDifficulty = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'medium';

  if (['easy', 'medium', 'hard'].includes(raw)) return raw;
  if (raw.startsWith('e')) return 'easy';
  if (raw.startsWith('m')) return 'medium';
  if (raw.startsWith('h')) return 'hard';

  return 'medium';
};

const createTestForCsvImport = async (questionIds, examType = 'BTSC') => {
  const title = `${examType.toUpperCase()} Mock Test - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const duration = Math.max(30, Math.min(questionIds.length * 2, 120));

  const testData = {
    title,
    description: `${examType.toUpperCase()} mock test created from CSV import with ${questionIds.length} questions.`,
    duration,
    examCategory: examType.toUpperCase(),
    negativeMarking: 0.25,
    questions: questionIds,
    totalMarks: questionIds.length,
    totalQuestions: questionIds.length,
    published: true
  };

  return Test.create(testData);
};

const importQuestionsAndCreateTest = async (validQuestions) => {
  const savedQuestionIds = [];
  let skipped = 0;

  for (const questionData of validQuestions) {
    try {
      const question = await Question.create(questionData);
      savedQuestionIds.push(question._id);
    } catch (error) {
      logger.error('[CSV Import] Question save failed', {
        question: questionData.question,
        error: error.message
      });
      skipped += 1;
    }
  }

  if (savedQuestionIds.length === 0) {
    throw new Error('No questions could be saved from CSV import.');
  }

  const examType = validQuestions[0].examType || 'BTSC';
  const createdTest = await createTestForCsvImport(savedQuestionIds, examType);

  return {
    questionCount: savedQuestionIds.length,
    skipped,
    test: createdTest
  };
};

// Create Question
exports.createQuestion = async (req, res, next) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// Get All Questions (with filters and pagination)
exports.getQuestions = async (req, res, next) => {
  try {
    const { subject, topic, examType, difficulty, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (examType) query.examType = examType;
    if (difficulty) query.difficulty = difficulty;

    const skipIndex = (page - 1) * limit;
    
    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: questions.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Question
exports.getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// Update Question
exports.updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// Delete Question
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Upload CSV Questions File
exports.uploadCSV = async (req, res, next) => {
  try {
    logger.info('[CSV Upload] Incoming upload request', {
      user: req.user?._id,
      file: req.file ? req.file.originalname : null,
      files: req.files ? req.files.map((file) => ({ field: file.fieldname, originalname: file.originalname })) : null,
      body: req.body
    });

    if (!req.file && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files[0];
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file using the field name "file" and multipart/form-data encoding.'
      });
    }

    const filePath = req.file.path;
    const validQuestions = [];
    let invalidRows = 0;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const normalized = normalizeCsvRow(row);

        const question = normalized.question || normalized.questiontext || normalized.questionbody || normalized.prompt || '';
        const subject = normalized.subject || '';
        const topic = normalized.topic || normalized.topics || '';
        const examType = normalized.examtype || normalized.exam || normalized.examt || normalized.examination || '';
        const option1 = normalized.option1 || normalized.optiona || normalized.optiona1 || normalized.optionone || normalized.optiona || '';
        const option2 = normalized.option2 || normalized.optionb || normalized.optionb1 || normalized.optiontwo || normalized.optionb || '';
        const option3 = normalized.option3 || normalized.optionc || normalized.optionc1 || normalized.optionthree || normalized.optionc || '';
        const option4 = normalized.option4 || normalized.optiond || normalized.optiond1 || normalized.optionfour || normalized.optiond || '';
        const correctAnswer = parseCorrectAnswerIndex(
          normalized.correctanswer ||
          normalized.correctans ||
          normalized.answer ||
          normalized.correct ||
          normalized['correct answer'] ||
          normalized['correctanswerindex'] ||
          normalized['answerindex'] ||
          normalized.ans ||
          normalized.choice,
          [option1, option2, option3, option4]
        );
        const difficulty = normalizeDifficulty(normalized.difficulty || normalized.level);
        const explanation = normalized.explanation || normalized.expl || normalized.explaination || 'Prepared by Admin team';
        const tags = normalized.tags ? normalized.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];

        if (!subject || !topic || !question || !option1 || !option2 || !option3 || !option4 || correctAnswer === null || !examType) {
          invalidRows += 1;
          return;
        }

        validQuestions.push({
          subject,
          topic,
          question,
          options: [option1, option2, option3, option4],
          correctAnswer,
          explanation,
          difficulty,
          tags,
          examType
        });
      })
      .on('end', async () => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          logger.error('File cleanup warning: %O', e);
        }

        if (validQuestions.length === 0) {
          return res.status(400).json({
            success: false,
            message: `No valid questions found. ${invalidRows} invalid row(s) were skipped. Ensure your CSV headers include subject, topic, question, option1, option2, option3, option4, correctAnswer, explanation, difficulty, examType.`
          });
        }

        try {
          const importResult = await importQuestionsAndCreateTest(validQuestions);

          return res.status(200).json({
            success: true,
            message: `CSV import completed successfully. Created test with ${importResult.questionCount} questions. ${importResult.skipped} row(s) skipped.`,
            data: {
              createdQuestions: importResult.questionCount,
              skippedRows: importResult.skipped,
              testId: importResult.test._id
            }
          });
        } catch (importError) {
          logger.error('[CSV Import] Failed to save questions or create test', { error: importError.message });
          return res.status(500).json({ success: false, message: 'Unable to import CSV questions at this time. Please review the CSV data and try again.' });
        }
      })
      .on('error', (error) => {
        logger.error('CSV Parsing error: %O', error);
        res.status(500).json({ success: false, message: 'Error parsing CSV file' });
      });
  } catch (error) {
    next(error);
  }
};
