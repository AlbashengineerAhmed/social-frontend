import { axiosInstance } from '../../../lib/axios';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  deletedUsers: number;
  totalPosts: number;
  totalComments: number;
  totalReports: number;
  totalGroups: number;
}

export interface AdminUser {
  _id: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'superAdmin' | string;
  confirmEmail: boolean;
  isDeleted: boolean;
  createdAt: string;
  image?: {
    secure_url?: string;
  };
  phone?: string;
}

export interface AdminPost {
  _id: string;
  id?: string;
  content: string;
  attachments?: { secure_url?: string; public_id?: string; _id?: string }[];
  likes?: string[];
  comments?: any[];
  shareCount?: number;
  privacy: string;
  isDeleted?: string | number | null;
  createdBy: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    image?: { secure_url?: string };
  };
  createdAt: string;
}

export interface AdminReport {
  _id: string;
  id?: string;
  targetType: 'User' | 'Post' | 'Comment' | string;
  targetId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected' | string;
  reviewNote?: string;
  reporter: {
    _id: string;
    username: string;
    email: string;
  };
  reviewedBy?: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
}

export interface AdminGroup {
  _id: string;
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  privacy: 'public' | 'private' | string;
  category?: string;
  membersCount?: number;
  postsCount?: number;
  createdBy?: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    image?: { secure_url?: string };
  };
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  size: number;
}

export const normalizePaginatedResult = <T>(res: any): PaginatedResult<T> => {
  if (!res) {
    return { data: [], count: 0, page: 1, size: 15 };
  }

  // If res is an array directly
  if (Array.isArray(res)) {
    return { data: res, count: res.length, page: 1, size: res.length };
  }

  // If res.data is an array (Standard response shape: { message: "Done", data: [...], count: 14, page: 1, size: 15 })
  if (Array.isArray(res.data)) {
    return {
      data: res.data,
      count: typeof res.count === 'number' ? res.count : (typeof res.total === 'number' ? res.total : res.data.length),
      page: Number(res.page) || 1,
      size: Number(res.size) || res.data.length
    };
  }

  // If res.posts is an array
  if (Array.isArray(res.posts)) {
    return {
      data: res.posts,
      count: typeof res.count === 'number' ? res.count : res.posts.length,
      page: Number(res.page) || 1,
      size: Number(res.size) || res.posts.length
    };
  }

  // If res.data.data is an array (nested)
  if (Array.isArray(res.data?.data)) {
    return {
      data: res.data.data,
      count: typeof res.data.count === 'number' ? res.data.count : (typeof res.count === 'number' ? res.count : res.data.data.length),
      page: Number(res.data.page || res.page) || 1,
      size: Number(res.data.size || res.size) || res.data.data.length
    };
  }

  // If res.data.posts is an array
  if (Array.isArray(res.data?.posts)) {
    return {
      data: res.data.posts,
      count: typeof res.data.count === 'number' ? res.data.count : (typeof res.count === 'number' ? res.count : res.data.posts.length),
      page: Number(res.data.page || res.page) || 1,
      size: Number(res.data.size || res.size) || res.data.posts.length
    };
  }

  return { data: [], count: 0, page: 1, size: 15 };
};

export const adminApi = {
  // Dashboard metrics
  getDashboard: async (): Promise<{ stats: AdminStats }> => {
    const res = (await axiosInstance.get('/admin/dashboard')) as any;
    const stats = res?.stats || res?.data?.stats || res?.data || res;
    return {
      stats: {
        totalUsers: stats.totalUsers || 0,
        activeUsers: stats.activeUsers || 0,
        deletedUsers: stats.deletedUsers || 0,
        totalPosts: stats.totalPosts || 0,
        totalComments: stats.totalComments || 0,
        totalReports: stats.totalReports || 0,
        totalGroups: stats.totalGroups || 0
      }
    };
  },

  // User Management
  getUsers: async (params?: { page?: number; size?: number; search?: string }): Promise<PaginatedResult<AdminUser>> => {
    const searchParam = params?.search ? `&search=${encodeURIComponent(params.search)}` : '';
    const page = params?.page || 1;
    const size = params?.size || 15;
    const res = (await axiosInstance.get(`/admin/users?page=${page}&size=${size}${searchParam}`)) as any;
    return normalizePaginatedResult<AdminUser>(res);
  },

  getUserDetails: async (userId: string): Promise<{ user: AdminUser }> => {
    const res = (await axiosInstance.get(`/admin/users/${userId}`)) as any;
    return res.data || res;
  },

  banUser: async (userId: string): Promise<any> => {
    return axiosInstance.patch(`/admin/users/${userId}/ban`);
  },

  unbanUser: async (userId: string): Promise<any> => {
    return axiosInstance.patch(`/admin/users/${userId}/unban`);
  },

  changeUserRole: async (userId: string, role: string): Promise<any> => {
    return axiosInstance.patch(`/admin/users/${userId}/role`, { role });
  },

  deleteUser: async (userId: string): Promise<any> => {
    return axiosInstance.delete(`/admin/users/${userId}`);
  },

  // Content Management (Posts & Comments)
  getPosts: async (params?: { page?: number; size?: number }): Promise<PaginatedResult<AdminPost>> => {
    const page = params?.page || 1;
    const size = params?.size || 15;
    const res = (await axiosInstance.get(`/admin/posts?page=${page}&size=${size}`)) as any;
    return normalizePaginatedResult<AdminPost>(res);
  },

  hidePost: async (postId: string): Promise<any> => {
    return axiosInstance.patch(`/admin/posts/${postId}/hide`);
  },

  unhidePost: async (postId: string): Promise<any> => {
    return axiosInstance.patch(`/admin/posts/${postId}/unhide`);
  },

  deletePost: async (postId: string): Promise<any> => {
    return axiosInstance.delete(`/admin/posts/${postId}`);
  },

  deleteComment: async (commentId: string): Promise<any> => {
    return axiosInstance.delete(`/admin/comments/${commentId}`);
  },

  // Reports Management
  getReports: async (params?: { page?: number; size?: number; status?: string }): Promise<PaginatedResult<AdminReport>> => {
    const statusParam = params?.status ? `&status=${params.status}` : '';
    const page = params?.page || 1;
    const size = params?.size || 15;
    const res = (await axiosInstance.get(`/admin/reports?page=${page}&size=${size}${statusParam}`)) as any;
    return normalizePaginatedResult<AdminReport>(res);
  },

  reviewReport: async (reportId: string, payload: { status: string; reviewNote?: string }): Promise<any> => {
    return axiosInstance.patch(`/admin/reports/${reportId}`, payload);
  },

  // Groups Management
  getGroups: async (params?: { page?: number; size?: number; search?: string }): Promise<PaginatedResult<AdminGroup>> => {
    const searchParam = params?.search ? `&search=${encodeURIComponent(params.search)}` : '';
    const page = params?.page || 1;
    const size = params?.size || 15;
    const res = (await axiosInstance.get(`/admin/groups?page=${page}&size=${size}${searchParam}`)) as any;
    return normalizePaginatedResult<AdminGroup>(res);
  },

  deleteGroup: async (groupId: string): Promise<any> => {
    return axiosInstance.delete(`/admin/groups/${groupId}`);
  }
};
