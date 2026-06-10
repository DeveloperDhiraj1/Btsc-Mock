const mongoose = require('mongoose');

const AppSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: 'app-settings',
      unique: true,
      index: true
    },
    aiProvider: {
      type: String,
      enum: ['gemini', 'openai', 'fallback'],
      default: 'gemini'
    },
    openaiApiKeyEncrypted: {
      type: String,
      default: ''
    },
    openaiModel: {
      type: String,
      default: 'gpt-4o-mini'
    },
    geminiModel: {
      type: String,
      default: 'gemini-2.5-flash'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

AppSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({ singletonKey: 'app-settings' });
  if (!doc) {
    doc = await this.create({ singletonKey: 'app-settings' });
  }
  return doc;
};

module.exports = mongoose.model('AppSettings', AppSettingsSchema);
