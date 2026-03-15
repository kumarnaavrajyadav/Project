import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';

const ENDPOINT = import.meta.env.VITE_API_URL.replace('/api', '');

export default function Dashboard() {
  const { dbUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    if (dbUser) {
      const newSocket = io(ENDPOINT);
      setSocket(newSocket);

      newSocket.emit('setup', dbUser);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [dbUser]);

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-900 overflow-hidden font-sans">
      <Sidebar onSelectChat={setSelectedChat} />
      <ChatArea chat={selectedChat} socket={socket} />
    </div>
  );
}
