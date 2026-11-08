import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../features/auth/api/auth.api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, confirmationPassword: string) => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<{ message: string }>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const mapRawUser = (u: any, fallbackEmail = ''): User => {
  const username =
    u.username ||
    `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
    (fallbackEmail ? fallbackEmail.split('@')[0] : 'User');

  return {
    id: u._id || 'usr_me',
    _id: u._id,
    name: username,
    handle: `@${username.toLowerCase().replace(/\s+/g, '')}`,
    avatar:
      u.image?.secure_url ||
      u.profilePicture?.secure_url ||
      '/assets/images/avatar/07.jpg',
    coverImage:
      u.coverImages?.[0]?.secure_url ||
      u.coverPictures?.[0]?.secure_url ||
      '/assets/images/bg/01.jpg',
    bio:
      u.bio ||
      'Lead Full Stack Developer passionate about building fast, intuitive web applications. Open to collaborations and tech discussions!',
    role:
      u.role === 'admin'
        ? 'Lead Admin'
        : u.role === 'superAdmin'
        ? 'Super Admin'
        : 'Web Developer at Webestica',
    systemRole: u.role || 'user',
    isAdmin: u.role === 'admin' || u.role === 'superAdmin',
    address: u.address || 'San Francisco, California',
    phone: u.phone || '',
    website: u.website || 'https://stackbros.in',
    createdAt: u.createdAt || new Date('2022-11-01').toISOString(),
    followersCount: typeof u.followersCount === 'number' ? u.followersCount : (Array.isArray(u.followers) ? u.followers.length : 0),
    followingCount: typeof u.followingCount === 'number' ? u.followingCount : (Array.isArray(u.following) ? u.following.length : 0),
    postsCount: 14,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('access_token') || null,
      isAuthenticated: Boolean(localStorage.getItem('access_token')),

      login: async (email: string, password: string) => {
        const res = (await authApi.login({ email, password })) as any;
        
        // Extract token from either root or nested data
        const token = res.access_token || res.data?.access_token;
        const refreshToken = res.refresh_token || res.data?.refresh_token;

        if (!token) {
          throw new Error('No access token received from authentication server.');
        }

        // Store tokens
        localStorage.setItem('access_token', token);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        // Mark authenticated immediately with token
        set({ token, isAuthenticated: true });

        // Resolve user object
        const rawUser = res.user || res.data?.user;
        if (rawUser) {
          const loggedUser = mapRawUser(rawUser, email);
          set({ user: loggedUser });
        } else {
          // Fetch profile using the token
          try {
            const profileRes = await authApi.getProfile();
            const pu = profileRes.user || profileRes.data?.user;
            if (pu) {
              set({ user: mapRawUser(pu, email) });
            } else {
              set({ user: mapRawUser({ _id: 'me', username: email.split('@')[0] }, email) });
            }
          } catch {
            set({ user: mapRawUser({ _id: 'me', username: email.split('@')[0] }, email) });
          }
        }
      },

      fetchProfile: async () => {
        const token = get().token || localStorage.getItem('access_token');
        if (!token) return;

        try {
          const profileRes = await authApi.getProfile();
          const pu = profileRes.user || profileRes.data?.user;
          if (pu) {
            set({ user: mapRawUser(pu), isAuthenticated: true });
          }
        } catch (err) {
          console.warn('Could not refresh profile:', err);
        }
      },

      signup: async (username: string, email: string, password: string, confirmationPassword: string) => {
        await authApi.signup({ username, email, password, confirmationPassword });
      },

      confirmEmail: async (email: string, code: string) => {
        await authApi.confirmEmail(email, code);
      },

      resendCode: async (email: string) => {
        return await authApi.resendCode(email);
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'social_auth_storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
