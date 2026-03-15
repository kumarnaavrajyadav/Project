const User = require('../models/User');

// @desc    Register a new user or get existing user
// @route   POST /api/users/auth
// @access  Private (Firebase Token Required)
const authUser = async (req, res) => {
  const { fullName, username, phone, email, profilePicture } = req.body;
  const firebaseUid = req.user ? req.user.firebaseUid : req.firebaseUser.uid; // req.firebaseUser from unprotected token verify if we change middleware

  try {
    // Check if user exists
    let user = await User.findOne({ firebaseUid });

    if (user) {
      // User exists, just return them (login flow)
      return res.status(200).json(user);
    }

    // Check for username collision on registration
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    // Create new user (registration flow)
    user = await User.create({
      fullName: fullName || req.firebaseUser.name || 'New User',
      username,
      phone: phone || req.firebaseUser.phone_number,
      email: email || req.firebaseUser.email,
      profilePicture: profilePicture || req.firebaseUser.picture || '',
      firebaseUid,
      isOnline: true,
    });

    if (user) {
      res.status(201).json(user);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Search for users
// @route   GET /api/users/search?q=keyword
// @access  Private
const searchUsers = async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id } // Don't return the searcher
    })
    .select('fullName username profilePicture isOnline')
    .limit(10);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile/friends
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'friends',
      'fullName username profilePicture isOnline lastSeen'
    );

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authUser, searchUsers, getUserProfile };
