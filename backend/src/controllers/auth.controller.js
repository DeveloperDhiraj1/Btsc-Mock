// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// const { sendEmail, getOTPTemplate } = require('../services/email.service');
// const { getQueue } = require('../jobs/queue');
// const {
//   generateOTP,
//   hashOTP,
//   compareOTP,
//   isValidEmail,
//   OTP_TTL_MS,
//   OTP_MIN_RESEND_INTERVAL_MS,
//   OTP_MAX_ATTEMPTS
// } = require('../utils/otpGenerator');
// const logger = require('../utils/logger');

// const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

// const isStrongPassword = (password = '') => strongPasswordPattern.test(password);

// const getFirebaseWebApiKey = () => (
//   process.env.FIREBASE_WEB_API_KEY ||
//   process.env.FIREBASE_API_KEY ||
//   process.env.VITE_FIREBASE_API_KEY
// );

// // Generate JWT Access Token
// const generateAccessToken = (user) => {
//   return jwt.sign(
//     { id: user._id, role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: '15m' }
//   );
// };

// // Generate JWT Refresh Token
// const generateRefreshToken = (user) => {
//   return jwt.sign(
//     { id: user._id },
//     process.env.JWT_REFRESH_SECRET,
//     { expiresIn: '7d' }
//   );
// };

// const clearRefreshCookie = (res) => {
//   res.clearCookie('refreshToken', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'none'
//   });
// };

// const getPublicUser = (user) => ({
//   id: user._id,
//   name: user.name,
//   email: user.email,
//   role: user.role,
//   profileImage: user.profileImage,
//   subscriptionPlan: user.subscriptionPlan
// });

// const sendAuthResponse = (res, user) => {
//   const accessToken = generateAccessToken(user);
//   const refreshToken = generateRefreshToken(user);

//   res.cookie('refreshToken', refreshToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'none',
//     maxAge: 7 * 24 * 60 * 60 * 1000
//   });

//   return res.status(200).json({
//     success: true,
//     token: accessToken,
//     user: getPublicUser(user)
//   });
// };

// // Issue a fresh OTP for a user — enforces the 60s resend cooldown.
// // Returns { ok: false, retryAfter } if rate-limited.
// const issueOTP = async (user, purpose) => {
//   const now = Date.now();
//   if (user.lastOtpSent && now - user.lastOtpSent.getTime() < OTP_MIN_RESEND_INTERVAL_MS) {
//     const retryAfter = Math.ceil((OTP_MIN_RESEND_INTERVAL_MS - (now - user.lastOtpSent.getTime())) / 1000);
//     return { ok: false, retryAfter };
//   }
//   const otp = generateOTP();
//   user.otpHash = hashOTP(otp);
//   user.otpExpires = new Date(now + OTP_TTL_MS);
//   user.otpAttempts = 0;
//   user.lastOtpSent = new Date(now);
//   user.otpPurpose = purpose;
//   await user.save();
//   return { ok: true, otp };
// };

// const enqueueOtpEmail = async (email, name, otp, subject) => {
//   const html = getOTPTemplate(otp, name);
//   const emailQueue = getQueue('email-queue');
//   await emailQueue.add('sendOTP', { to: email, subject, html });
// };

// // Register User
// exports.register = async (req, res, next) => {
//   try {
//     const { name, email, password, role } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
//     }
//     if (!isValidEmail(email)) {
//       return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
//     }
//     if (!isStrongPassword(password)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
//       });
//     }

//     const normalizedEmail = email.trim().toLowerCase();
//     const userExists = await User.findOne({ email: normalizedEmail });
//     if (userExists) {
//       return res.status(400).json({ success: false, message: 'User already exists' });
//     }

//     const user = await User.create({
//       name: name.trim(),
//       email: normalizedEmail,
//       password,
//       role: role || 'student',
//       authProvider: 'local'
//     });

