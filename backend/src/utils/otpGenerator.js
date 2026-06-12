const crypto = require('crypto');

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MIN_RESEND_INTERVAL_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const generateOTP = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;
  return crypto.randomInt(min, max).toString();
};

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

const compareOTP = (plain, hash) => {
  if (!plain || !hash) return false;
  const candidate = hashOTP(plain);
  if (candidate.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
};

const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
};

module.exports = {
  generateOTP,
  hashOTP,
  compareOTP,
  isValidEmail,
  OTP_TTL_MS,
  OTP_MIN_RESEND_INTERVAL_MS,
  OTP_MAX_ATTEMPTS
};
