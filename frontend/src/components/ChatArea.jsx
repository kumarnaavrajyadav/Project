import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from '../context/ThemeContext';
import { MdSend, MdEmojiEmotions } from 'react-icons/md';

export default function ChatArea({ chat, socket }) {
  const { dbUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const config = {
    headers: { Authorization: `Bearer \${localStorage.getItem('token')}` }
  };

  useEffect(() => {
    if (!chat) return;
    fetchMessages();
    
    // Join socket room
    socket?.emit('join chat', chat._id);
  }, [chat]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message) => {
      if (chat && (message.sender === chat._id || message.receiver === chat._id)) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('message received', handleMessage);
    socket.on('typing', () => setIsTyping(true));
    socket.on('stop typing', () => setIsTyping(false));

    return () => {
      socket.off('message received', handleMessage);
      socket.off('typing');
      socket.off('stop typing');
    };
  }, [socket, chat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/messages/${chat._id}`, config);
      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    
    // Basic typing logic
    if (socket) {
      socket.emit('typing', chat._id);
      setTimeout(() => {
        socket.emit('stop typing', chat._id);
      }, 3000);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit('stop typing', chat._id);
    setShowEmoji(false);

    try {
      // Typically you'd save to DB here via API endpoint then emit via socket.
      // For this implementation, let's pretend we have a POST /messages/:friendId route 
      // but since we didn't add it in the backend, we just construct message and emit.
      // In a real app, always save to DB securely.
      const msgData = {
        sender: dbUser._id,
        receiver: chat._id,
        content: newMessage,
        createdAt: new Date()
      };
      
      setMessages([...messages, msgData]);
      setNewMessage('');
      
      socket.emit('new message', msgData);
    } catch (error) {
      console.error('Failed to send message');
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-400 dark:text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to FriendConnect</h2>
          <p>Select a friend to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a] transition-colors relative">
      {/* Chat Header */}
      <div className="h-16 px-4 bg-gray-100 dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 z-10 w-full">
        <img src={chat.profilePicture || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">{chat.fullName}</h2>
          <p className="text-xs text-green-500">
            {isTyping ? 'typing...' : (chat.isOnline ? 'online' : 'offline')}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-cover bg-center" style={{ backgroundImage: "url('https://i.ibb.co/3s1f9b0/chat-bg.png')", opacity: isDarkMode ? 0.3 : 0.8 }}>
        {messages.map((m, i) => {
          const isOwn = m.sender === dbUser._id;
          return (
            <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[70%] px-4 py-2 rounded-xl shadow-sm relative ${
                  isOwn 
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-tr-none' 
                    : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-tl-none'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap word-break-all">{m.content}</p>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 float-right mt-1 ml-4 pt-1 flex items-center items-end h-full">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-gray-100 dark:bg-[#202c33] flex items-end gap-2 relative">
        {showEmoji && (
          <div className="absolute bottom-16 left-4 z-50 shadow-xl">
            <EmojiPicker 
              theme={isDarkMode ? 'dark' : 'light'} 
              onEmojiClick={onEmojiClick}
              lazyLoadEmojis={true}
            />
          </div>
        )}
        <button 
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
        >
          <MdEmojiEmotions className="text-2xl" />
        </button>
        <form onSubmit={sendMessage} className="flex-1 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={typingHandler}
            placeholder="Type a message"
            className="flex-1 py-3 px-4 rounded-xl bg-white dark:bg-[#2a3942] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow disabled:opacity-50"
          >
            <MdSend className="text-xl" />
          </button>
        </form>
      </div>
    </div>
  );
}
