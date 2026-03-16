import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api';
const BACKEND = API === '/api' ? '' : API.replace('/api', '');

export default function ProfileImageUpload({ onUpdate }) {
  const { dbUser, setDbUser } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const getAvatarUrl = () => {
    if (preview) return preview;
    if (dbUser?.profilePicture?.startsWith('/uploads/')) return `${BACKEND}${dbUser.profilePicture}`;
    return dbUser?.profilePicture || null;
  };

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(`${API}/users/profile/picture`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setDbUser(prev => ({ ...prev, profilePicture: data.profilePicture }));
      if (onUpdate) onUpdate(data.profilePicture);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const avatarUrl = getAvatarUrl();
  const initials = dbUser?.fullName ? dbUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  return (
    <div className="w-full h-full relative cursor-pointer group" onClick={() => fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
          {initials}
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        {uploading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-white text-lg">📷</span>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}
