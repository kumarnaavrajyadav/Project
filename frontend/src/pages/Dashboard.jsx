import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import ProfileImageUpload from '../components/ProfileImageUpload';
import ReferralCard from '../components/ReferralCard';

const ENDPOINT = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');
const API = import.meta.env.VITE_API_URL || '/api';

export default function Dashboard() {
  const { dbUser, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (dbUser) {
      const newSocket = io(ENDPOINT);
      setSocket(newSocket);
      newSocket.emit('setup', dbUser);
      // Listen for live friend requests → bump count
      newSocket.on('new friend request', () => setNotifCount(c => c + 1));
      return () => newSocket.disconnect();
    }
  }, [dbUser]);

  // Fetch pending friend request count on mount
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API}/friends/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifCount(Array.isArray(data) ? data.length : 0);
      } catch {}
    };
    if (dbUser) fetchNotifs();
  }, [dbUser]);

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-950 overflow-hidden font-sans">
      {/* Left sidebar */}
      <Sidebar onSelectChat={setSelectedChat} />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatArea chat={selectedChat} socket={socket} />
      </div>

      {/* Right panel */}
      <div className="hidden lg:flex w-72 flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto">

        {/* Profile section */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col items-center gap-3">

            {/* Profile image — perfectly fitted in circular frame */}
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-blue-500/30 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 flex-shrink-0">
              <ProfileImageUpload />
            </div>

            <div className="text-center">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{dbUser?.fullName || 'User'}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">@{dbUser?.username}</p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-500 font-medium">Online</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 w-full mt-1">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{dbUser?.friends?.length || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Friends</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">✓</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Verified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Card */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <ReferralCard />
        </div>

        {/* Quick actions */}
        <div className="p-4 space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>

          {/* Notifications button with live badge */}
          <button
            onClick={() => { setShowNotif(!showNotif); setNotifCount(0); }}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300"
          >
            <span className="relative">
              <span className="text-lg">🔔</span>
              {notifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </span>
            <span>Notifications</span>
          </button>

          {/* Notification dropdown */}
          {showNotif && (
            <div className="mx-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              {notifCount === 0
                ? '✓ No new notifications'
                : `You have pending friend requests. Check the "Requests" tab in the sidebar.`}
            </div>
          )}

          <button className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300">
            <span className="text-lg">⚙️</span> Settings
          </button>
          <button
            onClick={logout}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm text-red-500"
          >
            <span className="text-lg">🚪</span> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
