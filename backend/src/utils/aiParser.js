const logger = require('./logger');

const parseAIJson = (rawText) => {
  try {
    let clean = String(rawText || '').trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(json)?/i, '').replace(/```$/, '');
    }
    return JSON.parse(clean.trim());
  } catch (error) {
    logger.error('Failed to parse AI JSON output. Raw text: %s', rawText);
    throw new Error('Invalid JSON structure returned by AI model');
  }
};

const isRateLimitError = (err) => {
  if (!err) return false;
  if (err.status === 429 || err.statusCode === 429 || err.code === 429) return true;
  const msg = String(err.message || err.toString() || '').toLowerCase();
  return (
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('too many requests')
  );
};

const buildMockQuestions = (subject, topic, difficulty, count, examType) => {
  const list = [];
  for (let i = 1; i <= count; i++) {
    list.push({
      question: `Simulated question ${i} about "${topic}" in "${subject}" for ${examType} exam. Which option is correct?`,
      options: [
        `Standard Option A for question ${i}`,
        `Correct Option B for question ${i} (Answer)`,
        `Distractor Option C for question ${i}`,
        `Distractor Option D for question ${i}`
      ],
      correctAnswer: 1,
      explanation: `Option B is correct because under standard ${examType} rules, "${topic}" dictates this relation.`,
      difficulty,
      tags: [examType, subject, topic],
      generatedByAI: true,
      subject,
      topic,
      examType
    });
  }
  return list;
};

module.exports = { parseAIJson, isRateLimitError, buildMockQuestions };
