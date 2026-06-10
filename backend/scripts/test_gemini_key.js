const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const candidates = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-2.5-pro',
  'gemini-1.5-flash-latest',
  'gemini-pro'
];

(async () => {
  for (const name of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent('Reply: PONG');
      const text = (await result.response).text().trim();
      console.log(`✓ ${name} → ${text}`);
    } catch (e) {
      console.log(`✗ ${name} → ${e.message.split('\n')[0].slice(0, 100)}`);
    }
  }
})();
