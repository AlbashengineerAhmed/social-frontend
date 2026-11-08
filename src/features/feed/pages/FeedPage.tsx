import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { CreatePostCard } from '../components/CreatePostCard';
import { PostCard } from '../components/PostCard';
import { StoriesBar } from '../components/StoriesBar';
import { RightWidgets } from '../components/RightWidgets';
import { Card } from '../../../components/ui/Card';
import { PullToRefresh } from '../../../components/ui/PullToRefresh';
import { useAuth } from '../../auth/context/AuthContext';
import { postApi } from '../api/post.api';
import type { Post } from '../../../types';
import { toast } from '../../../stores/toastStore';
import { RotateCw, Menu, X } from 'lucide-react';

// Verify if a string is a valid 24-char hex MongoDB ObjectId
const isValidObjectId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

// Animated Skeleton Card for smooth feed loading
const PostCardSkeleton: React.FC = () => (
  <Card className="border border-gray-100 mb-4 p-5 animate-pulse bg-white">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-3.5 bg-gray-200 rounded-md w-1/3" />
        <div className="h-2.5 bg-gray-100 rounded-md w-1/5" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-200 rounded-md w-full" />
      <div className="h-3 bg-gray-200 rounded-md w-11/12" />
      <div className="h-3 bg-gray-100 rounded-md w-2/3" />
    </div>
    <div className="h-52 bg-gray-100 rounded-xl mb-4" />
    <div className="flex gap-4 pt-3 border-t border-gray-100">
      <div className="h-4 bg-gray-200 rounded w-16" />
      <div className="h-4 bg-gray-200 rounded w-16" />
      <div className="h-4 bg-gray-100 rounded w-12 ml-auto" />
    </div>
  </Card>
);

