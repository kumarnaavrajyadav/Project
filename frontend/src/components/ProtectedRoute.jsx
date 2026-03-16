import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { dbUser, loading } = useAuth();

  // Still loading auth state — don't redirect yet
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // dbUser works for BOTH Google and Email/Phone OTP users
  if (!dbUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
