const express = require('express');
const router = express.Router();
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests
} = require('../controllers/friendController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, sendFriendRequest);
router.post('/accept', protect, acceptFriendRequest);
router.post('/reject', protect, rejectFriendRequest);
router.get('/requests', protect, getPendingRequests);

module.exports = router;
