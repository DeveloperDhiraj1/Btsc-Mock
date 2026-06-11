// Test-only env. Runs before the app is required so JWT signing and
// optional integrations have the values they expect in CI.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_access_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret';

// Force every external integration into its in-memory mock so tests
// never reach out to Redis, Mongo Atlas, SMTP, Cloudinary, or Razorpay.
process.env.USE_REDIS_MOCK = 'true';
process.env.USE_EMAIL_MOCK = 'true';
process.env.USE_CLOUDINARY_MOCK = 'true';
process.env.USE_RAZORPAY_MOCK = 'true';
process.env.USE_GEMINI_MOCK = 'true';
process.env.USE_OPEN_AI_MOCK = 'true';