//     const userWithOtpFields = await User.findById(user._id).select('+otpHash +otpExpires +otpAttempts +lastOtpSent +otpPurpose');
//     const result = await issueOTP(userWithOtpFields, 'verify');
//     if (!result.ok) {
//       return res.status(429).json({
//         success: false,
//         message: `Please wait ${result.retryAfter}s before requesting another OTP.`
//       });
//     }
//     await enqueueOtpEmail(normalizedEmail, user.name, result.otp, 'Verify your BTSC Mock Platform Account');

//     return res.status(201).json({
//       success: true,
//       message: 'Registration successful. OTP sent to your email.'
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Verify OTP
// exports.verifyEmail = async (req, res, next) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       return res.status(400).json({ success: false, message: 'Email and OTP are required' });
//     }
//     if (!/^\d{6}$/.test(String(otp))) {
//       return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number' });
//     }

//     const normalizedEmail = email.trim().toLowerCase();
//     const user = await User.findOne({ email: normalizedEmail })
//       .select('+otpHash +otpExpires +otpAttempts +lastOtpSent +otpPurpose');
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
//     if (user.isVerified) {
//       return res.status(400).json({ success: false, message: 'User is already verified' });
//     }
//     if (!user.otpHash || !user.otpExpires || user.otpPurpose !== 'verify') {
//       return res.status(400).json({ success: false, message: 'No active OTP. Please request a new one.' });
//     }
//     if (new Date() > user.otpExpires) {
//       user.otpHash = undefined;
//       user.otpExpires = undefined;
//       user.otpAttempts = 0;
//       user.otpPurpose = undefined;
//       await user.save();
//       return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
//     }
//     if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
//       user.otpHash = undefined;
//       user.otpExpires = undefined;
//       user.otpAttempts = 0;
//       user.otpPurpose = undefined;
//       await user.save();
//       return res.status(429).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });
//     }

//     if (!compareOTP(otp, user.otpHash)) {
//       user.otpAttempts += 1;
//       await user.save();
//       return res.status(400).json({ success: false, message: 'Invalid OTP' });
//     }

//     // Single-use: clear immediately on successful verification.
//     user.isVerified = true;
//     user.otpHash = undefined;
//     user.otpExpires = undefined;
//     user.otpAttempts = 0;
//     user.otpPurpose = undefined;
//     await user.save();

//     return res.status(200).json({ success: true, message: 'Account verified successfully' });
//   } catch (error) {
//     next(error);
//   }
// };

// // Resend OTP (for verification flow)
// exports.resendOTP = async (req, res, next) => {
//   try {
//     const { email } = req.body;
//     if (!isValidEmail(email)) {
//       return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
//     }
//     const normalizedEmail = email.trim().toLowerCase();
//     const user = await User.findOne({ email: normalizedEmail })
//       .select('+otpHash +otpExpires +otpAttempts +lastOtpSent +otpPurpose');
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
//     if (user.isVerified) {
//       return res.status(400).json({ success: false, message: 'User is already verified' });
//     }
//     const result = await issueOTP(user, 'verify');
//     if (!result.ok) {
//       return res.status(429).json({
//         success: false,
//         message: `Please wait ${result.retryAfter}s before requesting another OTP.`
//       });
//     }
//     await enqueueOtpEmail(normalizedEmail, user.name, result.otp, 'Your new BTSC Mock verification code');
//     return res.status(200).json({ success: true, message: 'OTP resent successfully.' });
//   } catch (error) {
//     next(error);
//   }
// };

// // Login User
// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     // Validation
//     if (!email || !password) {
//       return res.status(400).json({ success: false, message: 'Please provide an email and password' });
//     }

//     // Check user & include password
//     const user = await User.findOne({ email }).select('+password');
//     if (!user) {
//       return res.status(401).json({ success: false, message: 'Invalid credentials' });
//     }

//     if (user.authProvider === 'google' && !user.password) {
//       return res.status(401).json({ success: false, message: 'Please continue with Google for this account.' });
//     }

//     // Check password
//     const isMatch = await user.matchPassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: 'Invalid credentials' });
//     }

