const geminiService = require('../services/ai.service');
const Question = require('../models/Question');
const Test = require('../models/Test');
const logger = require('../utils/logger');

// POST /api/ai/generate-questions
exports.generateQuestions = async (req, res, next) => {
  try {
    const {
      subject,
      topic,
      difficulty,
      questionCount,
      examType,
      saveToDb = false,
      createTest = true,
      testTitle,
      testDuration = 60,
      negativeMarking = 0.25
    } = req.body;

    if (!subject || !topic || !difficulty || !examType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subject, topic, difficulty, and examType'
      });
    }

    const count = parseInt(questionCount) || 5;

    logger.info(`AI Generating ${count} questions for ${examType} - ${subject} / ${topic}`);
    const questions = await geminiService.generateQuestions(
      subject,
      topic,
      difficulty,
      count,
      examType
    );

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'AI did not return any valid questions. Please try again.'
      });
    }

    let savedQuestions = [];
    let createdTest = null;

    if (saveToDb) {
      const enrichedQuestions = questions.map((question) => ({
        subject: question.subject || subject,
        topic: question.topic || topic,
        examType: question.examType || examType,
        difficulty: question.difficulty || difficulty,
        generatedByAI: true,
        editedByAdmin: question.editedByAdmin || false,
        version: question.version || 1,
        ...question
      }));

      savedQuestions = await Question.insertMany(enrichedQuestions);
      logger.info(`Successfully stored ${savedQuestions.length} AI generated questions in database`);

      if (createTest && savedQuestions.length > 0) {
        const questionIds = savedQuestions.map((q) => q._id);
        const title = testTitle || `AI Generated ${examType} Mock - ${topic}`;

        createdTest = await Test.create({
          title,
          duration: parseInt(testDuration) || 60,
          negativeMarking: parseFloat(negativeMarking),
          examCategory: examType,
          questions: questionIds,
          totalMarks: questionIds.length * 2,
          generatedByAI: true,
          isActive: true
        });

        logger.info(`Created student-facing AI mock test: ${createdTest._id}`);
      }
    }

    const responseData = saveToDb ? { questions: savedQuestions } : { questions };
    if (createdTest) {
      responseData.test = createdTest;
    }

    res.status(200).json({
      success: true,
      message: `Successfully generated ${questions.length} questions`,
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/generate-mock
// Generates a mock exam using AI questions and saves it
exports.generateMockTest = async (req, res, next) => {
  try {
    const { title, duration, examCategory, subject, topic, difficulty, questionCount } = req.body;

    if (!title || !examCategory || !subject || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, examCategory, subject, and topic'
      });
    }

    const count = parseInt(questionCount) || 10;
    
    // 1. Generate questions via AI
    logger.info(`AI Mock Test Gen: Creating ${count} questions for mock exam: ${title}`);
    const questions = await geminiService.generateQuestions(
      subject,
      topic,
      difficulty || 'medium',
      count,
      examCategory
    );

    // 2. Save Questions in Database
    const dbQuestions = await Question.insertMany(questions);
    const questionIds = dbQuestions.map(q => q._id);

    // 3. Create the Mock Test
    const newTest = await Test.create({
      title,
      duration: parseInt(duration) || 60,
      examCategory,
      questions: questionIds,
      totalMarks: dbQuestions.length * 2, // 2 marks per question
      generatedByAI: true
    });

    res.status(201).json({
      success: true,
      message: 'AI Mock test created and saved successfully',
      data: newTest
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/generate-notes
exports.generateRevisionNotes = async (req, res, next) => {
  try {
    const { subject, topic } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both subject and topic'
      });
    }

    logger.info(`AI Notes Gen: Generating notes for ${subject} -> ${topic}`);
    const notes = await geminiService.generateNotes(subject, topic);

    res.status(200).json({
      success: true,
      data: notes
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/generate-explanation
exports.generateExplanation = async (req, res, next) => {
  try {
    const { questionText, options, correctAnswerIndex, selectedOptionIndex } = req.body;

    if (!questionText || !options || correctAnswerIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide questionText, options list, and correctAnswerIndex'
      });
    }

    logger.info(`AI Explanation Gen: Processing detailed answer walkthrough`);
    const explanation = await geminiService.generateExplanation(
      questionText,
      options,
      correctAnswerIndex,
      selectedOptionIndex
    );

    res.status(200).json({
      success: true,
      data: explanation
    });
  } catch (error) {
    next(error);
  }
};
