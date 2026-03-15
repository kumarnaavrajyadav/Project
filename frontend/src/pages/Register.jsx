import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const { currentUser, setDbUser } = useAuth();
  const navigate = useNavigate();
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
      const token = await currentUser.getIdToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/auth`,
        {
          username: formData.username,
          fullName: formData.fullName,
          phone: currentUser.phoneNumber,
          email: currentUser.email,
          profilePicture: currentUser.photoURL,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setDbUser(response.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      
      <div className="max-w-md w-full m-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 z-10 border border-white/20 dark:border-gray-700/50">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Complete Profile
        </h2>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3.5 font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md transform hover:-translate-y-0.5 disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Finish Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
