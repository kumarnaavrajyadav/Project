const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Sync a Firebase-authenticated user with the local DB and issue a JWT
// @route   POST /api/users/firebase-auth
// @access  Public (Firebase token passed from frontend)
const firebaseAuthSync = async (req, res) => {
  const { firebaseUid, email, phone, fullName, profilePicture, username } = req.body;

  if (!firebaseUid) {
    return res.status(400).json({ message: 'firebaseUid is required' });
  }

  try {
    // Look for existing user by firebaseUid, email, or phone
    let user = await User.findOne({ firebaseUid });

    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        user.firebaseUid = firebaseUid;
        await user.save({ validateModifiedOnly: true });
      }
    }

    if (!user && phone) {
      user = await User.findOne({ phone });
      if (user) {
        user.firebaseUid = firebaseUid;
        await user.save({ validateModifiedOnly: true });
      }
    }

    if (user) {
      // Existing user — just return token + user
      user.isOnline = true;
      await user.save({ validateModifiedOnly: true });

      return res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture,
          isOnline: user.isOnline,
          needsRegistration: false,
        },
      });
    }

    // New user — must supply a username
    if (!username) {
      return res.status(200).json({
        needsRegistration: true,
        message: 'Username required to complete registration',
      });
    }

    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const newUser = await User.create({
      firebaseUid,
      fullName: fullName || 'User',
      username,
      // Use undefined (not null) so the field is OMITTED from the document.
      // MongoDB sparse index skips missing fields but DOES index explicit null,
      // which would cause E11000 when multiple users have no phone/email.
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      profilePicture: profilePicture || '',
      isOnline: true,
    });

    return res.status(201).json({
      token: generateToken(newUser._id),
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        profilePicture: newUser.profilePicture,
        isOnline: newUser.isOnline,
        needsRegistration: false,
      },
    });
  } catch (error) {
    console.error('firebaseAuthSync error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { fullName, username, phone, email, password, profilePicture } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const user = await User.create({
      fullName,
      username,
      phone,
      email,
      password,
      profilePicture: profilePicture || '',
      isOnline: true,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        isOnline: user.isOnline,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      user.isOnline = true;
      await user.save({ validateBeforeSave: false }); // skip validators if any

      res.json({
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        isOnline: user.isOnline,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
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

// @desc    Upload profile picture
// @route   PUT /api/users/profile/picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: imageUrl },
      { new: true }
    ).select('-password');
    res.json({ message: 'Profile picture updated', profilePicture: imageUrl, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get referral stats for current user
// @route   GET /api/users/referral-stats
// @access  Private
const getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode username');
    const referredCount = await User.countDocuments({ referredBy: req.user._id });
    res.json({
      referralCode: user.referralCode,
      referralLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?ref=${user.referralCode}`,
      referredCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser, searchUsers, getUserProfile, firebaseAuthSync, uploadProfilePicture, getReferralStats };

