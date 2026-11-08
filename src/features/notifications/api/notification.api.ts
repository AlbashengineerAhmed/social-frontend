import { axiosInstance } from '../../../lib/axios';

export interface NotificationItem {
  _id: string;
  id: string;
  type: 'follow' | 'like_post' | 'comment' | 'reply' | 'mention' | string;
  recipient: string;
  actor?: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    image?: { secure_url?: string };
    avatar?: string;
  };
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  message?: string;
  createdAt: string;
}

export const notificationApi = {
  getMyNotifications: async (page = 1, size = 30): Promise<NotificationItem[]> => {
    const res = await axiosInstance.get(`/notification?page=${page}&size=${size}`) as any;
    const items = res.data?.data || res.data?.docs || res.data?.notifications || res.docs || (Array.isArray(res.data) ? res.data : []);
    return Array.isArray(items) ? items : [];
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await axiosInstance.get('/notification/unread-count') as any;
    return typeof res.data === 'number' ? res.data : res.data?.count || res.count || 0;
  },

  markAllRead: async () => {
    return await axiosInstance.patch('/notification/read-all');
  },

  markAsRead: async (notificationId: string) => {
    return await axiosInstance.patch(`/notification/${notificationId}/read`);
  },

  deleteNotification: async (notificationId: string) => {
    return await axiosInstance.delete(`/notification/${notificationId}`);
  },
};

