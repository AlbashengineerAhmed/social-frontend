import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const ProtectedRoute: React.FC = () => {
  const { token, isAuthenticated } = useAuthStore();

  // If user is not authenticated or has no token, redirect to sign-in
  if (!isAuthenticated || !token) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute: React.FC = () => {
  const { token, isAuthenticated } = useAuthStore();

  // If user is already logged in, redirect away from sign-in / sign-up to home feed
  if (isAuthenticated && token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const AdminRoute: React.FC = () => {
  const { token, isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !token) {
    return <Navigate to="/sign-in" replace />;
  }

  const isAdmin = user?.isAdmin || user?.systemRole === 'admin' || user?.systemRole === 'superAdmin';
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

