const logger = require('../utils/logger');
const AppSettings = require('../models/AppSettings');
const { decrypt } = require('../utils/crypto');
const { isRateLimitError } = require('../utils/aiParser');
const gemini = require('./gemini.service');
const openai = require('./openai.service');

const CACHE_TTL_MS = 30 * 1000;
let cache = { data: null, expiresAt: 0 };

const invalidateCache = () => {
  cache = { data: null, expiresAt: 0 };
};

const getActiveProviderConfig = async () => {
  const now = Date.now();
  if (cache.data && cache.expiresAt > now) return cache.data;

  const settings = await AppSettings.getSingleton();
  let openaiKey = '';
  try {
    openaiKey = settings.openaiApiKeyEncrypted ? decrypt(settings.openaiApiKeyEncrypted) : '';
  } catch (err) {
    logger.error('Failed to decrypt OpenAI key (check SETTINGS_ENCRYPTION_KEY): %O', err);
    openaiKey = '';
  }

  const data = {
    provider: settings.aiProvider || 'gemini',
    openaiKey,
    openaiModel: settings.openaiModel || 'gpt-4o-mini',
    geminiModel: settings.geminiModel || 'gemini-2.5-flash'
  };
  cache = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
};

const route = async (fnName, geminiArgs, openaiArgs) => {
  const cfg = await getActiveProviderConfig();
  const { provider, openaiKey } = cfg;

  const canUseOpenAI = !!openaiKey;

  if (provider === 'openai') {
    if (!canUseOpenAI) {
      logger.warn(`Provider=openai but key missing. Falling back to gemini for ${fnName}.`);
      return gemini[fnName](...geminiArgs);
    }
    return openai[fnName](...openaiArgs(cfg));
  }

  if (provider === 'fallback') {
    try {
      return await gemini[fnName](...geminiArgs);
    } catch (err) {
      if (isRateLimitError(err) && canUseOpenAI) {
        logger.warn(`Gemini rate-limited on ${fnName}. Falling back to OpenAI.`);
        return openai[fnName](...openaiArgs(cfg));
      }
      throw err;
    }
  }

  return gemini[fnName](...geminiArgs);
};

const generateQuestions = (subject, topic, difficulty, questionCount, examType) =>
  route(
    'generateQuestions',
    [subject, topic, difficulty, questionCount, examType],
    (cfg) => [subject, topic, difficulty, questionCount, examType, cfg.openaiKey, cfg.openaiModel]
  );

const analyzeResult = (score, accuracy, timeSpent, weakTopics, answers) =>
  route(
    'analyzeResult',
    [score, accuracy, timeSpent, weakTopics, answers],
    (cfg) => [score, accuracy, timeSpent, weakTopics, answers, cfg.openaiKey, cfg.openaiModel]
  );

const generateNotes = (subject, topic) =>
  route(
    'generateNotes',
    [subject, topic],
    (cfg) => [subject, topic, cfg.openaiKey, cfg.openaiModel]
  );

const generateExplanation = (questionText, options, correctAnswerIndex, selectedOptionIndex) =>
  route(
    'generateExplanation',
    [questionText, options, correctAnswerIndex, selectedOptionIndex],
    (cfg) => [questionText, options, correctAnswerIndex, selectedOptionIndex, cfg.openaiKey, cfg.openaiModel]
  );

module.exports = {
  generateQuestions,
  analyzeResult,
  generateNotes,
  generateExplanation,
  invalidateCache
};
