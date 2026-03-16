const nodemailer = require('nodemailer');
const { generateOtp, storeOtp, verifyOtpCode, createPendingRegistration, consumePendingRegistration } = require('../utils/otpStore');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Build email transporter (Gmail SMTP)
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// @desc   Send OTP to email or phone
// @route  POST /api/users/send-otp
// @access Public
const sendOtp = async (req, res) => {
  const { contact, type } = req.body; // type: 'email' | 'sms'

  if (!contact || !type) {
    return res.status(400).json({ message: 'contact and type are required' });
  }

  const otp = generateOtp();
  storeOtp(contact, otp);

  if (type === 'email') {
    const transporter = createTransporter();
    if (!transporter) {
      // Dev mode: return OTP in response (configure EMAIL_USER/EMAIL_PASS to send real email)
      console.log(`[DEV] OTP for ${contact}: ${otp}`);
      return res.json({
        message: 'OTP generated (email not configured — check server logs for OTP)',
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      });
    }

    try {
      await transporter.sendMail({
        from: `"FriendConnect" <${process.env.EMAIL_USER}>`,
        to: contact,
        subject: 'Your FriendConnect OTP',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border-radius:12px;border:1px solid #e5e7eb">
            <h2 style="color:#4f46e5">💬 FriendConnect</h2>
            <p>Your one-time password is:</p>
            <div style="font-size:40px;font-weight:bold;letter-spacing:8px;color:#4f46e5;text-align:center;padding:16px 0">${otp}</div>
            <p style="color:#6b7280;font-size:13px">This OTP expires in 5 minutes. Do not share it with anyone.</p>
          </div>
        `,
      });
      return res.json({ message: 'OTP sent to your email' });
    } catch (err) {
      console.error('Email send error:', err.message);
      return res.status(500).json({ message: 'Failed to send email OTP', error: err.message });
    }
  }

  if (type === 'sms') {
    try {
      const sid = process.env.TWILIO_SID;
      const token = process.env.TWILIO_TOKEN;
      const from = process.env.TWILIO_FROM;

      if (!sid || !token || !from) {
        console.log(`[DEV] SMS OTP for ${contact}: ${otp} (Twilio not configured)`);
        return res.json({
          message: 'OTP generated (SMS not configured — check server logs)',
          devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
        });
      }

      const twilioClient = require('twilio')(sid, token);
      await twilioClient.messages.create({
        body: `Your FriendConnect OTP: ${otp}`,
        from: from,
        to: contact.startsWith('+') ? contact : `+91${contact}`,
      });

      return res.json({ message: 'OTP sent to your phone' });
    } catch (err) {
      console.error('Twilio SMS error:', err.message);
      // Fallback: If Twilio fails (e.g. unverified number, invalid creds),
      // we still log the OTP so the developer isn't locked out, and return 200.
      console.log(`[DEV FALLBACK] SMS OTP for ${contact}: ${otp}`);
      return res.json({ 
        message: 'OTP generated (Twilio failed, check server logs)',
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }
  }

  return res.status(400).json({ message: 'Invalid type. Use "email" or "sms"' });
};

// @desc   Verify OTP and login / register user
// @route  POST /api/users/verify-otp
// @access Public
const verifyOtp = async (req, res) => {
  const { contact, otp, type, fullName, username, referralCode } = req.body;

  if (!contact || !otp) {
    return res.status(400).json({ message: 'contact and otp are required' });
  }

  const result = verifyOtpCode(contact, otp);
  if (!result.valid) {
    return res.status(400).json({ message: result.reason });
  }

  try {
    // Find existing user
    let user = type === 'email'
      ? await User.findOne({ email: contact })
      : await User.findOne({ phone: contact });

    if (user) {
      // Existing user — login
      user.isOnline = true;
      await user.save({ validateModifiedOnly: true });
      return res.json({
        token: generateToken(user._id),
        user: { _id: user._id, fullName: user.fullName, username: user.username, email: user.email, phone: user.phone, profilePicture: user.profilePicture, referralCode: user.referralCode },
        needsRegistration: false,
      });
    }

    // New user — need username and fullName to register
    if (!username || !fullName) {
      // Issue a temporary regToken so user can complete registration without re-verifying OTP
      const regToken = createPendingRegistration(contact, type);
      return res.json({ needsRegistration: true, regToken });
    }

    const taken = await User.findOne({ username });
    if (taken) return res.status(400).json({ message: 'Username is already taken' });

    // Handle referral
    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode });
    }

    const newUser = await User.create({
      fullName,
      username,
      // Use undefined (omit the field) instead of null so sparse index
      // doesn't get E11000 when multiple users have no email/phone
      ...(type === 'email' && contact ? { email: contact } : {}),
      ...(type === 'sms' && contact ? { phone: contact } : {}),
      isOnline: true,
      ...(referredByUser ? { referredBy: referredByUser._id } : {}),
    });

    return res.status(201).json({
      token: generateToken(newUser._id),
      user: { _id: newUser._id, fullName: newUser.fullName, username: newUser.username, email: newUser.email, phone: newUser.phone, profilePicture: newUser.profilePicture, referralCode: newUser.referralCode },
      needsRegistration: false,
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc   Complete OTP registration (username + fullName step)
// @route  POST /api/users/complete-otp-registration
// @access Public
const completeOtpRegistration = async (req, res) => {
  const { regToken, username, fullName, referralCode } = req.body;
  if (!regToken || !username || !fullName) {
    return res.status(400).json({ message: 'regToken, username and fullName are required' });
  }

  const pending = consumePendingRegistration(regToken);
  if (!pending) {
    return res.status(400).json({ message: 'Registration session expired. Please login again.' });
  }

  const { contact, type } = pending;
  try {
    const taken = await User.findOne({ username });
    if (taken) return res.status(400).json({ message: 'Username is already taken' });

    let referredByUser = null;
    if (referralCode) referredByUser = await User.findOne({ referralCode });

    const newUser = await User.create({
      fullName,
      username,
      ...(type === 'email' && contact ? { email: contact } : {}),
      ...(type === 'sms' && contact ? { phone: contact } : {}),
      isOnline: true,
      ...(referredByUser ? { referredBy: referredByUser._id } : {}),
    });

    return res.status(201).json({
      token: generateToken(newUser._id),
      user: { _id: newUser._id, fullName: newUser.fullName, username: newUser.username, email: newUser.email, phone: newUser.phone, profilePicture: newUser.profilePicture, referralCode: newUser.referralCode },
    });
  } catch (err) {
    console.error('completeOtpRegistration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { sendOtp, verifyOtp, completeOtpRegistration };
