import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { adminApi, type AdminPost } from '../api/admin.api';
import { POST_GRADIENTS } from '../../../components/modals/CreateModal';
import { toast } from '../../../stores/toastStore';
import {
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Heart,
  MessageSquare,
  Globe,
  Lock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  MapPin,
  Smile,
  ShieldCheck
} from 'lucide-react';
import { createPortal } from 'react-dom';

export const AdminPostsPage: React.FC = () => {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'hidden'>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  // Modal state
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPosts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await adminApi.getPosts({ page, size: pageSize });
        // Handle both res.data array or direct array
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setPosts(list);
        setTotalCount(typeof res?.count === 'number' ? res.count : list.length);
      } catch {
        toast.error('Could not load posts for moderation');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page]
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleHidePost = async (post: AdminPost) => {
    try {
      await adminApi.hidePost(post._id);
      toast.warning('Post has been hidden from public feed.');
      fetchPosts(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not hide post');
    }
  };

  const handleUnhidePost = async (post: AdminPost) => {
    try {
      await adminApi.unhidePost(post._id);
      toast.success('Post restored and visible in public feed.');
      fetchPosts(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not restore post');
    }
  };

  const openDeleteModal = (post: AdminPost) => {
    setSelectedPost(post);
    setDeleteModalOpen(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    setActionLoading(true);
    try {
      await adminApi.deletePost(selectedPost._id);
      toast.delete('Post permanently purged.');
      setDeleteModalOpen(false);
      fetchPosts(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete post');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter posts based on active filter tab
  const filteredPosts = useMemo(() => {
    if (filterTab === 'active') {
      return posts.filter((p) => !p.isDeleted);
    }
    if (filterTab === 'hidden') {
      return posts.filter((p) => Boolean(p.isDeleted));
    }
    return posts;
  }, [posts, filterTab]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Content Moderation
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review user-submitted posts, backgrounds, and attachments. ({totalCount} total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPosts(true)}
            disabled={isRefreshing}
            className="gap-2 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { key: 'all', label: 'All Posts', count: posts.length },
          { key: 'active', label: 'Active Live', count: posts.filter((p) => !p.isDeleted).length },
          { key: 'hidden', label: 'Hidden / Soft Deleted', count: posts.filter((p) => Boolean(p.isDeleted)).length }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterTab(tab.key as any)}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <Card className="p-12 border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Loading content feed...</p>
        </Card>
      ) : filteredPosts.length === 0 ? (
        <Card className="p-12 text-center text-gray-400 border border-gray-100 shadow-xs bg-white">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No posts in this view</p>
          <p className="text-xs text-gray-400 mt-1">There are no posts matching the "{filterTab}" filter.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const rawAuthor = post.createdBy || (post as any).userId;
            const author = typeof rawAuthor === 'object' ? rawAuthor : null;
            const authorName =
              author?.username ||
              `${author?.firstName || ''} ${author?.lastName || ''}`.trim() ||
              'Ahmed Mohamed';
            const authorAvatar =
              author?.image?.secure_url ||
              (author as any)?.profilePicture?.secure_url ||
              (author as any)?.avatar ||
              '/assets/images/avatar/01.jpg';
            const authorEmail = author?.email || '';

            const isHidden = Boolean(post.isDeleted);
            const attachments = post.attachments || (post as any).media || [];
            const mediaUrl = attachments?.[0]?.secure_url;
            const isVideo =
              mediaUrl?.endsWith('.mp4') ||
              mediaUrl?.endsWith('.webm') ||
              mediaUrl?.includes('/video/');

            // Parse [bg:gradient], feeling, location from content
            const rawContent = post.content || '';
            const bgMatch = rawContent.match(/\[bg:([a-zA-Z0-9_-]+)\]/);
            const bgId = bgMatch ? bgMatch[1] : null;
            const activeGradient = POST_GRADIENTS.find((g) => g.id === bgId);

            const feelingMatch = rawContent.match(/—\s+feeling\s+([^📍\n]+)/);
            const feelingText = feelingMatch ? feelingMatch[1].trim() : null;

            const locationMatch = rawContent.match(/📍\s+at\s+([^—\n]+)/);
            const locationText = locationMatch ? locationMatch[1].trim() : null;

            const cleanText = rawContent
              .replace(/\[bg:[a-zA-Z0-9_-]+\]/g, '')
              .replace(/📍\s+at\s+[^—\n]+/g, '')
              .replace(/—\s+feeling\s+[^📍\n]+/g, '')
              .trim();

            return (
              <Card
                key={post._id}
                className={`p-4 border transition-all ${
                  isHidden
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                } shadow-xs rounded-2xl`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Author & Content */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <img
                      src={authorAvatar}
                      alt={authorName}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100 shrink-0"
                    />

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">{authorName}</span>
                        {authorEmail && (
                          <span className="text-[11px] text-gray-400">({authorEmail})</span>
                        )}
                        <span className="text-gray-300">•</span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(post.createdAt).toLocaleString()}
                        </span>

                        {feelingText && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                            <Smile className="w-3 h-3 text-amber-500" />
                            Feeling {feelingText}
                          </span>
                        )}

                        {locationText && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            {locationText}
                          </span>
                        )}

                        {post.privacy === 'private' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            <Lock className="w-2.5 h-2.5" /> Only Me
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                            <Globe className="w-2.5 h-2.5" /> Public
                          </span>
                        )}

                        {isHidden ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Hidden / Soft Deleted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Active Live
                          </span>
                        )}
                      </div>

                      {/* Content Card (Gradient or Plain Text) */}
                      {activeGradient && activeGradient.id !== 'none' ? (
                        <div
                          className={`mt-2 p-5 rounded-2xl ${activeGradient.bg} text-white font-bold text-sm text-center shadow-xs flex items-center justify-center min-h-[100px] break-words`}
                        >
                          {cleanText || rawContent}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                          {cleanText || rawContent || <span className="italic text-gray-400">No text caption</span>}
                        </p>
                      )}

                      {/* Media preview */}
                      {mediaUrl && (
                        <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                          {isVideo ? (
                            <video
                              src={mediaUrl}
                              controls
                              className="max-h-48 w-full object-contain bg-black"
                            />
                          ) : (
                            <img
                              src={mediaUrl}
                              alt="Attachment"
                              className="max-h-48 w-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-400" />
                          {post.likes?.length ?? 0} likes
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                          {post.comments?.length ?? 0} comments
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {isHidden ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnhidePost(post)}
                        className="text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs gap-1.5 h-8 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        Unhide Post
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleHidePost(post)}
                        className="text-amber-600 hover:bg-amber-50 border-amber-200 text-xs gap-1.5 h-8 font-medium"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide Post
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(post)}
                      className="text-red-600 hover:bg-red-50 border-red-200 text-xs gap-1.5 h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hard Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-3 border border-gray-100 shadow-xs bg-white flex items-center justify-between text-xs text-gray-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 h-auto"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 h-auto"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Hard Delete Confirmation Modal */}
      {deleteModalOpen &&
        selectedPost &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setDeleteModalOpen(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900">Purge Post Permanently?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  This will completely remove this post, its media attachments, comments, and reactions from the database.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeletePost}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
