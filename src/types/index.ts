export interface User {
  id: string;
  _id?: string;
  name: string;
  handle: string;
  avatar: string;
  role?: string;
  systemRole?: 'user' | 'admin' | 'superAdmin' | string;
  isAdmin?: boolean;
  bio?: string;
  address?: string;
  phone?: string;
  website?: string;
  coverImage?: string;
  createdAt?: string;
  followingCount?: number;
  followersCount?: number;
  postsCount?: number;
}

export interface PostComment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
}

export interface PostGroup {
  id: string;
  _id?: string;
  name: string;
  slug?: string;
  avatar?: string | { secure_url?: string };
  cover?: string | { secure_url?: string };
  privacy?: 'public' | 'private';
  membersCount?: number;
  category?: string;
  isMember?: boolean;
}

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  content: string;
  image?: string;
  likesCount: number;
  commentsCount: number;
  comments?: PostComment[];
  sharesCount: number;
  isLiked?: boolean;
  group?: PostGroup | null;
  groupId?: any;
  privacy?: string;
  originalPost?: any;
  postType?: string;
  isGroupMember?: boolean;
}

