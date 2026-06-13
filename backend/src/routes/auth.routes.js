// const express = require('express');
// const {
//   register,
//   verifyEmail,
//   resendOTP,
//   login,
//   googleLogin,
//   refreshToken,
//   forgotPassword,
//   resetPassword,
//   getMe,
//   logout,
//   uploadProfileImage,
//   addBookmark,
//   removeBookmark,
//   getBookmarks,
//   getAllUsers,
//   updateUserRole,
//   deleteUser
// } = require('../controllers/auth.controller');
// const { protect } = require('../middlewares/auth.middleware');
// const { authorize } = require('../middlewares/role.middleware');
// const { authLimiter } = require('../middlewares/rateLimiter');
// const { upload } = require('../services/upload.service');

// const router = express.Router();

// // Public routes with rate limiting
// router.post('/register', authLimiter, register);
// router.post('/verify-email', authLimiter, verifyEmail);
// router.post('/resend-otp', authLimiter, resendOTP);
// router.post('/login', authLimiter, login);
// router.post('/google', authLimiter, googleLogin);
// router.post('/refresh-token', refreshToken);
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);

// // Protected routes
// router.get('/me', protect, getMe);
// router.post('/logout', protect, logout);
// router.post('/profile-image', protect, upload.single('file'), uploadProfileImage);

// // Bookmarks routes
// router.get('/bookmarks', protect, getBookmarks);
// router.post('/bookmarks', protect, addBookmark);
// router.delete('/bookmarks/:questionId', protect, removeBookmark);

// // Admin User Management routes
// router.get('/users', protect, authorize('admin'), getAllUsers);
// router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);
// router.delete('/users/:id', protect, authorize('admin'), deleteUser);

// module.exports = router;



const express = require('express');
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/verify-email', authLimiter, authController.verifyEmail);
router.post('/resend-otp', authLimiter, authController.resendOTP);

module.exports = router;