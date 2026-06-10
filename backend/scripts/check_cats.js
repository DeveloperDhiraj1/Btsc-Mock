const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });
const Test = require('../src/models/Test');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const cat of ['BTSC', 'SSC', 'Railway', 'BPSC', 'Polytechnic']) {
    const escaped = cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tests = await Test.find({ isActive: true, examCategory: new RegExp(`^${escaped}`, 'i') }).select('title examCategory');
    console.log(`[${cat}] → ${tests.length} test(s):`, tests.map(t => `${t.examCategory} — ${t.title}`));
  }
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
