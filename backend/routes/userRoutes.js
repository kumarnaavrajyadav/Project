const express = require('express');
const router = express.Router();
const {
  registerUser, loginUser, searchUsers, getUserProfile,
  firebaseAuthSync, uploadProfilePicture, getReferralStats
} = require('../controllers/userController');
const { sendOtp, verifyOtp, completeOtpRegistration } = require('../controllers/otpController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Firebase OAuth sync (Google)
router.post('/firebase-auth', firebaseAuthSync);

// Local auth
router.post('/register', registerUser);
router.post('/login', loginUser);

// Backend OTP (email / SMS)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-otp-registration', completeOtpRegistration);

// Protected routes
router.get('/search', protect, searchUsers);
router.get('/profile', protect, getUserProfile);
router.get('/referral-stats', protect, getReferralStats);
router.put('/profile/picture', protect, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;
