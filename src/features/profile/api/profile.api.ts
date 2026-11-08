import { axiosInstance } from '../../../lib/axios';

export const profileApi = {
  getProfile: async () => {
    const res = await axiosInstance.get('/user/profile') as any;
    return res.data?.user || res.user;
  },

  updateProfile: async (data: { username?: string; phone?: string; address?: string; DOB?: string; gender?: string }) => {
    const res = await axiosInstance.patch('/user/profile', data) as any;
    return res.data?.user || res.user;
  },

  updateProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await axiosInstance.patch('/user/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as any;
    return res.data;
  },

  updateCoverImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await axiosInstance.patch('/user/profile/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as any;
    return res.data;
  },
};

