import { axiosInstance } from '../../../lib/axios';

export interface FriendUser {
  _id: string;
  id?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  image?: { secure_url?: string };
  avatar?: string;
  friendshipId?: string;
  since?: string;
}

export interface FriendRequestItem {
  _id: string;
  sender: FriendUser;
  receiver: FriendUser;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self';

export interface FriendshipStatusResponse {
  status: FriendshipStatus;
  requestId?: string;
  friendshipId?: string;
}

export const friendshipApi = {
  /**
   * Send friend request (Send Friend Request - إرسال طلب صداقة)
   */
  sendRequest: async (userId: string) => {
    const res = await axiosInstance.post(`/friendship/request/${userId}`) as any;
    return res.data?.friendship || res.friendship;
  },

  /**
   * Accept friend request (Accept Request - قبول طلب الصداقة)
   */
  acceptRequest: async (requestId: string) => {
    const res = await axiosInstance.patch(`/friendship/accept/${requestId}`) as any;
    return res.data?.friendship || res.friendship;
  },

  /**
   * Reject friend request (Reject Request - رفض الطلب)
   */
  rejectRequest: async (requestId: string) => {
    const res = await axiosInstance.patch(`/friendship/reject/${requestId}`) as any;
    return res.data?.friendship || res.friendship;
  },

  /**
   * Cancel sent friend request (Cancel Request - إلغاء طلب الصداقة المرسل)
   */
  cancelRequest: async (requestId: string) => {
    const res = await axiosInstance.delete(`/friendship/cancel/${requestId}`) as any;
    return res.data?.friendship || res.friendship;
  },

  /**
   * Remove friend (Remove Friend - إزالة صديق)
   */
  removeFriend: async (friendId: string) => {
    const res = await axiosInstance.delete(`/friendship/friend/${friendId}`) as any;
    return res.data;
  },

  /**
   * Get received pending requests (Received Requests - الطلبات الواردة)
   */
  getReceivedRequests: async (): Promise<FriendRequestItem[]> => {
    const res = await axiosInstance.get('/friendship/received') as any;
    return res.data?.requests || res.requests || [];
  },

  /**
   * Get sent pending requests (Sent Requests - الطلبات المرسلة)
   */
  getSentRequests: async (): Promise<FriendRequestItem[]> => {
    const res = await axiosInstance.get('/friendship/sent') as any;
    return res.data?.requests || res.requests || [];
  },

  /**
   * Get friends list (Friends - قائمة الأصدقاء)
   */
  getFriends: async (userId?: string): Promise<FriendUser[]> => {
    const path = userId ? `/friendship/friends/${userId}` : '/friendship/friends';
    const res = await axiosInstance.get(path) as any;
    return res.data?.friends || res.friends || [];
  },

  /**
   * Get friendship status with a specific user
   */
  getStatus: async (userId: string): Promise<FriendshipStatusResponse> => {
    const res = await axiosInstance.get(`/friendship/status/${userId}`) as any;
    return res.data || { status: 'none' };
  },
};

