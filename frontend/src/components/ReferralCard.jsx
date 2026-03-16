import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function ReferralCard() {
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API}/users/referral-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(data);
      } catch (err) {
        console.error('Referral stats error:', err);
      }
    };
    fetchStats();
  }, []);

  const handleCopy = () => {
    if (!stats?.referralLink) return;
    navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share && stats?.referralLink) {
      try {
        await navigator.share({
          title: 'Join me on FriendConnect!',
          text: `Hey! I'm using FriendConnect to chat. Join me using my invite link 🎉`,
          url: stats.referralLink,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  if (!stats) return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-700/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎁</span>
        <h3 className="font-bold text-gray-800 dark:text-white text-sm">Invite Friends</h3>
        <span className="ml-auto bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-full">
          {stats.referredCount} invited
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Share your link and grow your friend circle!
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700 mb-3">
        <code className="text-xs text-indigo-600 dark:text-indigo-400 break-all block">
          {stats.referralLink}
        </code>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900'
          }`}
        >
          {copied ? '✓ Copied!' : '📋 Copy Link'}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 text-xs font-semibold py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition-all"
        >
          🚀 Share
        </button>
      </div>
    </div>
  );
}
