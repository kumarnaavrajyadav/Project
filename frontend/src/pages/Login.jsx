import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, provider, signInWithPopup } from '../firebase';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

export default function Login() {
  const { syncWithBackend } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';

  const [mode, setMode] = useState('main'); // main | email | phone | otp
  const [contact, setContact] = useState('');
  const [otpType, setOtpType] = useState('email'); // email | sms
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Google Sign-In ──────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const data = await syncWithBackend(result.user);
      navigate(data?.needsRegistration ? '/register' : '/dashboard');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') setError('Popup closed. Try again.');
      else setError(err.message || 'Google sign-in failed.');
    } finally { setLoading(false); }
  };

  // ── Backend OTP: Send ───────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = contact.trim();
    if (!trimmed) return setError('Enter your email or phone number');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/users/send-otp`, { contact: trimmed, type: otpType });
      // In dev mode, OTP is returned but not shown on screen - check browser console
      setMode('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // ── Backend OTP: Verify ─────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) return setError('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/users/verify-otp`, {
        contact: contact.trim(),
        otp,
        type: otpType,
      });
      if (res.data.needsRegistration) {
        // Save regToken so Register.jsx can complete registration
        sessionStorage.setItem('regToken', res.data.regToken);
        sessionStorage.setItem('regContact', contact.trim());
        navigate('/register');
      } else {
        localStorage.setItem('token', res.data.token);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden transition-colors">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

      <div className="max-w-md w-full m-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 z-10 border border-white/20 dark:border-gray-700/50">
        <div className="text-center mb-9">
          <div className="text-5xl mb-3">💬</div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">FriendConnect</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Connect and chat with your friends</p>
          {refCode && (
            <div className="mt-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-2 rounded-xl">
              🎉 You were invited! Referral code: <strong>{refCode}</strong>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 mb-5 rounded-md text-sm">{error}</div>
        )}

        {/* ── Main ── */}
        {mode === 'main' && (
          <div className="space-y-4">
            <button onClick={handleGoogleLogin} disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl py-3.5 font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm disabled:opacity-70">
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.2H42V20H24v8h11.3C33.6 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.9 29.3 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.6-.4-3.8z"/>
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.9 29.3 5 24 5c-7.6 0-14.2 4.1-17.7 9.7z"/>
                <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 36.3 26.8 37 24 37c-5.3 0-9.6-3.2-11.3-7.8L6 34c3.4 6.2 10 10.4 18 10.4z"/>
                <path fill="#1976D2" d="M43.6 20.2H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C40.9 36 44 31 44 25c0-1.3-.1-2.6-.4-3.8z"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
              <span className="mx-4 text-gray-400 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
            </div>
            <button onClick={() => { setOtpType('email'); setMode('email'); setError(''); }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3.5 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
              📧 Sign in with Email OTP
            </button>
            <button onClick={() => { setOtpType('sms'); setMode('phone'); setError(''); }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-3.5 font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md">
              📱 Sign in with Phone OTP
            </button>
          </div>
        )}

        {/* ── Email input ── */}
        {mode === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <input type="email" value={contact} onChange={e => setContact(e.target.value)} placeholder="you@example.com"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3.5 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-70">
              {loading ? 'Sending...' : 'Send OTP to Email'}
            </button>
            <button type="button" onClick={() => { setMode('main'); setError(''); }} className="w-full text-sm text-gray-500 hover:text-blue-500">← Back</button>
          </form>
        )}

        {/* ── Phone input ── */}
        {mode === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300">+91</span>
                <input type="tel" value={contact} onChange={e => setContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number" className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-3.5 font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-70">
              {loading ? 'Sending...' : 'Send OTP to Phone'}
            </button>
            <button type="button" onClick={() => { setMode('main'); setError(''); }} className="w-full text-sm text-gray-500 hover:text-purple-500">← Back</button>
          </form>
        )}

        {/* ── OTP verification ── */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              OTP sent to <strong>{otpType === 'sms' ? `+91${contact}` : contact}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Enter OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="------" maxLength={6}
                className="block w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3.5 font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-70">
              {loading ? 'Verifying...' : 'Verify OTP ✓'}
            </button>
            <button type="button" onClick={() => { setMode(otpType === 'email' ? 'email' : 'phone'); setOtp(''); setDevOtp(''); setError(''); }}
              className="w-full text-sm text-gray-500 hover:text-blue-500">← Resend OTP</button>
          </form>
        )}
      </div>
    </div>
  );
}
