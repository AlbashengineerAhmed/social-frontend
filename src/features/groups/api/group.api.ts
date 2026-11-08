import { axiosInstance } from '../../../lib/axios';

export interface Group {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  rules?: string;
  category: string;
  privacy: 'public' | 'private';
  visibility: 'visible' | 'hidden';
  membersCount: number;
  postsCount: number;
  avatar?: { secure_url?: string };
  cover?: { secure_url?: string };
  creator?: { _id: string; username: string; image?: { secure_url?: string } };
  isMember?: boolean;
  memberRole?: 'owner' | 'admin' | 'moderator' | 'member' | null;
  isPendingRequest?: boolean;
  createdAt?: string;
}

export const groupApi = {
  getGroups: async (
    params: { page?: number; size?: number; category?: string; search?: string } = {}
  ): Promise<{ groups: Group[]; count: number }> => {
    const { page = 1, size = 12, category, search } = params;
    let url = `/group?page=${page}&size=${size}`;
    if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = (await axiosInstance.get(url)) as any;

    const list =
      (Array.isArray(res?.groups) && res.groups) ||
      (Array.isArray(res?.data) && res.data) ||
      (Array.isArray(res?.posts) && res.posts) ||
      (Array.isArray(res?.data?.groups) && res.data.groups) ||
      (Array.isArray(res?.data?.data) && res.data.data) ||
      (Array.isArray(res) && res) ||
      [];

    const count =
      typeof res?.count === 'number'
        ? res.count
        : typeof res?.data?.count === 'number'
          ? res.data.count
          : list.length;

    return {
      groups: list,
      count
    };
  },

  getMyGroups: async (): Promise<Group[]> => {
    const res = (await axiosInstance.get('/group/my')) as any;
    const list =
      (Array.isArray(res?.groups) && res.groups) ||
      (Array.isArray(res?.data) && res.data) ||
      (Array.isArray(res?.data?.groups) && res.data.groups) ||
      (Array.isArray(res?.data?.data) && res.data.data) ||
      (Array.isArray(res) && res) ||
      [];
    return list;
  },

  getGroupById: async (groupId: string): Promise<Group> => {
    const res = (await axiosInstance.get(`/group/${groupId}`)) as any;
    return res?.group || res?.data?.group || res?.data || res;
  },

  createGroup: async (
    groupData: Partial<Group> & {
      cover?: string | { secure_url?: string };
      avatar?: string | { secure_url?: string };
    }
  ): Promise<Group> => {
    const res = (await axiosInstance.post('/group', groupData)) as any;
    return res?.group || res?.data?.group || res?.data || res;
  },

  toggleJoinGroup: async (
    groupId: string
  ): Promise<{ isMember: boolean; isPendingRequest: boolean; message: string }> => {
    const res = (await axiosInstance.post(`/group/${groupId}/join`)) as any;
    const data = res?.data || res;
    return {
      isMember: Boolean(data?.isMember),
      isPendingRequest: Boolean(data?.isPendingRequest),
      message: res?.message || data?.message || 'Updated membership'
    };
  },

  getGroupMembers: async (groupId: string, page = 1, size = 20): Promise<any> => {
    const res = (await axiosInstance.get(`/group/${groupId}/members?page=${page}&size=${size}`)) as any;
    return res.data || res;
  },

  getGroupPosts: async (groupId: string, page = 1, size = 10): Promise<any> => {
    const res = (await axiosInstance.get(`/group/${groupId}/posts?page=${page}&size=${size}`)) as any;
    const list =
      (Array.isArray(res?.posts) && res.posts) ||
      (Array.isArray(res?.data) && res.data) ||
      (Array.isArray(res?.data?.posts) && res.data.posts) ||
      (Array.isArray(res) && res) ||
      [];
    return { posts: list };
  },

  createGroupPost: async (groupId: string, content: string, mediaFile?: File): Promise<any> => {
    if (mediaFile) {
      const formData = new FormData();
      if (content.trim()) {
        formData.append('content', content.trim());
      }
      formData.append('attachments', mediaFile);
      const res = (await axiosInstance.post(`/group/${groupId}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })) as any;
      return res.data || res;
    }
    const res = (await axiosInstance.post(`/group/${groupId}/posts`, { content })) as any;
    return res.data || res;
  },

  updateGroupPost: async (postId: string, content: string): Promise<any> => {
    const res = (await axiosInstance.patch(`/post/${postId}`, { content })) as any;
    return res.data || res;
  },

  deleteGroupPost: async (postId: string): Promise<any> => {
    const res = (await axiosInstance.delete(`/post/${postId}`)) as any;
    return res.data || res;
  },

  updateGroup: async (
    groupId: string,
    data: Partial<Group> & { cover?: string; avatar?: string }
  ): Promise<Group> => {
    const res = (await axiosInstance.patch(`/group/${groupId}`, data)) as any;
    return res?.group || res?.data?.group || res?.data || res;
  },

  deleteGroup: async (groupId: string): Promise<any> => {
    const res = (await axiosInstance.delete(`/group/${groupId}`)) as any;
    return res.data || res;
  }
};
