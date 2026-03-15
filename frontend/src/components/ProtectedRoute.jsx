import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { currentUser, dbUser } = useAuth();

  // If there's no firebase user logged in at all, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If firebase user exists but not registered in backend, redirect to register
  if (currentUser && !dbUser) {
    return <Navigate to="/register" replace />;
  }

  // Allow access to protected route content
  return <Outlet />;
}