//     if (!user.isVerified) {
//       return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
//     }

//     return sendAuthResponse(res, user);
//   } catch (error) {
//     next(error);
//   }
// };

// // Google Sign-in through Firebase Auth
// exports.googleLogin = async (req, res, next) => {
//   try {
//     const { idToken } = req.body;
//     const firebaseWebApiKey = getFirebaseWebApiKey();

//     if (!idToken) {
//       return res.status(400).json({ success: false, message: 'Google sign-in token is required' });
//     }

//     if (!firebaseWebApiKey) {
//       return res.status(503).json({
//         success: false,
//         message: 'Firebase is not configured on the server. Add FIREBASE_WEB_API_KEY to backend environment.'
//       });
//     }

//     const firebaseResponse = await fetch(
//       `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseWebApiKey}`,
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ idToken })
//       }
//     );
//     const firebaseData = await firebaseResponse.json();

//     if (!firebaseResponse.ok || !firebaseData.users?.length) {
//       return res.status(401).json({ success: false, message: 'Google sign-in verification failed' });
//     }

//     const firebaseUser = firebaseData.users[0];
//     const providerProfile = firebaseUser.providerUserInfo?.find((provider) => provider.providerId === 'google.com');
//     const email = firebaseUser.email;

//     if (!email) {
//       return res.status(400).json({ success: false, message: 'Google account did not provide an email address' });
//     }

//     let user = await User.findOne({ email });

//     if (user) {
//       user.firebaseUid = firebaseUser.localId;
//       user.authProvider = user.authProvider || 'google';
//       user.isVerified = true;
//       if (providerProfile?.photoUrl && (!user.profileImage || user.profileImage.includes('mock-cloud'))) {
//         user.profileImage = providerProfile.photoUrl;
//       }
//       await user.save();
//     } else {
//       user = await User.create({
//         name: providerProfile?.displayName || firebaseUser.displayName || email.split('@')[0],
//         email,
//         authProvider: 'google',
//         firebaseUid: firebaseUser.localId,
//         profileImage: providerProfile?.photoUrl || firebaseUser.photoUrl,
//         isVerified: true
//       });
//     }

//     return sendAuthResponse(res, user);
//   } catch (error) {
//     next(error);
//   }
// };

// // Refresh Access Token
// exports.refreshToken = async (req, res, next) => {
//   try {
//     const refreshToken = req.cookies.refreshToken;
//     if (!refreshToken) {
//       return res.status(401).json({ success: false, message: 'No refresh token provided' });
//     }

//     const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
//     const user = await User.findById(decoded.id);

//     if (!user) {
//       clearRefreshCookie(res);
//       return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
//     }

//     const newAccessToken = generateAccessToken(user);
//     res.status(200).json({
//       success: true,
//       token: newAccessToken
//     });
//   } catch (error) {
//     clearRefreshCookie(res);
//     return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
//   }
// };

// // Forgot Password — issues a single-use, expiring, hashed OTP for password reset
// exports.forgotPassword = async (req, res, next) => {
//   try {
//     const { email } = req.body;
//     if (!isValidEmail(email)) {
//       return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
//     }
//     const normalizedEmail = email.trim().toLowerCase();
//     const user = await User.findOne({ email: normalizedEmail })
//       .select('+otpHash +otpExpires +otpAttempts +lastOtpSent +otpPurpose');

//     // Always return success to avoid email-enumeration; only send if the user exists.
//     if (user) {
//       const result = await issueOTP(user, 'reset');
//       if (!result.ok) {
//         return res.status(429).json({
//           success: false,
//           message: `Please wait ${result.retryAfter}s before requesting another reset code.`
//         });
//       }
//       await enqueueOtpEmail(normalizedEmail, user.name, result.otp, 'Reset your BTSC Mock Platform password');
//     } else {
//       logger.warn(`[auth.forgotPassword] No account for ${normalizedEmail} — silently dropping request`);
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'If an account exists for this email, a reset code has been sent.'
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Reset Password
// exports.resetPassword = async (req, res, next) => {
//   try {
//     const { email, otp, newPassword } = req.body;

