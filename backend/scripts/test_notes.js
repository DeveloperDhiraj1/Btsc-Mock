const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });
const geminiService = require('../src/services/gemini.service');
(async () => {
  console.log('USE_GEMINI_MOCK env:', process.env.USE_GEMINI_MOCK);
  console.log('GEMINI_API_KEY set:', !!process.env.GEMINI_API_KEY, 'length:', process.env.GEMINI_API_KEY?.length);
  console.log('---');
  console.log('Calling generateNotes("Physics", "Newton\'s Laws")...');
  const notes = await geminiService.generateNotes('Physics', "Newton's Laws");
  console.log('---');
  console.log('Got notes (length=' + notes.length + ' chars):');
  console.log(notes.substring(0, 500));
})().catch(e => { console.error('FAIL:', e); process.exit(1); });
