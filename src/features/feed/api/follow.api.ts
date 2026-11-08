import { axiosInstance } from '../../../lib/axios';

export interface UserSuggestion {
  _id: string;
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  isFollowing: boolean;
  createdAt?: string;
}

export const followApi = {
  getSuggestions: async (): Promise<UserSuggestion[]> => {
    const res = await axiosInstance.get('/user/suggestions') as any;
    return res.data?.users || res.users || [];
  },

  followUser: async (userId: string) => {
    return await axiosInstance.post(`/follow/${userId}`);
  },

  unfollowUser: async (userId: string) => {
    return await axiosInstance.delete(`/follow/${userId}`);
  },

  getFollowCounts: async (userId: string): Promise<{ followersCount: number; followingCount: number; postsCount: number }> => {
    const res = await axiosInstance.get(`/follow/${userId}/counts`) as any;
    const data = res.data || res;
    return {
      followersCount: data.followersCount ?? 0,
      followingCount: data.followingCount ?? 0,
      postsCount: data.postsCount ?? 0,
    };
  },
};

