import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch or create user in MongoDB
        try {
          const token = await user.getIdToken();
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/users/auth`,
            {
              fullName: user.displayName,
              email: user.email,
              phone: user.phoneNumber,
              profilePicture: user.photoURL,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          setDbUser(response.data);
          // Save token for future API calls
          localStorage.setItem('token', token);
        } catch (error) {
          console.error("Error authenticating with backend:", error);
        }
      } else {
        setDbUser(null);
        localStorage.removeItem('token');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => {
    setDbUser(null);
    localStorage.removeItem('token');
    return firebaseSignOut(auth);
  };

  const value = {
    currentUser,
    dbUser,
    setDbUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