export const FeedPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleOpenMobileSidebar = () => setIsMobileSidebarOpen(true);
    window.addEventListener('open-mobile-sidebar', handleOpenMobileSidebar);
    return () => window.removeEventListener('open-mobile-sidebar', handleOpenMobileSidebar);
  }, []);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingPosts(true);
    }

    try {
      // Backend paginates posts under GET /post or GET /feed/public
      const res = (await postApi.getPublicFeed(1, 20)) as any;
      
      // Handle both { data: [...] } and { data: { posts: [...] } } shapes
      const rawPosts = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.posts)
        ? res.data.posts
        : Array.isArray(res.posts)
        ? res.posts
        : [];

      if (rawPosts && rawPosts.length > 0) {
        const mapped: Post[] = rawPosts.map((bp: any) => {
          const authorObj =
            typeof bp.createdBy === 'object' && bp.createdBy
              ? bp.createdBy
              : typeof bp.userId === 'object' && bp.userId
              ? bp.userId
              : {};
          const authorId =
            authorObj._id ||
            (typeof bp.createdBy === 'string' ? bp.createdBy : '') ||
            (typeof bp.userId === 'string' ? bp.userId : '') ||
            bp.author?.id ||
            bp.author?._id ||
            'unknown';
          const authorName =
            authorObj.username ||
            `${authorObj.firstName || ''} ${authorObj.lastName || ''}`.trim() ||
            (authorId === user?.id || authorId === (user as any)?._id ? user?.name : 'Social User');

          const grp = typeof bp.groupId === 'object' && bp.groupId ? bp.groupId : null;
          const mappedGroup = grp
            ? {
                id: grp._id || grp.id,
                _id: grp._id || grp.id,
                name: grp.name || 'Community Group',
                slug: grp.slug,
                avatar:
                  grp.avatar?.secure_url ||
                  grp.avatar ||
                  '/assets/images/logo/01.svg',
                cover: grp.cover?.secure_url || grp.cover,
                privacy: grp.privacy || 'public',
                membersCount: grp.membersCount || 1,
                category: grp.category || 'Technology',
                isMember: Boolean(grp.isMember ?? bp.isGroupMember),
              }
            : null;

          return {
            id: bp._id,
            author: {
              id: authorId,
              name: authorName,
              handle: `@${authorName.toLowerCase().replace(/\s+/g, '')}`,
              avatar:
                authorObj.image?.secure_url ||
                authorObj.profilePicture?.secure_url ||
                (authorId === user?.id || authorId === (user as any)?._id ? user?.avatar : '/assets/images/avatar/01.jpg'),
              role: authorObj.role || 'Member',
            },
            createdAt: bp.createdAt
              ? new Date(bp.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent',
            content: bp.content || '',
            image: bp.attachments?.[0]?.secure_url,
            likesCount: Array.isArray(bp.likes) ? bp.likes.length : 0,
            isLiked: Boolean(Array.isArray(bp.likes) && user?.id && bp.likes.includes(user.id)),
            commentsCount: Array.isArray(bp.comments) ? bp.comments.length : bp.commentsCount || 0,
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
            sharesCount: bp.shareCount || 0,
            originalPost: bp.originalPost,
            postType: bp.postType,
            group: mappedGroup,
            isGroupMember: mappedGroup?.isMember,
          };
        });

        setPosts(mapped);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.warn('Could not fetch server feed:', err);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFeed();
    const handleUnhidden = () => {
      fetchFeed(true);
    };
    window.addEventListener('post-unhidden', handleUnhidden);
    return () => window.removeEventListener('post-unhidden', handleUnhidden);
  }, [fetchFeed]);

  const handleCreatePost = async (content: string, mediaFile?: File, visibility?: string) => {
    if (!user) return;

    try {
      const res = (await postApi.createPost(content, mediaFile, visibility)) as any;
      const realPost = res.post || res.data?.post || res.data;

      // Extract real MongoDB _id
      const newPostId = realPost?._id || `post_${Date.now()}`;
      const imageUrl =
        realPost?.attachments?.[0]?.secure_url ||
        (mediaFile ? URL.createObjectURL(mediaFile) : undefined);

      const newPost: Post = {
        id: newPostId,
        author: user,
        createdAt: 'Just now',
        content: realPost?.content || content,
        image: imageUrl,
        likesCount: 0,
        isLiked: false,
        commentsCount: 0,
        sharesCount: 0,
      };

      setPosts((prev) => [newPost, ...prev]);
    } catch (err: unknown) {
      console.error('Failed to create post:', err);
      throw err;
    }
  };

  const handleLikeToggle = async (postId: string, isLiked: boolean) => {
    if (!isValidObjectId(postId)) {
      return;
    }

    try {
      const action = isLiked ? 'like' : 'unLike';
      await postApi.likePost(postId, action);
    } catch (err) {
      console.error('Like toggle error:', err);
      toast.error('Could not update like status on server.', 'Like Error');
      throw err;
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden lg:block lg:col-span-3">
          <ProfileSidebar user={user} />
        </aside>

        {/* Center Feed */}
        <section className="lg:col-span-6">
          <PullToRefresh onRefresh={() => fetchFeed(true)}>
            <div className="space-y-5">
              {/* Mobile Profile & Shortcuts Bar */}
              <div className="lg:hidden flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                  />
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{user.name}</h4>
                    <p className="text-[11px] text-gray-400 truncate">Saved posts & shortcuts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ml-2"
                >
                  <Menu className="w-3.5 h-3.5" />
                  <span>Shortcuts</span>
                </button>
              </div>

              <StoriesBar currentUser={user} />
              <CreatePostCard currentUser={user} onPostCreated={handleCreatePost} />

              {/* Feed Header with Refresh */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-gray-700">Recent Stories & Feed</h2>
                <button
                  type="button"
                  onClick={() => fetchFeed(true)}
                  disabled={isRefreshing || isLoadingPosts}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Feed Items / Skeletons */}
              <div className="space-y-4">
                {isLoadingPosts ? (
                  <>
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                  </>
                ) : posts.length === 0 ? (
                  <Card className="p-8 text-center border border-gray-100">
                    <p className="text-gray-500 text-sm">No posts yet. Be the first to share an update!</p>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLikeToggle={handleLikeToggle}
                      onPostDeleted={(deletedId) => setPosts((prev) => prev.filter((p) => p.id !== deletedId))}
                      onPostUpdated={(updatedId, newContent) =>
                        setPosts((prev) =>
                          prev.map((p) => (p.id === updatedId ? { ...p, content: newContent } : p))
                        )
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </PullToRefresh>
        </section>

        {/* Right Sidebar Widgets (Desktop Only) */}
        <aside className="hidden lg:block lg:col-span-3">
          <RightWidgets />
        </aside>
      </div>

      {/* Mobile Off-Canvas Sidebar Drawer (Facebook / Mobile App Style) */}
      {isMobileSidebarOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex lg:hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Slide-in Drawer Container */}
            <div className="relative w-80 max-w-[85vw] h-full bg-[#f5f7f9] shadow-2xl z-10 flex flex-col p-4 overflow-y-auto animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Menu className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Sidebar & Shortcuts</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ProfileSidebar user={user} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
