const Message = require('../models/Message');

// @desc    Get message history between current user and friend
// @route   GET /api/messages/:friendId
// @access  Private
const getMessages = async (req, res) => {
  const { friendId } = req.params;
  const currentUserId = req.user._id;

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: friendId },
        { sender: friendId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send a message to a friend
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const currentUserId = req.user._id;

  if (!receiverId || !content) {
    return res.status(400).json({ message: 'Receiver ID and content are required' });
  }

  try {
    const newMessage = await Message.create({
      sender: currentUserId,
      receiver: receiverId,
      content,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getMessages, sendMessage };
