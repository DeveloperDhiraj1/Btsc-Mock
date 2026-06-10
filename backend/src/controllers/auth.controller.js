const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail, getOTPTemplate } = require('../services/email.service');
const { getQueue } = require('../jobs/queue');
const logger = require('../utils/logger');

const isDevelopmentMode = () => process.env.NODE_ENV !== 'production';
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const isStrongPassword = (password = '') => strongPasswordPattern.test(password);

const getFirebaseWebApiKey = () => (
  process.env.FIREBASE_WEB_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  process.env.VITE_FIREBASE_API_KEY
);

// Generate JWT Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate JWT Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none'
  });
};

const getPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  subscriptionPlan: user.subscriptionPlan
});

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
    user: getPublicUser(user)
  });
};

// Register User
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      });
    }

    // Generate numeric 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      authProvider: 'local',
      verificationOTP: otp,
      otpExpiry
    });

    // Send OTP using nodemailer (background job queue)
    const emailQueue = getQueue('email-queue');
    const htmlBody = getOTPTemplate(otp, name);

    await emailQueue.add('sendOTP', {
      to: email,
      subject: 'Verify your BTSC Mock Platform Account',
      html: htmlBody
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. OTP sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    const acceptsAnyDevOtp = isDevelopmentMode() && /^\d{6}$/.test(otp);
    if (!acceptsAnyDevOtp && (user.verificationOTP !== otp || new Date() > user.otpExpiry)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailQueue = getQueue('email-queue');
    const htmlBody = getOTPTemplate(otp, user.name);
    await emailQueue.add('resendOTP', {
      to: email,
      subject: 'Verify your BTSC Mock Platform Account - Resend OTP',
      html: htmlBody
    });

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // Check user & include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({ success: false, message: 'Please continue with Google for this account.' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    next(error);
  }
};

// Google Sign-in through Firebase Auth
exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const firebaseWebApiKey = getFirebaseWebApiKey();

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google sign-in token is required' });
    }

    if (!firebaseWebApiKey) {
      return res.status(503).json({
        success: false,
        message: 'Firebase is not configured on the server. Add FIREBASE_WEB_API_KEY to backend environment.'
      });
    }

    const firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseWebApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );
    const firebaseData = await firebaseResponse.json();

    if (!firebaseResponse.ok || !firebaseData.users?.length) {
      return res.status(401).json({ success: false, message: 'Google sign-in verification failed' });
    }

    const firebaseUser = firebaseData.users[0];
    const providerProfile = firebaseUser.providerUserInfo?.find((provider) => provider.providerId === 'google.com');
    const email = firebaseUser.email;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account did not provide an email address' });
    }

    let user = await User.findOne({ email });

    if (user) {
      user.firebaseUid = firebaseUser.localId;
      user.authProvider = user.authProvider || 'google';
      user.isVerified = true;
      if (providerProfile?.photoUrl && (!user.profileImage || user.profileImage.includes('mock-cloud'))) {
        user.profileImage = providerProfile.photoUrl;
      }
      await user.save();
    } else {
      user = await User.create({
        name: providerProfile?.displayName || firebaseUser.displayName || email.split('@')[0],
        email,
        authProvider: 'google',
        firebaseUid: firebaseUser.localId,
        profileImage: providerProfile?.photoUrl || firebaseUser.photoUrl,
        isVerified: true
      });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    next(error);
  }
};

// Refresh Access Token
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const newAccessToken = generateAccessToken(user);
    res.status(200).json({
      success: true,
      token: newAccessToken
    });
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    // Generate temporary OTP for password reset
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetOtp;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const emailQueue = getQueue('email-queue');
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0;">
        <h2>Password Reset OTP</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Use the OTP below to complete the reset. Valid for 10 minutes.</p>
        <div style="font-size: 24px; font-weight: bold; background: #eee; padding: 10px; text-align: center;">${resetOtp}</div>
      </div>
    `;
    await emailQueue.add('resetPassword', {
      to: email,
      subject: 'Password Reset OTP Request',
      html: htmlBody
    });

    res.status(200).json({ success: true, message: 'Reset password OTP sent to email' });
  } catch (error) {
    next(error);
  }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset OTP' });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Logout / Clear cookie
exports.logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Upload Profile Image
exports.uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    const { uploadToCloudinary } = require('../services/upload.service');
    const imageUrl = await uploadToCloudinary(req.file);
    
    // Update user record
    await User.findByIdAndUpdate(req.user.id, { profileImage: imageUrl });

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      url: imageUrl
    });
  } catch (error) {
    next(error);
  }
};

// Add Bookmark
exports.addBookmark = async (req, res, next) => {
  try {
    const { questionId } = req.body;
    const user = await User.findById(req.user.id);
    
    if (user.bookmarks.includes(questionId)) {
      return res.status(400).json({ success: false, message: 'Question already bookmarked' });
    }
    
    user.bookmarks.push(questionId);
    await user.save();
    
    res.status(200).json({ success: true, message: 'Question bookmarked successfully' });
  } catch (error) {
    next(error);
  }
};

// Remove Bookmark
exports.removeBookmark = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const user = await User.findById(req.user.id);
    
    user.bookmarks = user.bookmarks.filter(id => id.toString() !== questionId);
    await user.save();
    
    res.status(200).json({ success: true, message: 'Question removed from bookmarks' });
  } catch (error) {
    next(error);
  }
};

// Get Bookmarks
exports.getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('bookmarks');
    res.status(200).json({ success: true, data: user.bookmarks });
  } catch (error) {
    next(error);
  }
};

// Get all users (Admin Only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// Update User Role (Admin Only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, message: 'User role updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// Delete User (Admin Only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
