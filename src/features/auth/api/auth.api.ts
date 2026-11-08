import { axiosInstance } from '../../../lib/axios';

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  confirmationPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  access_token?: string;
  refresh_token?: string;
  user?: {
    _id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
    profilePicture?: { secure_url?: string };
    image?: { secure_url?: string };
    coverPictures?: { secure_url?: string }[];
    bio?: string;
  };
  data?: {
    access_token?: string;
    refresh_token?: string;
    user?: {
      _id: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      email: string;
      role: string;
      profilePicture?: { secure_url?: string };
      image?: { secure_url?: string };
      coverPictures?: { secure_url?: string }[];
      bio?: string;
    };
  };
}

export const authApi = {
  signup: (payload: SignupPayload): Promise<AuthResponse> => {
    return axiosInstance.post('/auth/signup', payload);
  },

  login: (payload: LoginPayload): Promise<AuthResponse> => {
    return axiosInstance.post('/auth/login', payload);
  },

  confirmEmail: (email: string, code: string): Promise<{ message: string }> => {
    return axiosInstance.patch('/auth/confirmEmail', { email, code });
  },

  resendCode: (email: string): Promise<{ message: string }> => {
    return axiosInstance.patch('/auth/resend-code', { email });
  },

  forgotPassword: (email: string): Promise<{ message: string }> => {
    return axiosInstance.patch('/auth/forgot-password', { email });
  },

  resetPassword: (payload: { email: string; code: string; password: string; confirmationPassword: string }): Promise<{ message: string }> => {
    return axiosInstance.patch('/auth/reset-password', payload);
  },

  getProfile: (): Promise<any> => {
    return axiosInstance.get('/user/profile');
  },
};
