import React, { useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';

// Expose useAuth pointing directly to the Zustand store for seamless compatibility
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    login: store.login,
    signup: store.signup,
    confirmEmail: store.confirmEmail,
    resendCode: store.resendCode,
    fetchProfile: store.fetchProfile,
    logout: store.logout,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchProfile();
    }
  }, [token, user, fetchProfile]);

  return <>{children}</>;
};
