import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../stores/toastStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors, expired tokens, and extract validation details
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data;
    let message = data?.message || data?.err || error.message || 'Network Error';

    // Detect expired JWT tokens or unauthorized sessions
    const isTokenExpired =
      message?.toLowerCase()?.includes('jwt expired') ||
      data?.error?.name === 'TokenExpiredError' ||
      data?.error?.message?.toLowerCase()?.includes('jwt expired') ||
      message?.toLowerCase()?.includes('token expired') ||
      error.response?.status === 401;

    if (isTokenExpired) {
      // Clear authenticated state and tokens
      useAuthStore.getState().logout();

      // Only alert and redirect if not already on the sign-in page
      if (!window.location.pathname.includes('/sign-in') && !window.location.pathname.includes('/sign-up')) {
        toast.warning('Your session has expired. Please sign in again.', 'Session Expired');
        window.location.href = '/sign-in';
      }
    }

    const isBanned =
      message?.toLowerCase()?.includes('banned') ||
      message?.toLowerCase()?.includes('suspended');

    if (isBanned) {
      useAuthStore.getState().logout();
      if (!window.location.pathname.includes('/sign-in')) {
        toast.error(message, 'Account Suspended');
        window.location.href = '/sign-in';
      }
    }

    // If backend returns Joi validation details array, format a user-friendly message
    if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
      message = data.details
        .map((d: { message: string }) => {
          let text = d.message ? d.message.replace(/['"]/g, '') : '';
          if (text.includes('fails to match the required pattern') || text.includes('(?=')) {
            if (text.toLowerCase().includes('password')) {
              return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number';
            }
            return 'Invalid input format';
          }
          return text;
        })
        .filter(Boolean)
        .join(', ');
    } else if (typeof message === 'string' && (message.includes('fails to match the required pattern') || message.includes('(?='))) {
      if (message.toLowerCase().includes('password')) {
        message = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number';
      } else {
        message = 'Invalid input format';
      }
    }

    return Promise.reject(new Error(message));
  }
);
