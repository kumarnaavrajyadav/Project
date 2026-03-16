// In-memory OTP store with TTL (5 minutes)
const otpStore = new Map();
const pendingRegistrations = new Map(); // regToken -> { contact, type, expiresAt }
const OTP_TTL_MS = 5 * 60 * 1000;
const REG_TTL_MS = 10 * 60 * 1000; // 10 min to complete registration
const crypto = require('crypto');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const storeOtp = (contact, otp) => {
  otpStore.set(contact, { otp, expiresAt: Date.now() + OTP_TTL_MS });
};

// Issue a temporary registration token for verified new users
const createPendingRegistration = (contact, type) => {
  const token = crypto.randomBytes(16).toString('hex');
  pendingRegistrations.set(token, { contact, type, expiresAt: Date.now() + REG_TTL_MS });
  return token;
};

// Consume a pending registration token (single use)
const consumePendingRegistration = (token) => {
  const record = pendingRegistrations.get(token);
  if (!record || Date.now() > record.expiresAt) return null;
  pendingRegistrations.delete(token);
  return record;
};

const verifyOtpCode = (contact, code) => {
  const record = otpStore.get(contact);
  if (!record) return { valid: false, reason: 'OTP not found or expired' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(contact);
    return { valid: false, reason: 'OTP has expired' };
  }
  if (record.otp !== code) return { valid: false, reason: 'Incorrect OTP' };
  otpStore.delete(contact);
  return { valid: true };
};

// Cleanup expired tokens every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (now > val.expiresAt) otpStore.delete(key);
  }
  for (const [key, val] of pendingRegistrations.entries()) {
    if (now > val.expiresAt) pendingRegistrations.delete(key);
  }
}, 60000);

module.exports = { generateOtp, storeOtp, verifyOtpCode, createPendingRegistration, consumePendingRegistration };