//     if (!isValidEmail(email)) {
//       return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
//     }
//     if (!/^\d{6}$/.test(String(otp || ''))) {
//       return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number' });
//     }
//     if (!isStrongPassword(newPassword)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
//       });
//     }

//     const normalizedEmail = email.trim().toLowerCase();
//     const user = await User.findOne({ email: normalizedEmail })
//       .select('+password +otpHash +otpExpires +otpAttempts +lastOtpSent +otpPurpose');
//     if (!user || !user.otpHash || !user.otpExpires || user.otpPurpose !== 'reset') {
//       return res.status(400).json({ success: false, message: 'Invalid or expired reset OTP' });
//     }
//     if (new Date() > user.otpExpires) {
//       user.otpHash = undefined;
//       user.otpExpires = undefined;
//       user.otpAttempts = 0;
//       user.otpPurpose = undefined;
//       await user.save();
//       return res.status(400).json({ success: false, message: 'Reset OTP has expired. Please request a new one.' });
//     }
//     if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
//       user.otpHash = undefined;
//       user.otpExpires = undefined;
//       user.otpAttempts = 0;
//       user.otpPurpose = undefined;
//       await user.save();
//       return res.status(429).json({ success: false, message: 'Too many failed attempts. Please request a new reset code.' });
//     }
//     if (!compareOTP(otp, user.otpHash)) {
//       user.otpAttempts += 1;
//       await user.save();
//       return res.status(400).json({ success: false, message: 'Invalid reset OTP' });
//     }

//     user.password = newPassword;
//     user.otpHash = undefined;
//     user.otpExpires = undefined;
//     user.otpAttempts = 0;
//     user.otpPurpose = undefined;
//     await user.save();

//     return res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
//   } catch (error) {
//     next(error);
//   }
// };

// // Get current user profile
// exports.getMe = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.id);
//     res.status(200).json({
//       success: true,
//       data: user
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Logout / Clear cookie
// exports.logout = async (req, res, next) => {
//   try {
//     res.clearCookie('refreshToken');
//     res.status(200).json({
//       success: true,
//       message: 'Logged out successfully'
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Upload Profile Image
// exports.uploadProfileImage = async (req, res, next) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: 'Please upload a file' });
//     }
//     const { uploadToCloudinary } = require('../services/upload.service');
//     const imageUrl = await uploadToCloudinary(req.file, req);
    
//     // Update user record
//     await User.findByIdAndUpdate(req.user.id, { profileImage: imageUrl });

//     res.status(200).json({
//       success: true,
//       message: 'Profile image updated successfully',
//       url: imageUrl
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Add Bookmark
// exports.addBookmark = async (req, res, next) => {
//   try {
//     const { questionId } = req.body;
//     const user = await User.findById(req.user.id);
    
//     if (user.bookmarks.includes(questionId)) {
//       return res.status(400).json({ success: false, message: 'Question already bookmarked' });
//     }
    
//     user.bookmarks.push(questionId);
//     await user.save();
    
//     res.status(200).json({ success: true, message: 'Question bookmarked successfully' });
//   } catch (error) {
//     next(error);
//   }
// };

// // Remove Bookmark
// exports.removeBookmark = async (req, res, next) => {
//   try {
//     const { questionId } = req.params;
//     const user = await User.findById(req.user.id);
    
//     user.bookmarks = user.bookmarks.filter(id => id.toString() !== questionId);
//     await user.save();
    
//     res.status(200).json({ success: true, message: 'Question removed from bookmarks' });
//   } catch (error) {
//     next(error);
//   }
// };

// // Get Bookmarks
// exports.getBookmarks = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.id).populate('bookmarks');
//     res.status(200).json({ success: true, data: user.bookmarks });
//   } catch (error) {
//     next(error);
//   }
// };

