import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Register() {
  const { currentUser, setDbUser, syncWithBackend } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';

  // Check for pending OTP registration (phone/email OTP new users)
  const regToken = sessionStorage.getItem('regToken') || '';
  const regContact = sessionStorage.getItem('regContact') || '';

  const [formData, setFormData] = useState({
    username: '',
    fullName: currentUser?.displayName || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.username || !formData.fullName) {
      return setError('Please fill all required fields');
    }

    try {
      setLoading(true);

      if (regToken) {
        // ── OTP user (email/phone) completing registration ─────────────
        const { data } = await axios.post(`${API_URL}/users/complete-otp-registration`, {
          regToken,
          username: formData.username,
          fullName: formData.fullName,
          referralCode,
        });
        localStorage.setItem('token', data.token);
        setDbUser(data.user);
        sessionStorage.removeItem('regToken');
        sessionStorage.removeItem('regContact');
        navigate('/dashboard');
      } else if (currentUser) {
        // ── Firebase (Google) user completing registration ─────────────
        await syncWithBackend(currentUser, {
          username: formData.username,
          fullName: formData.fullName,
        });
        navigate('/dashboard');
      } else {
        setError('Session expired. Please login again.');
        navigate('/login');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />

      <div className="max-w-md w-full m-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 z-10 border border-white/20 dark:border-gray-700/50">
        <div className="text-center mb-8">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-blue-200" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
              {formData.fullName ? formData.fullName[0].toUpperCase() : '?'}
            </div>
          )}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {currentUser?.email || regContact || 'Set up your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="@cooluser"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3.5 font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md transform hover:-translate-y-0.5 disabled:opacity-70"
          >
            {loading ? 'Setting up...' : '🚀 Finish & Enter FriendConnect'}
          </button>
        </form>
      </div>
    </div>
  );
}
