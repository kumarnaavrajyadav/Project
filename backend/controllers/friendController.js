const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

// @desc    Send Friend Request
// @route   POST /api/friends/request
// @access  Private
const sendFriendRequest = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  if (senderId.toString() === receiverId) {
    return res.status(400).json({ message: "You can't send a friend request to yourself" });
  }

  try {
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if they are already friends
    if (req.user.friends.includes(receiverId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if a request already exists
    const existingReq = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ],
      status: 'pending'
    });

    if (existingReq) {
      return res.status(400).json({ message: 'Friend request already pending' });
    }

    const newRequest = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Accept Friend Request
// @route   POST /api/friends/accept
// @access  Private
const acceptFriendRequest = async (req, res) => {
  const { requestId } = req.body;

  try {
    const friendReq = await FriendRequest.findById(requestId);

    if (!friendReq || friendReq.status !== 'pending') {
      return res.status(404).json({ message: 'Friend request not found or not pending' });
    }

    if (friendReq.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    friendReq.status = 'accepted';
    await friendReq.save();

    // Add each to the other's friends array
    await User.findByIdAndUpdate(friendReq.sender, { $addToSet: { friends: friendReq.receiver } });
    await User.findByIdAndUpdate(friendReq.receiver, { $addToSet: { friends: friendReq.sender } });

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reject Friend Request
// @route   POST /api/friends/reject
// @access  Private
const rejectFriendRequest = async (req, res) => {
  const { requestId } = req.body;

  try {
    const friendReq = await FriendRequest.findById(requestId);

    if (!friendReq || friendReq.status !== 'pending') {
      return res.status(404).json({ message: 'Friend request not found or not pending' });
    }

    if (friendReq.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    friendReq.status = 'rejected';
    await friendReq.save();

    res.status(200).json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all pending requests for the current user
// @route   GET /api/friends/requests
// @access  Private
const getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({ receiver: req.user._id, status: 'pending' })
      .populate('sender', 'fullName username profilePicture');
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getPendingRequests };
