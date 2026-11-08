import { axiosInstance } from '../../../lib/axios';

export interface EventItem {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  category: string;
  startDate: string;
  endDate?: string;
  time: string;
  timeZone?: string;
  eventType: 'in_person' | 'online' | 'hybrid';
  location: string;
  address?: string;
  meetingUrl?: string;
  privacy: 'public' | 'private';
  cover?: { secure_url?: string };
  creator?: { _id: string; username: string; image?: { secure_url?: string } };
  attendeesCount: {
    going: number;
    interested: number;
    not_going: number;
  };
  myRsvp?: 'going' | 'interested' | 'not_going' | null;
  createdAt?: string;
}

export const eventApi = {
  getEvents: async (
    params: { page?: number; size?: number; category?: string; search?: string } = {}
  ): Promise<{ events: EventItem[]; count: number }> => {
    const { page = 1, size = 12, category, search } = params;
    let url = `/event?page=${page}&size=${size}`;
    if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = (await axiosInstance.get(url)) as any;

    const list =
      (Array.isArray(res?.events) && res.events) ||
      (Array.isArray(res?.data) && res.data) ||
      (Array.isArray(res?.posts) && res.posts) ||
      (Array.isArray(res?.data?.events) && res.data.events) ||
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
      events: list,
      count
    };
  },

  getMyEvents: async (): Promise<EventItem[]> => {
    const res = (await axiosInstance.get('/event/my')) as any;
    const list =
      (Array.isArray(res?.events) && res.events) ||
      (Array.isArray(res?.data) && res.data) ||
      (Array.isArray(res?.data?.events) && res.data.events) ||
      (Array.isArray(res?.data?.data) && res.data.data) ||
      (Array.isArray(res) && res) ||
      [];
    return list;
  },

  getEventById: async (eventId: string): Promise<EventItem> => {
    const res = (await axiosInstance.get(`/event/${eventId}`)) as any;
    return res?.event || res?.data?.event || res?.data || res;
  },

  createEvent: async (eventData: Partial<EventItem>): Promise<EventItem> => {
    const res = (await axiosInstance.post('/event', eventData)) as any;
    return res?.event || res?.data?.event || res?.data || res;
  },

  rsvpEvent: async (eventId: string, status: 'going' | 'interested' | 'not_going'): Promise<any> => {
    const res = (await axiosInstance.patch(`/event/${eventId}/rsvp`, { status })) as any;
    return res.data || res;
  },

  getEventAttendees: async (eventId: string, status?: string, page = 1, size = 20): Promise<any> => {
    let url = `/event/${eventId}/attendees?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    const res = (await axiosInstance.get(url)) as any;
    const list =
      (Array.isArray(res?.attendees) && res.attendees) ||
      (Array.isArray(res?.data) && res.data) ||
      (Array.isArray(res?.data?.attendees) && res.data.attendees) ||
      (Array.isArray(res) && res) ||
      [];
    return { attendees: list, count: res?.count || list.length };
  },

  inviteFriends: async (eventId: string, friendIds: string[]): Promise<any> => {
    const res = (await axiosInstance.post(`/event/${eventId}/invite`, { friendIds })) as any;
    return res.data || res;
  },

  deleteEvent: async (eventId: string): Promise<any> => {
    const res = (await axiosInstance.delete(`/event/${eventId}`)) as any;
    return res.data || res;
  }
};
