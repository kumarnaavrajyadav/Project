const express = require('express');
const router = express.Router();
const { authUser, searchUsers, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const admin = require('../config/firebase');

// Special middleware for registration/login
// We don't use 'protect' because 'protect' assumes user already exists in MongoDB
const verifyFirebaseToken = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.firebaseUser = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, invalid Firebase token' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

router.post('/auth', verifyFirebaseToken, authUser);
router.get('/search', protect, searchUsers);
router.get('/profile', protect, getUserProfile);

module.exports = router;
