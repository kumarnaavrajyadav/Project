import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase user
  const [dbUser, setDbUser] = useState(null);            // Our DB user
  const [loading, setLoading] = useState(true);

  // ── Load user from local JWT (used by email/phone OTP login) ─────────
  const loadFromLocalToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const { data } = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDbUser(data);
      return true;
    } catch {
      localStorage.removeItem('token');
      return false;
    }
  };

  // ── Sync Firebase user with backend → get local JWT ───────────────────
  const syncWithBackend = async (firebaseUser, extraData = {}) => {
    if (!firebaseUser) return null;
    try {
      const firebaseToken = await firebaseUser.getIdToken();
      const payload = {
        firebaseUid: firebaseUser.uid,
        ...(firebaseUser.email ? { email: firebaseUser.email } : {}),
        ...(firebaseUser.phoneNumber ? { phone: firebaseUser.phoneNumber } : {}),
        fullName: firebaseUser.displayName || extraData.fullName || 'User',
        profilePicture: firebaseUser.photoURL || '',
        ...extraData,
      };
      const { data } = await axios.post(`${API_URL}/users/firebase-auth`, payload, {
        headers: { Authorization: `Bearer ${firebaseToken}` },
      });
      if (data.needsRegistration) return { needsRegistration: true };
      localStorage.setItem('token', data.token);
      setDbUser(data.user);
      return data;
    } catch (err) {
      console.error('Failed to sync with backend:', err.response?.data || err.message);
      throw err;
    }
  };

  // ── Auth state listener ───────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Google / Firebase user
        setCurrentUser(firebaseUser);
        const token = localStorage.getItem('token');
        if (token) {
          // Try existing local JWT first
          const loaded = await loadFromLocalToken();
          if (!loaded) {
            // JWT expired, re-sync
            try { await syncWithBackend(firebaseUser); } catch { setDbUser(null); }
          }
        } else {
          // No local JWT, sync with Firebase
          try { await syncWithBackend(firebaseUser); } catch { setDbUser(null); }
        }
      } else {
        // No Firebase user, but may have a local JWT (email/phone OTP session)
        setCurrentUser(null);
        const loaded = await loadFromLocalToken();
        if (!loaded) {
          // Truly not logged in
          setDbUser(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    try { await firebaseSignOut(auth); } catch {}
    localStorage.removeItem('token');
    setCurrentUser(null);
    setDbUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, dbUser, setDbUser, syncWithBackend, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
