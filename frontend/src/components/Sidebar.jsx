import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaSearch, FaUserPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { IoMdPersonAdd } from 'react-icons/io';
import { MdCheck, MdClose } from 'react-icons/md';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ onSelectChat }) {
  const { dbUser, logout } = useAuth();
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends'); // friends, search, requests

  const config = {
    headers: { Authorization: `Bearer \${localStorage.getItem('token')}` }
  };

  useEffect(() => {
    fetchProfile();
    fetchRequests();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/users/profile`, config);
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/friends/requests`, config);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/users/search?q=${searchQuery}`, config);
      setSearchResults(data);
      setActiveTab('search');
    } catch (error) {
      console.error('Error searching users', error);
    }
  };

  const sendRequest = async (receiverId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/friends/request`, { receiverId }, config);
      alert('Request sent');
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending request');
    }
  };

  const handleRequest = async (requestId, action) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/friends/${action}`, { requestId }, config);
      fetchRequests();
      if (action === 'accept') fetchProfile();
    } catch (error) {
      console.error(`Error ${action} request`, error);
    }
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={dbUser?.profilePicture || 'https://via.placeholder.com/40'} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
          />
          <div className="hidden sm:block">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{dbUser?.fullName}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">@{dbUser?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 text-sm">
        <button 
          className={`flex-1 py-3 font-medium ${activeTab === 'friends' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </button>
        <button 
          className={`flex-1 py-3 font-medium relative ${activeTab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests
          {requests.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </form>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'friends' && (
          <div className="p-2 space-y-1">
            {friends.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">No friends yet.</p>
            ) : (
              friends.map(friend => (
                <div 
                  key={friend._id} 
                  onClick={() => onSelectChat(friend)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <img src={friend.profilePicture || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full object-cover" />
                    {friend.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{friend.fullName}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">@{friend.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="p-2 space-y-1">
            {searchResults.map(user => (
              <div key={user._id} className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <img src={user.profilePicture || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{user.fullName}</h4>
                  </div>
                </div>
                {!friends.find(f => f._id === user._id) ? (
                  <button onClick={() => sendRequest(user._id)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-full bg-blue-100 dark:bg-gray-800">
                    <IoMdPersonAdd />
                  </button>
                ) : (
                  <span className="text-xs text-green-500">Friend</span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="p-2 space-y-2">
            {requests.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">No pending requests.</p>
            ) : (
              requests.map(req => (
                <div key={req._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src={req.sender.profilePicture || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{req.sender.fullName}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleRequest(req._id, 'accept')} className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
                      <MdCheck />
                    </button>
                    <button onClick={() => handleRequest(req._id, 'reject')} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                      <MdClose />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button onClick={logout} className="w-full py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
          Logout
        </button>
      </div>
    </div>
  );
}