// // Get all users (Admin Only)
// exports.getAllUsers = async (req, res, next) => {
//   try {
//     const users = await User.find({}).sort({ createdAt: -1 });
//     res.status(200).json({ success: true, count: users.length, data: users });
//   } catch (error) {
//     next(error);
//   }
// };

// // Update User Role (Admin Only)
// exports.updateUserRole = async (req, res, next) => {
//   try {
//     const { role } = req.body;
//     if (!['student', 'admin'].includes(role)) {
//       return res.status(400).json({ success: false, message: 'Invalid role' });
//     }
    
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { role },
//       { new: true, runValidators: true }
//     );
    
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
    
//     res.status(200).json({ success: true, message: 'User role updated successfully', data: user });
//   } catch (error) {
//     next(error);
//   }
// };

// // Delete User (Admin Only)
// exports.deleteUser = async (req, res, next) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
//     res.status(200).json({ success: true, message: 'User deleted successfully' });
//   } catch (error) {
//     next(error);
//   }
// };


const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getQueue } = require('../jobs/queue');
const {
  generateOTP,
  hashOTP,
  compareOTP,
  isValidEmail,
  OTP_TTL_MS,
  OTP_MIN_RESEND_INTERVAL_MS,
  OTP_MAX_ATTEMPTS
} = require('../utils/otpGenerator');
const logger = require('../utils/logger');

const strongPasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const isStrongPassword = (p = '') => strongPasswordPattern.test(p);

// ================= JWT =================
const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none'
  });
};

const sendAuthResponse = (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.status(200).json({
    success: true,
    token: accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

// ================= OTP =================
const issueOTP = async (user, purpose) => {
  const now = Date.now();

  if (
    user.lastOtpSent &&
    now - user.lastOtpSent.getTime() < OTP_MIN_RESEND_INTERVAL_MS
  ) {
    return {
      ok: false,
      retryAfter: Math.ceil(
        (OTP_MIN_RESEND_INTERVAL_MS - (now - user.lastOtpSent.getTime())) / 1000
      )
    };
  }

  const otp = generateOTP();

  user.otpHash = hashOTP(otp);
  user.otpExpires = new Date(now + OTP_TTL_MS);
  user.otpAttempts = 0;
  user.lastOtpSent = new Date(now);
  user.otpPurpose = purpose;

  await user.save();

  return { ok: true, otp };
};

const enqueueOtpEmail = async (email, name, otp, subject) => {
  const emailQueue = getQueue('email-queue');
  await emailQueue.add('sendOTP', {
    to: email,
    subject,
    html: `Your OTP is: ${otp}`
  });
};

// ================= REGISTER =================
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Weak password'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'User exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role || 'student',
      authProvider: 'local'
    });

    const result = await issueOTP(user, 'verify');

    if (!result.ok) {
      return res.status(429).json({
        success: false,
        message: `Wait ${result.retryAfter}s`
      });
    }

    await enqueueOtpEmail(normalizedEmail, user.name, result.otp, 'Verify OTP');

    return res.status(201).json({
      success: true,
      message: 'OTP sent'
    });
  } catch (err) {
    next(err);
  }
};

// ================= VERIFY =================
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+otpHash +otpExpires +otpAttempts +otpPurpose');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (!compareOTP(otp, user.otpHash)) {
      user.otpAttempts++;
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpPurpose = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Verified'
    });
  } catch (err) {
    next(err);
  }
};

// ================= RESEND OTP (IMPORTANT FIXED) =================
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return res.status(404).json({ success: false });
    }

    const result = await issueOTP(user, 'verify');

    if (!result.ok) {
      return res.status(429).json({
        success: false,
        message: `Wait ${result.retryAfter}s`
      });
    }

    await enqueueOtpEmail(user.email, user.name, result.otp, 'Resend OTP');

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ================= EXPORT (MOST IMPORTANT FIX) =================
module.exports = {
  register,
  verifyEmail,
  resendOTP
};