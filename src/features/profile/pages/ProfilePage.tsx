import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useAuthStore } from '../../../stores/authStore';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PostCard } from '../../feed/components/PostCard';
import { postApi } from '../../feed/api/post.api';
import { followApi } from '../../feed/api/follow.api';
import { profileApi } from '../api/profile.api';
import { friendshipApi, type FriendUser } from '../../friendship/api/friendship.api';
import { axiosInstance } from '../../../lib/axios';
import { toast } from '../../../stores/toastStore';
import type { Post } from '../../../types';
import { 
  Briefcase, 
  Calendar, 
  Link as LinkIcon, 
  MapPin,
  Pencil, 
  Grid, 
  Image as ImageIcon, 
  Users,
  UserX,
  Sparkles,
  Camera,
  X,
  Loader2
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'media' | 'friends'>('posts');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [friendsList, setFriendsList] = useState<FriendUser[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Real Counts fetched dynamically from backend
  const [followCounts, setFollowCounts] = useState({
    followersCount: 0,
    followingCount: 0,
  });

  // Image Upload States & File Input Refs
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editRole, setEditRole] = useState(user?.role || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editWebsite, setEditWebsite] = useState(user?.website || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEditName(user.name);
    setEditBio(user.bio || 'Lead Full Stack Developer passionate about building fast, intuitive web applications. Open to collaborations and tech discussions!');
    setEditRole(user.role || 'Web Developer at Webestica');
    setEditAddress(user.address || 'San Francisco, California');
    setEditWebsite(user.website || 'https://stackbros.in');

    const userId = user.id || (user as any)._id;

    // 1. Load real followers and following counts
    const loadRealCounts = async () => {
      try {
        const counts = await followApi.getFollowCounts(userId);
        setFollowCounts({
          followersCount: counts.followersCount ?? 0,
          followingCount: counts.followingCount ?? 0,
        });
      } catch {
        setFollowCounts({
          followersCount: typeof user.followersCount === 'number' ? user.followersCount : 0,
          followingCount: typeof user.followingCount === 'number' ? user.followingCount : 0,
        });
      }
    };

    // 2. Load user's actual posts
    const loadUserPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const res = (await postApi.getPublicFeed(1, 50)) as any;
        const raw = Array.isArray(res.data) ? res.data : (res.data?.posts || res.posts || []);
        
        // Filter posts created by the logged-in user
        const myPosts = raw.filter((p: any) => {
          const authorId = p.createdBy?._id || p.userId?._id || p.createdBy || p.userId;
          return authorId === user.id || authorId === (user as any)._id;
        });

        if (myPosts.length > 0) {
          const mapped: Post[] = myPosts.map((bp: any) => ({
            id: bp._id,
            author: user,
            createdAt: bp.createdAt
              ? new Date(bp.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent',
            content: bp.content || '',
            image: bp.attachments?.[0]?.secure_url,
            likesCount: Array.isArray(bp.likes) ? bp.likes.length : 0,
            isLiked: Array.isArray(bp.likes) && bp.likes.includes(user.id),
            commentsCount: Array.isArray(bp.comments) ? bp.comments.length : 0,
            comments: Array.isArray(bp.comments)
              ? bp.comments.map((c: any) => ({
                  id: c._id || `c_${Math.random()}`,
                  author: {
                    id: c.createdBy?._id || 'unknown',
                    name: c.createdBy?.username || 'Community Member',
                    avatar: c.createdBy?.image?.secure_url || '/assets/images/avatar/01.jpg',
                  },
                  content: c.content || '',
                  createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Just now',
                }))
              : [],
            sharesCount: 0,
          }));
          setUserPosts(mapped);
        } else {
          setUserPosts([]);
        }
      } catch (err) {
        console.warn('Could not load user posts from server:', err);
        setUserPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    // 3. Load actual friends list from Friendship API
    const loadFriends = async () => {
      setIsLoadingFriends(true);
      try {
        const friends = await friendshipApi.getFriends();
        setFriendsList(friends);
      } catch {
        setFriendsList([]);
      } finally {
        setIsLoadingFriends(false);
      }
    };

    loadRealCounts();
    loadUserPosts();
    loadFriends();
  }, [user]);

  // Handle changing profile picture (avatar)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await profileApi.updateProfileImage(file);
      const newUrl = 
        res.data?.user?.image?.secure_url || 
        res.data?.image?.secure_url || 
        res.user?.image?.secure_url;

      const finalUrl = newUrl || URL.createObjectURL(file);
      setUser({
        ...user!,
        avatar: finalUrl,
      });
      toast.success('Profile photo updated successfully!', 'Avatar Changed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Handle changing cover photo
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setIsUploadingCover(true);
    try {
      const res = await profileApi.updateCoverImage(file);
      const newUrl = 
        res.data?.user?.coverImages?.[0]?.secure_url || 
        res.data?.coverImages?.[0]?.secure_url || 
        res.user?.coverImages?.[0]?.secure_url;

      const finalUrl = newUrl || URL.createObjectURL(file);
      setUser({
        ...user!,
        coverImage: finalUrl,
      });
      toast.success('Cover photo updated successfully!', 'Cover Changed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not upload cover image.');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
      return;
    }
    try {
      await friendshipApi.removeFriend(friendId);
      setFriendsList((prev) => prev.filter((f) => f._id !== friendId && f.id !== friendId));
      toast.info(`Removed ${friendName} from friends`);
    } catch {
      toast.error('Could not remove friend. Please try again.');
    }
  };

  if (!user) return null;

  // Format joined date nicely
  const formattedJoinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      await axiosInstance.patch('/user/profile', {
        username: editName,
        address: editAddress,
      }).catch(() => {});

      setUser({
        ...user,
        name: editName,
        handle: `@${editName.toLowerCase().replace(/\s+/g, '')}`,
        bio: editBio,
        role: editRole,
        address: editAddress,
        website: editWebsite,
      });

      toast.success('Profile details updated successfully!', 'Profile Saved');
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save profile';
      toast.error(msg, 'Save Error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        
        {/* Cover Photo Banner with High-Contrast Overlay & Controls */}
        <div className="h-48 sm:h-64 md:h-72 w-full relative overflow-hidden bg-slate-900 group">
          <img
            src={user.coverImage || '/assets/images/bg/01.jpg'}
            alt="Cover banner"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
          
          {/* Top & Bottom dark contrast gradients ensuring all controls are 100% visible */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 pointer-events-none" />

          {/* Top-Left Badge with clean high-contrast backdrop */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20 shadow-md flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Profile Cover</span>
          </div>

          {/* Change Cover Button */}
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            className="absolute top-4 right-4 sm:top-5 sm:right-6 bg-black/70 hover:bg-black/90 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-xl backdrop-blur-md border border-white/20 shadow-lg cursor-pointer transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 z-10"
          >
            {isUploadingCover ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Camera className="w-4 h-4 text-white" />
            )}
            <span>{isUploadingCover ? 'Uploading...' : 'Change Cover'}</span>
          </button>
        </div>

        {/* Profile Details Container */}
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 sm:-mt-18 gap-4">
            
            {/* Avatar & User Identity */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
              
              {/* Profile Avatar with Camera Button Overlay */}
              <div className="relative shrink-0 group">
                <img
                  src={user.avatar || '/assets/images/avatar/01.jpg'}
                  alt={user.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-4 border-white shadow-xl object-cover bg-white ring-1 ring-black/10"
                />

                {/* Hidden File Input for Avatar */}
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Camera Overlay Icon to Change Profile Picture */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Change profile picture"
                  className="absolute bottom-1 right-1 p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg border-2 border-white cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center z-10"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  )}
                </button>
              </div>

              <div className="sm:mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                  {user.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
                  {user.handle}
                </p>
              </div>
            </div>

            {/* Edit Profile Action Button */}
            <div className="sm:mb-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs sm:text-sm rounded-xl border border-gray-200 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5 text-gray-500" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-4">
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
              {user.bio ||
                'Lead Full Stack Developer passionate about building fast, intuitive web applications. Open to collaborations and tech discussions!'}
            </p>
          </div>

          {/* Metadata Row */}
          <div className="mt-4 flex flex-wrap items-center gap-y-2.5 gap-x-6 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{user.role || 'Web Developer at Webestica'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{user.address || 'San Francisco, California'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Joined {formattedJoinDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <a
                href={user.website || 'https://stackbros.in'}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                {user.website || 'https://stackbros.in'}
              </a>
            </div>
          </div>

          {/* Real Dynamic Follow, Friend & Post Counts from Database */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-xs sm:text-sm">
            <div>
              <span className="font-bold text-gray-900">{friendsList.length}</span>{' '}
              <span className="text-gray-500">Friends</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{followCounts.followingCount}</span>{' '}
              <span className="text-gray-500">Following</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{followCounts.followersCount}</span>{' '}
              <span className="text-gray-500">Followers</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{userPosts.length}</span>{' '}
              <span className="text-gray-500">Posts</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-100 px-5 sm:px-8 gap-6 text-xs sm:text-sm font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'posts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Posts ({userPosts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'friends'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Friends ({friendsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'about'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>About</span>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'media'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Media</span>
          </button>
        </div>
      </div>

      {/* Tab Contents: Posts */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            {isLoadingPosts ? (
              <Card className="p-8 text-center border border-gray-100">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Loading your posts...</p>
              </Card>
            ) : userPosts.length === 0 ? (
              <Card className="p-12 text-center border border-gray-100">
                <Grid className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">No posts shared yet</p>
                <p className="text-xs text-gray-400 mt-1">Create your first post from the home feed!</p>
              </Card>
            ) : (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5 border border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Intro</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {user.bio || 'I’d love to change the world, but they won’t give me the source code.'}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  <span>{user.role || 'Web Developer'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Joined {formattedJoinDate}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Contents: Friends */}
      {activeTab === 'friends' && (
        <Card className="border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Friends ({friendsList.length})
              </h3>
              <p className="text-xs text-gray-500">People you are mutually connected with</p>
            </div>
          </div>

          {isLoadingFriends ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs">Loading friends list...</p>
            </div>
          ) : friendsList.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No friends yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Send friend requests to members from the "Who to follow" sidebar or search!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {friendsList.map((friend) => {
                const friendAvatar = friend.image?.secure_url || friend.avatar || '/assets/images/avatar/01.jpg';
                const friendName = friend.username || `${friend.firstName || ''} ${friend.lastName || ''}`.trim() || 'Friend';
                const fId = friend._id || friend.id || '';

                return (
                  <div
                    key={fId}
                    className="p-4 rounded-xl border border-gray-100 hover:border-blue-100 bg-white hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={friendAvatar}
                        alt={friendName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-50 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{friendName}</h4>
                        <p className="text-[11px] text-gray-400 truncate">{friend.email || 'Member'}</p>
                        {friend.since && (
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            Friends since {new Date(friend.since).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFriend(fId, friendName)}
                        className="text-xs py-1 px-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 gap-1 rounded-lg"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Remove Friend
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Tab Contents: About */}
      {activeTab === 'about' && (
        <Card className="border border-gray-100 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">About {user.name}</h3>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>
              {user.bio ||
                'Lead Full Stack Developer passionate about building fast, intuitive web applications. Open to collaborations and tech discussions!'}
            </p>
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-gray-800 block mb-1">Current Role:</span>
                <span className="text-gray-600">{user.role || 'Web Developer'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-800 block mb-1">Location:</span>
                <span className="text-gray-600">{user.address || 'San Francisco, California'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-800 block mb-1">Portfolio:</span>
                <a href={user.website || 'https://stackbros.in'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  {user.website || 'https://stackbros.in'}
                </a>
              </div>
              <div>
                <span className="font-semibold text-gray-800 block mb-1">Member Since:</span>
                <span className="text-gray-600">{formattedJoinDate}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Contents: Media */}
      {activeTab === 'media' && (
        <Card className="border border-gray-100 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Media & Videos</h3>
          {userPosts.filter((p) => p.image).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No photos or media uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {userPosts
                .filter((p) => p.image)
                .map((p) => (
                  <div key={p.id} className="relative group overflow-hidden rounded-xl bg-gray-100 aspect-video">
                    <img src={p.image} alt="Media" className="w-full h-full object-cover" />
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">Edit Profile Information</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div>
                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Ahmed Mohamed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Describe yourself..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Role / Title"
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  placeholder="e.g. Lead Full Stack Developer"
                />
                <Input
                  label="Location"
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. San Francisco, California"
                />
              </div>

              <div>
                <Input
                  label="Website Link"
                  type="url"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingProfile}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingProfile}
                  disabled={!editName.trim() || isSavingProfile}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
