import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import type { User } from '../../../types';
import { 
  Bookmark, 
  Calendar, 
  Award, 
  EyeOff, 
  Eye, 
  X, 
  Loader2, 
  Trash2
} from 'lucide-react';
import { followApi } from '../api/follow.api';
import { postApi } from '../api/post.api';
import { toast } from '../../../stores/toastStore';

interface ProfileSidebarProps {
  user: User;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
};

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ user }) => {
  const [counts, setCounts] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });

  const [savedCount, setSavedCount] = useState(0);
  const [hiddenCount, setHiddenCount] = useState(0);

  // Modals for Saved Posts & Hidden Posts
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [hiddenPosts, setHiddenPosts] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isLoadingHidden, setIsLoadingHidden] = useState(false);

  const loadCounts = async () => {
    if (!user) return;
    const userId = user.id || (user as any)._id;

    try {
      const [followData, savedRes, hiddenRes] = await Promise.all([
        followApi.getFollowCounts(userId).catch(() => ({
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
        })),
        postApi.getSavedPosts(1, 1).catch(() => ({ count: 0 })),
        postApi.getHiddenPosts(1, 1).catch(() => ({ count: 0 })),
      ]);

      setCounts({
        postsCount: followData.postsCount ?? 0,
        followersCount: followData.followersCount ?? 0,
        followingCount: followData.followingCount ?? 0,
      });

      const sCount = savedRes.data?.count ?? savedRes.count ?? (Array.isArray(savedRes.data?.posts) ? savedRes.data.posts.length : 0);
      const hCount = hiddenRes.data?.count ?? hiddenRes.count ?? (Array.isArray(hiddenRes.data?.posts) ? hiddenRes.data.posts.length : 0);

      setSavedCount(sCount);
      setHiddenCount(hCount);
    } catch {
      // Keep initial counts if network fails
    }
  };

  useEffect(() => {
    loadCounts();
  }, [user]);

  // Load Saved Posts when modal opens
  const openSavedModal = async () => {
    setShowSavedModal(true);
    setIsLoadingSaved(true);
    try {
      const res = await postApi.getSavedPosts(1, 30);
      const raw = res.data?.posts || res.posts || res.data || [];
      const extracted = Array.isArray(raw)
        ? raw.map((item: any) => item.post || item.postId || item).filter(Boolean)
        : [];
      setSavedPosts(extracted);
    } catch {
      toast.error('Could not load saved posts');
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Load Hidden Posts when modal opens
  const openHiddenModal = async () => {
    setShowHiddenModal(true);
    setIsLoadingHidden(true);
    try {
      const res = await postApi.getHiddenPosts(1, 30);
      const raw = res.data?.posts || res.posts || res.data || [];
      setHiddenPosts(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Could not load hidden posts');
    } finally {
      setIsLoadingHidden(false);
    }
  };

  // Unhide post action
  const handleUnhidePost = async (postId: string) => {
    try {
      await postApi.unhidePost(postId);
      setHiddenPosts((prev) => prev.filter((p) => p._id !== postId && p.id !== postId));
      setHiddenCount((prev) => Math.max(0, prev - 1));
      toast.success('Post restored to your feed!', 'Post Unhidden');
      window.dispatchEvent(new CustomEvent('post-unhidden'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not unhide post');
    }
  };

  // Unsave post action
  const handleUnsavePost = async (postId: string) => {
    try {
      await postApi.unsavePost(postId);
      setSavedPosts((prev) => prev.filter((p) => p._id !== postId && p.id !== postId));
      setSavedCount((prev) => Math.max(0, prev - 1));
      toast.info('Post removed from bookmarks');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not remove post');
    }
  };

  return (
    <>
      <Card className="border border-gray-100 shadow-xs overflow-hidden">
        {/* Cover Image */}
        <div className="h-20 sm:h-24 bg-slate-900 relative overflow-hidden">
          <img
            src={user.coverImage || '/assets/images/bg/01.jpg'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Avatar & Profile Info */}
        <div className="p-4 pt-0 text-center relative">
          <div className="-mt-10 mb-3 inline-block relative">
            <Link to="/profile">
              <img
                src={user.avatar || '/assets/images/avatar/01.jpg'}
                alt={user.name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-sm object-cover mx-auto ring-1 ring-black/5 hover:opacity-95 transition-opacity"
              />
            </Link>
          </div>

          <h5 className="font-bold text-gray-900 text-base leading-tight">
            <Link to="/profile" className="hover:text-blue-600 transition-colors">
              {user.name}
            </Link>
          </h5>
          <p className="text-xs text-gray-500 mt-0.5">{user.role || 'Web Developer at Webestica'}</p>
          <p className="text-xs text-gray-600 mt-2 px-2 line-clamp-2">
            {user.bio || 'Lead Full Stack Developer passionate about building fast, intuitive web applications.'}
          </p>

          {/* Real Dynamic Stats Row from Database */}
          <div className="flex justify-around items-center py-3 my-3 border-y border-gray-100 text-center">
            <Link to="/profile" className="flex-1 hover:opacity-80 transition-opacity">
              <div className="font-bold text-gray-900 text-sm">{formatNumber(counts.postsCount)}</div>
              <div className="text-[11px] text-gray-400 font-medium">Post</div>
            </Link>
            <div className="w-px h-7 bg-gray-100" />
            <Link to="/profile" className="flex-1 hover:opacity-80 transition-opacity">
              <div className="font-bold text-gray-900 text-sm">{formatNumber(counts.followersCount)}</div>
              <div className="text-[11px] text-gray-400 font-medium">Followers</div>
            </Link>
            <div className="w-px h-7 bg-gray-100" />
            <Link to="/profile" className="flex-1 hover:opacity-80 transition-opacity">
              <div className="font-bold text-gray-900 text-sm">{formatNumber(counts.followingCount)}</div>
              <div className="text-[11px] text-gray-400 font-medium">Following</div>
            </Link>
          </div>

          {/* Quick Menu */}
          <div className="space-y-1 text-left text-sm font-medium">
            <button
              type="button"
              onClick={openSavedModal}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-blue-500" />
                <span>Saved Posts</span>
              </div>
              {savedCount > 0 && (
                <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={openHiddenModal}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50/50 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <EyeOff className="w-4 h-4 text-amber-500" />
                <span>Hidden Posts</span>
              </div>
              {hiddenCount > 0 && (
                <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {hiddenCount}
                </span>
              )}
            </button>

            <Link
              to="/events"
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Events</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Celebrations</span>
            </Link>
          </div>
        </div>

        <div className="p-3 border-t border-gray-100 text-center">
          <Link
            to="/profile"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
          >
            <span>View Profile</span>
            <span>→</span>
          </Link>
        </div>
      </Card>

      {/* Saved Posts Modal */}
      {showSavedModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">Saved Posts ({savedCount})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSavedModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {isLoadingSaved ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs">Loading bookmarks...</span>
                  </div>
                ) : savedPosts.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No saved posts yet</p>
                    <p className="text-xs mt-1 text-gray-400">Save posts from the three-dot menu on any post</p>
                  </div>
                ) : (
                  savedPosts.map((post: any) => {
                    const postId = post._id || post.id;
                    const authorName = post.createdBy?.username || post.createdBy?.firstName || 'User';
                    const authorAvatar = post.createdBy?.image?.secure_url || post.createdBy?.image || '/assets/images/avatar/01.jpg';
                    const contentSnippet = post.content || (post.attachments?.length ? 'Photo / Attachment' : 'Post');

                    return (
                      <div
                        key={postId}
                        className="p-3 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <h6 className="text-xs font-bold text-gray-900 truncate">{authorName}</h6>
                            <p className="text-xs text-gray-600 truncate max-w-xs">{contentSnippet}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnsavePost(postId)}
                          className="px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-red-50 hover:text-red-600 text-xs text-gray-500 font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                          title="Remove bookmark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Hidden Posts (Unhide) Modal */}
      {showHiddenModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Hidden Posts ({hiddenCount})</h3>
                    <p className="text-[11px] text-gray-400">Restore posts back to your feed anytime</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHiddenModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {isLoadingHidden ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                    <span className="text-xs">Loading hidden posts...</span>
                  </div>
                ) : hiddenPosts.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No hidden posts</p>
                    <p className="text-xs mt-1 text-gray-400">Posts you hide from the feed will appear here</p>
                  </div>
                ) : (
                  hiddenPosts.map((post: any) => {
                    const postId = post._id || post.id;
                    const authorName = post.createdBy?.username || post.createdBy?.firstName || 'User';
                    const authorAvatar = post.createdBy?.image?.secure_url || post.createdBy?.image || '/assets/images/avatar/01.jpg';
                    const contentSnippet = post.content || (post.attachments?.length ? 'Photo / Attachment' : 'Post');

                    return (
                      <div
                        key={postId}
                        className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <h6 className="text-xs font-bold text-gray-900 truncate">{authorName}</h6>
                            <p className="text-xs text-gray-600 truncate max-w-xs">{contentSnippet}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnhidePost(postId)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                          title="Unhide and restore to feed"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Unhide Post</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
