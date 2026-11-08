import { axiosInstance } from '../../../lib/axios';

export interface TicketMessage {
  _id?: string;
  sender?: {
    _id: string;
    username: string;
    email?: string;
    image?: { secure_url?: string };
  };
  senderRole: 'user' | 'admin' | 'system';
  senderName?: string;
  message: string;
  attachments?: { secure_url?: string; public_id?: string }[];
  createdAt: string;
}

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  requester?: {
    _id: string;
    username: string;
    email: string;
    image?: { secure_url?: string };
    role?: string;
    isDeleted?: boolean;
  };
  requesterEmail: string;
  requesterName?: string;
  type: 'content_report' | 'ban_appeal' | 'account_inquiry' | 'bug_report' | string;
  targetType: 'Post' | 'Comment' | 'User' | 'Group' | 'None' | string;
  targetId?: string;
  reason: string;
  subject: string;
  description?: string;
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed' | string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  assignedAdmin?: {
    _id: string;
    username: string;
    email: string;
  };
  resolutionAction?: string;
  resolutionNote?: string;
  messages: TicketMessage[];
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDecisionPayload {
  status: 'resolved' | 'dismissed' | 'in_review';
  replyMessage?: string;
  action?: 'none' | 'content_hidden' | 'content_deleted' | 'user_banned' | 'user_unbanned' | 'warning_issued';
  resolutionNote?: string;
}

export const supportApi = {
  // User creates a ticket / report
  createTicket: async (payload: {
    type?: string;
    targetType?: string;
    targetId?: string;
    reason: string;
    subject: string;
    description: string;
  }): Promise<{ ticket: SupportTicket }> => {
    const res = (await axiosInstance.post('/support/tickets', payload)) as any;
    return res.data || res;
  },

  // Public ban appeal (can be submitted when account is suspended/unauthenticated)
  submitAppeal: async (payload: {
    email: string;
    reason?: string;
    subject?: string;
    description: string;
  }): Promise<{ ticketNumber: string; message: string }> => {
    const res = (await axiosInstance.post('/support/appeal', payload)) as any;
    return res.data || res;
  },

  // Get user's tickets (Support Inbox)
  getMyTickets: async (page = 1, size = 20, status?: string): Promise<{ data: SupportTicket[]; count: number }> => {
    const statusParam = status ? `&status=${status}` : '';
    const res = (await axiosInstance.get(`/support/my-tickets?page=${page}&size=${size}${statusParam}`)) as any;
    const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.data?.data || []);
    const count = typeof res?.count === 'number' ? res.count : items.length;
    return { data: items, count };
  },

  // Get ticket details
  getTicketDetails: async (ticketId: string): Promise<{ ticket: SupportTicket }> => {
    const res = (await axiosInstance.get(`/support/tickets/${ticketId}`)) as any;
    return res.data || res;
  },

  // User adds message/reply to ticket
  replyTicket: async (ticketId: string, message: string): Promise<{ ticket: SupportTicket }> => {
    const res = (await axiosInstance.post(`/support/tickets/${ticketId}/reply`, { message })) as any;
    return res.data || res;
  },

  // Admin lists all tickets
  adminListTickets: async (params?: { page?: number; size?: number; status?: string; type?: string }): Promise<{ data: SupportTicket[]; count: number }> => {
    const page = params?.page || 1;
    const size = params?.size || 20;
    const statusParam = params?.status ? `&status=${params.status}` : '';
    const typeParam = params?.type ? `&type=${params.type}` : '';
    const res = (await axiosInstance.get(`/support/admin/tickets?page=${page}&size=${size}${statusParam}${typeParam}`)) as any;
    const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.data?.data || []);
    const count = typeof res?.count === 'number' ? res.count : items.length;
    return { data: items, count };
  },

  // Admin executes multi-action decision
  adminResolveTicket: async (ticketId: string, payload: TicketDecisionPayload): Promise<{ ticket: SupportTicket }> => {
    const res = (await axiosInstance.patch(`/support/admin/tickets/${ticketId}/decision`, payload)) as any;
    return res.data || res;
  }
};

