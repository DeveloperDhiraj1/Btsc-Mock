const { Queue, Worker } = require('bullmq');
const { redisClient, isRedisMock } = require('../services/redis.service');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/email.service');

const parseCorrectAnswer = (value) => {
  if (typeof value === 'number') {
    if (value >= 0 && value <= 3) return value;
    if (value >= 1 && value <= 4) return value - 1;
    return null;
  }
  const raw = String(value || '').trim();
  if (!raw) return null;
  const letters = { a: 0, b: 1, c: 2, d: 3 };
  if (letters.hasOwnProperty(raw.toLowerCase())) return letters[raw.toLowerCase()];
  const parsed = parseInt(raw, 10);
  if (!Number.isNaN(parsed)) {
    if (parsed >= 0 && parsed <= 3) return parsed;
    if (parsed >= 1 && parsed <= 4) return parsed - 1;
  }
  return null;
};

// Queue instance map
const queues = {};
const mockQueueHandlers = {};

/**
 * Register a background task queue
 * @param {string} name - Queue name
 * @param {function} processor - Job worker function
 */
const registerQueue = (name, processor) => {
  if (isRedisMock()) {
    // Memory Mode: Register callback directly
    mockQueueHandlers[name] = processor;
    logger.info(`Registered background queue '${name}' in Simulation (In-Memory Direct Async) Mode`);
    
    queues[name] = {
      add: async (jobName, data) => {
        logger.info(`[Simulation Queue '${name}'] Processing job '${jobName}' immediately...`);
        // Trigger asynchronously to simulate background queue
        setTimeout(async () => {
          try {
            await processor({ name: jobName, data });
            logger.info(`[Simulation Queue '${name}'] Job '${jobName}' completed.`);
          } catch (err) {
            logger.error(`[Simulation Queue '${name}'] Job '${jobName}' failed: %O`, err);
          }
        }, 500);
        return { id: 'sim-job-' + Date.now() };
      }
    };
  } else {
    // Production Mode: BullMQ
    try {
      queues[name] = new Queue(name, { connection: redisClient });
      
      const worker = new Worker(name, processor, { connection: redisClient });
      
      worker.on('completed', (job) => {
        logger.info(`Queue [${name}]: Job [${job.id}] completed.`);
      });
      
      worker.on('failed', (job, err) => {
        logger.error(`Queue [${name}]: Job [${job?.id || 'unknown'}] failed: %O`, err);
      });
      
      logger.info(`Registered BullMQ queue '${name}' with active background worker`);
    } catch (error) {
      logger.error(`Failed to register BullMQ queue '${name}': %O`, error);
      // Failover to simulation
      mockQueueHandlers[name] = processor;
      queues[name] = {
        add: async (jobName, data) => {
          setTimeout(async () => {
            try {
              await processor({ name: jobName, data });
            } catch (err) {
              logger.error(err);
            }
          }, 0);
          return { id: 'fallback-job' };
        }
      };
    }
  }
};

// Initialize default background queues
const initQueues = () => {
  // 1. Email Sending Queue
  registerQueue('email-queue', async (job) => {
    const { to, subject, html } = job.data;
    await sendEmail(to, subject, html);
  });

  // 2. CSV Question Import Queue
  registerQueue('csv-upload-queue', async (job) => {
    const Question = require('../models/Question');
    const Test = require('../models/Test');
    const { questions } = job.data;
    
    logger.info(`🔄 CSV Queue Started: Processing ${questions.length} questions`);
    let createdCount = 0;
    let skippedCount = 0;
    const createdQuestionIds = [];
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      try {
        logger.info(`[${i + 1}/${questions.length}] Processing question: ${q.question.substring(0, 50)}...`);
        
        const correctAnswerIndex = parseCorrectAnswer(q.correctAnswer);
        if (correctAnswerIndex === null) {
          logger.warn(`[${i + 1}/${questions.length}] ⚠️ Invalid correctAnswer: ${q.correctAnswer}. Skipping.`);
          skippedCount++;
          continue;
        }

        const newQuestion = await Question.create({
          subject: q.subject,
          topic: q.topic,
          question: q.question,
          options: [q.option1, q.option2, q.option3, q.option4],
          correctAnswer: correctAnswerIndex,
          explanation: q.explanation || 'Prepared by Admin team',
          difficulty: q.difficulty || 'medium',
          tags: Array.isArray(q.tags) ? q.tags : (q.tags ? q.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : []),
          examType: q.examType
        });
        
        createdQuestionIds.push(newQuestion._id);
        logger.info(`✅ [${i + 1}/${questions.length}] Question saved with ID: ${newQuestion._id}`);
        createdCount++;
      } catch (err) {
        logger.error(`❌ [${i + 1}/${questions.length}] Failed to create question: ${err.message}`, { stack: err.stack });
        skippedCount++;
      }
    }
    
    // Create Test record with saved questions grouped by examType
    if (createdQuestionIds.length > 0) {
      try {
        const firstQuestion = questions[0];
        const examType = firstQuestion.examType || 'BTSC';
        
        const testTitle = `CSV Bulk Import - ${examType} [${new Date().toLocaleDateString()}]`;
        
        const newTest = await Test.create({
          title: testTitle,
          duration: 120,
          totalMarks: createdQuestionIds.length,
          questions: createdQuestionIds,
          examCategory: examType,
          isActive: true,
          negativeMarking: 0.25
        });
        
        logger.info(`✅ Test created: ${newTest._id} with ${createdQuestionIds.length} questions`);
      } catch (testErr) {
        logger.error(`⚠️ Failed to create Test record: ${testErr.message}`, { stack: testErr.stack });
      }
    }
    
    logger.info(`✅ CSV Import Complete: ${createdCount} saved, ${skippedCount} failed out of ${questions.length} total`);
  });

  // 3. AI Question Generator Queue
  registerQueue('ai-question-queue', async (job) => {
    // AI Question generation worker stub - handled via direct controllers or background
    logger.info('Queue processing background AI Question generation task');
  });

  // 4. Result Analytics Queue
  registerQueue('result-analytics-queue', async (job) => {
    const User = require('../models/User');
    const { userId, score, accuracy, weakTopics } = job.data;
    
    try {
      const user = await User.findById(userId);
      if (user) {
        // Recalculate User average accuracy
        const totalAttempts = user.scores.length;
        if (totalAttempts > 0) {
          const sumAcc = user.scores.reduce((sum, item) => sum + (item.accuracy || 0), 0);
          user.accuracy = Math.round(sumAcc / totalAttempts);
        }
        
        // Merge weak topics
        for (const topicName of weakTopics) {
          const existingTopic = user.weakTopics.find(t => t.topic === topicName);
          if (existingTopic) {
            existingTopic.errorCount += 1;
          } else {
            user.weakTopics.push({ topic: topicName, errorCount: 1 });
          }
        }
        await user.save();
        logger.info(`Recalculated weak topics & accuracy metrics for user ${userId}`);
      }
    } catch (err) {
      logger.error('Result analytics worker failed: %O', err);
    }
  });
};

const getQueue = (name) => {
  return queues[name];
};

module.exports = {
  initQueues,
  getQueue
};
