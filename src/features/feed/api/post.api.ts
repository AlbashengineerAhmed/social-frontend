import { axiosInstance } from '../../../lib/axios';

export interface BackendPost {
  _id: string;
  content: string;
  attachments?: { secure_url?: string }[];
  userId: {
    _id: string;
    username: string;
    profilePicture?: { secure_url?: string };
    role?: string;
  };
  likes?: string[];
  commentsCount?: number;
  createdAt: string;
}

export const postApi = {
  getPosts: (page = 1, size = 10): Promise<{ message: string; data: { posts: BackendPost[]; count: number } }> => {
    return axiosInstance.get(`/post?page=${page}&size=${size}`);
  },

  getPublicFeed: (page = 1, limit = 10): Promise<{ message: string; data: { posts: BackendPost[]; total: number } }> => {
    return axiosInstance.get(`/feed/public?page=${page}&limit=${limit}`);
  },

  getFollowingFeed: (page = 1, limit = 10): Promise<{ message: string; data: { posts: BackendPost[]; total: number } }> => {
    return axiosInstance.get(`/feed?page=${page}&limit=${limit}`);
  },

  createPost: (content: string, file?: File, privacy = 'public'): Promise<{ message: string; post: BackendPost; data?: { post: BackendPost } }> => {
    if (file) {
      const formData = new FormData();
      if (content.trim()) {
        formData.append('content', content);
      }
      formData.append('privacy', privacy);
      formData.append('attachments', file);
      return axiosInstance.post('/post', formData);
    }

    return axiosInstance.post('/post', { content, privacy });
  },

  likePost: (postId: string, action: 'like' | 'unLike'): Promise<{ message: string; data: BackendPost }> => {
    return axiosInstance.patch(`/post/${postId}/like?action=${action}`);
  },

  addComment: (postId: string, content: string): Promise<any> => {
    return axiosInstance.post(`/post/${postId}/comment`, { content });
  },

  updatePost: (postId: string, content: string): Promise<any> => {
    return axiosInstance.patch(`/post/${postId}`, { content });
  },

  deletePost: (postId: string): Promise<any> => {
    return axiosInstance.delete(`/post/${postId}`);
  },

  reactToPost: (postId: string, type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'): Promise<any> => {
    return axiosInstance.post(`/reaction/post/${postId}`, { type });
  },

  removeReaction: (postId: string): Promise<any> => {
    return axiosInstance.delete(`/reaction/post/${postId}`);
  },

  getPostReactions: (postId: string): Promise<any> => {
    return axiosInstance.get(`/reaction/post/${postId}`);
  },

  sharePost: (postId: string, data: { content?: string; postType?: 'repost' | 'quote'; privacy?: string; groupId?: string }): Promise<any> => {
    return axiosInstance.post(`/post/share/${postId}`, data);
  },

  savePost: (postId: string): Promise<any> => {
    return axiosInstance.post(`/post/${postId}/save`);
  },

  unsavePost: (postId: string): Promise<any> => {
    return axiosInstance.delete(`/post/${postId}/save`);
  },

  hidePost: (postId: string): Promise<any> => {
    return axiosInstance.patch(`/post/${postId}/hide`);
  },

  unhidePost: (postId: string): Promise<any> => {
    return axiosInstance.patch(`/post/${postId}/unhide`);
  },

  getHiddenPosts: (page = 1, size = 10): Promise<any> => {
    return axiosInstance.get(`/post/hidden?page=${page}&size=${size}`);
  },

  getSavedPosts: (page = 1, size = 10): Promise<any> => {
    return axiosInstance.get(`/post/saved?page=${page}&size=${size}`);
  },

  getPostById: (postId: string): Promise<any> => {
    return axiosInstance.get(`/post/${postId}`);
  },
};
