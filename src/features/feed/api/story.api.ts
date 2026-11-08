import { axiosInstance } from '../../../lib/axios';

export interface StoryMedia {
  secure_url: string;
  public_id?: string;
  type?: 'image' | 'video';
}

export interface StoryMusic {
  title: string;
  artist: string;
  audioUrl: string;
  cover?: string;
  startTime?: number;
  duration?: number;
  x?: number;
  y?: number;
}

export interface StoryLocation {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface StorySticker {
  type: string;
  text: string;
  x?: number;
  y?: number;
}

export interface BackendStory {
  _id: string;
  createdBy: {
    _id: string;
    username: string;
    image?: { secure_url?: string };
    profilePicture?: { secure_url?: string };
  };
  content?: string;
  media?: StoryMedia;
  backgroundColor?: string;
  textColor?: string;
  music?: StoryMusic;
  location?: StoryLocation;
  stickers?: StorySticker[];
  textPosition?: { x: number; y: number };
  createdAt: string;
  expiresAt?: string;
  views?: { viewerId: string; viewedAt?: string }[];
}

export const storyApi = {
  createStory: (
    content?: string,
    file?: File,
    visibility: string = 'public',
    backgroundColor?: string,
    music?: StoryMusic,
    stickers?: StorySticker[],
    textColor?: string,
    location?: StoryLocation,
    textPosition?: { x: number; y: number }
  ): Promise<{ message: string; story: BackendStory }> => {
    const formData = new FormData();
    if (content?.trim()) {
      formData.append('content', content.trim());
    }
    if (file) {
      formData.append('file', file);
    }
    if (visibility) {
      formData.append('visibility', visibility);
    }
    if (backgroundColor) {
      formData.append('backgroundColor', backgroundColor);
    }
    if (textColor) {
      formData.append('textColor', textColor);
    }
    if (music) {
      formData.append('music', JSON.stringify(music));
    }
    if (stickers && stickers.length > 0) {
      formData.append('stickers', JSON.stringify(stickers));
    }
    if (location) {
      formData.append('location', JSON.stringify(location));
    }
    if (textPosition) {
      formData.append('textPosition', JSON.stringify(textPosition));
    }
    return axiosInstance.post('/story', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getMyStories: (): Promise<{ message: string; data?: { stories: BackendStory[] }; stories?: BackendStory[] }> => {
    return axiosInstance.get('/story/me');
  },

  getStoryFeed: (): Promise<{ message: string; data?: { feed: { user: any; stories: BackendStory[] }[] } }> => {
    return axiosInstance.get('/story/feed');
  },

  viewStory: (storyId: string): Promise<any> => {
    return axiosInstance.get(`/story/${storyId}`);
  },

  getViewers: (storyId: string): Promise<{ data: { viewers: any[]; count: number; reactions?: any[] } }> => {
    return axiosInstance.get(`/story/${storyId}/viewers`);
  },

  reactToStory: (storyId: string, emoji = '❤️'): Promise<any> => {
    return axiosInstance.post(`/story/${storyId}/react`, { emoji });
  },

  replyToStory: (storyId: string, text: string): Promise<any> => {
    return axiosInstance.post(`/story/${storyId}/reply`, { text });
  },

  deleteStory: (storyId: string): Promise<any> => {
    return axiosInstance.delete(`/story/${storyId}`);
  },
};

