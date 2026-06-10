const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../src/models/User');

const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

const [emailArg, passwordArg, ...nameParts] = process.argv.slice(2);
const email = emailArg || process.env.ADMIN_EMAIL;
const password = passwordArg || process.env.ADMIN_PASSWORD;
const name = nameParts.join(' ') || process.env.ADMIN_NAME || 'Admin User';

const exitWithUsage = () => {
  console.error('Usage: npm run set-admin -- <email> <password> [name]');
  console.error('Example: npm run set-admin -- admin@example.com Admin@123 "Admin User"');
  process.exit(1);
};

const main = async () => {
  if (!email || !password) {
    exitWithUsage();
  }

  if (password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/btsc_mock';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  const existingUser = await User.findOne({ email }).select('+password');

  if (existingUser) {
    existingUser.name = name;
    existingUser.password = password;
    existingUser.role = 'admin';
    existingUser.isVerified = true;
    existingUser.verificationOTP = undefined;
    existingUser.otpExpiry = undefined;
    await existingUser.save();
    console.log(`Admin updated: ${email}`);
  } else {
    await User.create({
      name,
      email,
      password,
      role: 'admin',
      isVerified: true
    });
    console.log(`Admin created: ${email}`);
  }
};

main()
  .catch((error) => {
    console.error('Failed to set admin:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
