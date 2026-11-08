import { axiosInstance } from '../../../lib/axios';

export interface ChatMessage {
  _id?: string;
  id?: string | number;
  conversationId?: string;
  senderId: string | { _id: string; username?: string; profilePicture?: any };
  recipientId?: string;
  text: string;
  createdAt?: string;
  time?: string;
  sender?: 'me' | 'them';
}

export interface ConversationItem {
  _id: string;
  participants: Array<{
    _id: string;
    username: string;
    email: string;
    image?: { secure_url?: string };
    profilePicture?: { secure_url?: string };
  }>;
  lastMessage?: {
    text: string;
    createdAt: string;
  };
  updatedAt: string;
}

export const chatApi = {
  getConversations: async (): Promise<ConversationItem[]> => {
    const res = await axiosInstance.get('/chat/conversations') as any;
    return res.data?.conversations || res.conversations || [];
  },

  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const res = await axiosInstance.get(`/chat/${conversationId}/messages`) as any;
    return res.data?.messages || res.messages || [];
  },

  sendMessage: async (recipientId: string, text: string) => {
    return await axiosInstance.post('/chat/message', { recipientId, text });
  },
};

