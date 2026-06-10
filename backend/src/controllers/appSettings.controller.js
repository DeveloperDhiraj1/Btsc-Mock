const AppSettings = require('../models/AppSettings');
const { encrypt, decrypt } = require('../utils/crypto');
const aiService = require('../services/ai.service');
const logger = require('../utils/logger');

const maskKey = (plain) => {
  if (!plain) return '';
  const last4 = plain.slice(-4);
  return `sk-•••••••${last4}`;
};

exports.getAISettings = async (req, res, next) => {
  try {
    const doc = await AppSettings.getSingleton();
    let openaiKeyMasked = '';
    let openaiKeyConfigured = false;
    if (doc.openaiApiKeyEncrypted) {
      try {
        const plain = decrypt(doc.openaiApiKeyEncrypted);
        openaiKeyMasked = maskKey(plain);
        openaiKeyConfigured = !!plain;
      } catch (err) {
        logger.error('Failed to decrypt OpenAI key on read: %O', err);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        aiProvider: doc.aiProvider,
        openaiModel: doc.openaiModel,
        geminiModel: doc.geminiModel,
        openaiKeyMasked,
        openaiKeyConfigured,
        updatedAt: doc.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAISettings = async (req, res, next) => {
  try {
    const { aiProvider, openaiApiKey, openaiModel, geminiModel } = req.body;
    const doc = await AppSettings.getSingleton();

    if (aiProvider) {
      if (!['gemini', 'openai', 'fallback'].includes(aiProvider)) {
        return res.status(400).json({ success: false, message: 'Invalid aiProvider value' });
      }
      doc.aiProvider = aiProvider;
    }

    if (typeof openaiApiKey === 'string' && openaiApiKey.trim().length > 0) {
      try {
        doc.openaiApiKeyEncrypted = encrypt(openaiApiKey.trim());
      } catch (err) {
        logger.error('Encryption failed: %O', err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (openaiModel) doc.openaiModel = openaiModel;
    if (geminiModel) doc.geminiModel = geminiModel;
    doc.updatedBy = req.user?.id;

    await doc.save();
    aiService.invalidateCache();

    res.status(200).json({ success: true, message: 'AI settings updated' });
  } catch (error) {
    next(error);
  }
};
