import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import type { Post, PostComment } from '../../../types';
import { 
  ThumbsUp,
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Send, 
  Loader2, 
  AlertCircle,
  Pencil,
  Trash2,
  Bookmark,
  EyeOff,
  Link as LinkIcon,
  MapPin,
  Check,
  Plus
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { postApi } from '../api/post.api';
import { groupApi } from '../../groups/api/group.api';
import { axiosInstance } from '../../../lib/axios';
import { toast } from '../../../stores/toastStore';
import { ShareModal } from '../../../components/modals/ShareModal';
import { CreateModal, POST_GRADIENTS, QUICK_FEELINGS } from '../../../components/modals/CreateModal';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export const REACTION_CONFIG: Record<ReactionType, { label: string; emoji: string; color: string; activeColor: string }> = {
  like: { label: 'Like', emoji: '👍', color: 'text-blue-600', activeColor: 'text-blue-600 font-semibold' },
  love: { label: 'Love', emoji: '❤️', color: 'text-red-500', activeColor: 'text-red-500 font-semibold' },
  haha: { label: 'Haha', emoji: '😂', color: 'text-amber-500', activeColor: 'text-amber-500 font-semibold' },
  wow: { label: 'Wow', emoji: '😮', color: 'text-amber-500', activeColor: 'text-amber-500 font-semibold' },
  sad: { label: 'Sad', emoji: '😢', color: 'text-amber-600', activeColor: 'text-amber-600 font-semibold' },
  angry: { label: 'Angry', emoji: '😡', color: 'text-orange-600', activeColor: 'text-orange-600 font-semibold' },
};

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: string, isLiked: boolean) => Promise<void> | void;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (postId: string, newContent: string) => void;
}

const isValidObjectId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLikeToggle,
  onPostDeleted,
  onPostUpdated 
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState(post.content);
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    (post as any).userReaction || (post.isLiked ? 'like' : null)
  );
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const reactionHoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<PostComment[]>(post.comments || []);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Three dots menu, edit modal & delete modal states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuOpen]);

  const handleEditSubmitFromModal = async (newContent: string, mediaFile?: File, visibility?: string) => {
    try {
      if (isValidObjectId(post.id)) {
        if (mediaFile) {
          const formData = new FormData();
          formData.append('content', newContent.trim());
          if (visibility) formData.append('privacy', visibility);
          formData.append('attachments', mediaFile);
          await axiosInstance.patch(`/post/${post.id}`, formData);
        } else {
          await postApi.updatePost(post.id, newContent.trim());
        }
      }
      setContent(newContent.trim());
      setIsEditModalOpen(false);
      onPostUpdated?.(post.id, newContent.trim());
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not update post';
      toast.error(msg, 'Edit Error');
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (isValidObjectId(post.id)) {
        await postApi.deletePost(post.id);
      }
      setIsDeleted(true);
      setIsDeleteDialogOpen(false);
      onPostDeleted?.(post.id);
      toast.delete('Post deleted successfully', 'Deleted');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not delete post. You can only delete your own posts.';
      toast.error(msg, 'Delete Error');
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSave = async () => {
    setIsMenuOpen(false);
    try {
      if (isSaved) {
        await postApi.unsavePost(post.id);
        setIsSaved(false);
        toast.info('Post removed from saved list');
      } else {
        await postApi.savePost(post.id);
        setIsSaved(true);
        toast.success('Post saved to bookmarks!', 'Saved');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleHidePost = async () => {
    setIsMenuOpen(false);
    try {
      await postApi.hidePost(post.id);
      setIsDeleted(true);
      toast.info('Post hidden from your feed', 'Hidden');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not hide post');
    }
  };

  const handleCopyLink = async () => {
    setIsMenuOpen(false);
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success('Post link copied to clipboard!', 'Link Copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  if (isDeleted) return null;

  const handleSelectReaction = async (type: ReactionType) => {
    setIsReactionPickerOpen(false);
    if (isLiking) return;

    const isRemoving = currentReaction === type;
    const previousReaction = currentReaction;
    const previousCount = likesCount;

    const nextReaction = isRemoving ? null : type;
    const nextCount = isRemoving
      ? Math.max(0, likesCount - 1)
      : previousReaction
      ? likesCount
      : likesCount + 1;

    // Optimistic UI update
    setCurrentReaction(nextReaction);
    setLikesCount(nextCount);
    setIsLiking(true);

    try {
      if (isValidObjectId(post.id)) {
        if (isRemoving) {
          await postApi.removeReaction(post.id);
        } else {
          await postApi.reactToPost(post.id, type);
        }
      }
      if (onLikeToggle) {
        await onLikeToggle(post.id, !isRemoving);
      }
    } catch (err) {
      console.error('Reaction update failed:', err);
      setCurrentReaction(previousReaction);
      setLikesCount(previousCount);
      toast.error('Could not update reaction', 'Reaction Error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleMainReactionClick = () => {
    if (currentReaction) {
      handleSelectReaction(currentReaction);
    } else {
      handleSelectReaction('like');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      let createdCommentId = `c_${Date.now()}`;
      if (isValidObjectId(post.id)) {
        const res = (await postApi.addComment(post.id, commentText)) as any;
        createdCommentId = res?.comment?._id || res?.data?.comment?._id || createdCommentId;
      }

      const newComment: PostComment = {
        id: createdCommentId,
        author: {
          id: user?.id || 'me',
          name: user?.name || 'You',
          avatar: user?.avatar || '/assets/images/avatar/07.jpg',
        },
        content: commentText.trim(),
        createdAt: 'Just now',
      };

      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      toast.success('Comment posted successfully!', 'Comment Added');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post comment';
      toast.error(msg, 'Comment Error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const feelingMatch = content.match(/—\s+feeling\s+([^📍\n]+)/);
  const feelingText = feelingMatch ? feelingMatch[1].trim() : null;

  const locationMatch = content.match(/📍\s+at\s+([^—\n]+)/);
  const locationText = (post as any).location?.name || (locationMatch ? locationMatch[1].trim() : null);

  const bgMatch = content.match(/\[bg:([a-zA-Z0-9_-]+)\]/);
  const bgId = bgMatch ? bgMatch[1] : null;
  const activeGradient = POST_GRADIENTS.find((g) => g.id === bgId);

  // Clean text for the post body: strips metadata so body remains completely clean
  const displayContent = content
    .replace(/\[bg:[a-zA-Z0-9_-]+\]/g, '')
    .replace(/📍\s+at\s+[^—\n]+/g, '')
    .replace(/—\s+feeling\s+[^📍\n]+/g, '')
    .trim();

  const parsedFeeling = useMemo(() => {
    if (!feelingText) return null;
    const match = QUICK_FEELINGS.find((f) => feelingText.toLowerCase().includes(f.label.toLowerCase()));
    if (match) return match;
    const emojiMatch = feelingText.match(/[\p{Extended_Pictographic}]/u);
    const emoji = emojiMatch ? emojiMatch[0] : '😊';
    const label = feelingText.replace(/[\p{Extended_Pictographic}]/u, '').trim();
    return { emoji, label: label || 'good' };
  }, [feelingText]);

  const parsedLocation = useMemo(() => {
    if (!locationText) return null;
    return {
      name: locationText,
      address: locationText,
      lat: (post as any).location?.lat || 30.0444,
      lng: (post as any).location?.lng || 31.2357,
    };
  }, [locationText]);

  const currentUserId = user?.id || (user as any)?._id;
  const postAuthorId = post.author?.id || (post as any)?.createdBy?._id || (post as any)?.createdBy || (post as any)?.userId;
  const isOwner = Boolean(
    currentUserId &&
    postAuthorId &&
    (String(currentUserId) === String(postAuthorId) || user?.role === 'admin')
  );

  // Group context & dynamic membership state
  const groupContext = post.group || (typeof post.groupId === 'object' && post.groupId ? post.groupId : null);
  const [isGroupMember, setIsGroupMember] = useState<boolean>(Boolean(groupContext?.isMember ?? post.isGroupMember));
  const [isJoiningGroup, setIsJoiningGroup] = useState<boolean>(false);

  const handleJoinGroup = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to join groups');
      return;
    }
    const targetId = groupContext?._id || groupContext?.id;
    if (!targetId) return;
    setIsJoiningGroup(true);
    try {
      const res: any = await groupApi.toggleJoinGroup(targetId);
      if (res?.isPendingRequest) {
        toast.info('Membership request sent to group admins', 'Request Sent');
      } else {
        setIsGroupMember(true);
        toast.success(`You have joined ${groupContext.name}!`, 'Group Joined');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not join group');
    } finally {
      setIsJoiningGroup(false);
    }
  };

  return (
    <>
      <Card className="border border-gray-100 mb-4 overflow-visible">
      {/* Header */}
      <div className="p-4 flex items-center justify-between gap-3">
        {groupContext ? (
          /* Group attribution header (Facebook / Reddit style) */
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Dual avatar: Group avatar + Author avatar overlay */}
            <div className="relative shrink-0">
              <Link to={`/group/${groupContext.slug || groupContext._id || groupContext.id}`} className="block">
                <img
                  src={
                    typeof groupContext.avatar === 'string'
                      ? groupContext.avatar
                      : (groupContext.avatar?.secure_url || '/assets/images/logo/01.svg')
                  }
                  alt={groupContext.name}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-blue-500/10 shadow-xs hover:opacity-90 transition-opacity bg-white"
                />
              </Link>
              <Link to={`/profile/${postAuthorId}`} className="block absolute -bottom-1 -right-1" title={post.author.name}>
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-5 h-5 rounded-full object-cover ring-2 ring-white shadow-2xs hover:scale-110 transition-transform bg-white"
                />
              </Link>
            </div>

            {/* Group info + Author meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/group/${groupContext.slug || groupContext._id || groupContext.id}`}
                  className="font-bold text-gray-900 text-sm leading-tight hover:text-blue-600 truncate transition-colors"
                >
                  {groupContext.name}
                </Link>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                  Group
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                <Link to={`/profile/${postAuthorId}`} className="font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                  {post.author.name}
                </Link>
                {feelingText && (
                  <span className="text-gray-400 font-normal">
                    is feeling {feelingText}
                  </span>
                )}
                {locationText && (
                  <span className="text-gray-400 font-normal">
                    at <span className="font-medium text-gray-700">{locationText}</span>
                  </span>
                )}
                <span className="text-gray-300">•</span>
                <span className="text-gray-400">{post.createdAt}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Normal user profile post header */
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link to={`/profile/${postAuthorId}`}>
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover hover:opacity-90 transition-opacity"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link to={`/profile/${postAuthorId}`}>
                  <h6 className="font-semibold text-gray-900 text-sm leading-tight hover:text-blue-600 cursor-pointer">
                    {post.author.name}
                  </h6>
                </Link>
                {feelingText && (
                  <span className="text-xs text-gray-500 font-normal">
                    is feeling {feelingText}
                  </span>
                )}
                {locationText && (
                  <span className="text-xs text-gray-500 flex items-center gap-1 font-normal">
                    <span>is at</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      <span>{locationText}</span>
                    </a>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span>{post.author.role || post.author.handle}</span>
                <span>•</span>
                <span>{post.createdAt}</span>
              </div>
            </div>
          </div>
        )}

        {/* Right side: Join Group button (if group post) + More options */}
        <div className="flex items-center gap-2 shrink-0">
          {groupContext && (
            isGroupMember ? (
              <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 select-none shadow-2xs">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Joined</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleJoinGroup}
                disabled={isJoiningGroup}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-transparent transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                {isJoiningGroup ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Join Group</span>
              </button>
            )
          )}

          {/* Three dots options menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Post options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-blue-600" />
                    <span>Edit Post</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteDialogOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Delete Post</span>
                  </button>

                  <div className="my-1 border-t border-gray-100" />
                </>
              )}

              <button
                type="button"
                onClick={handleToggleSave}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'text-blue-600 fill-current' : 'text-gray-500'}`} />
                <span>{isSaved ? 'Unsave Post' : 'Save Post'}</span>
              </button>

              <button
                type="button"
                onClick={handleHidePost}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <EyeOff className="w-4 h-4 text-gray-500" />
                <span>Hide Post</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LinkIcon className="w-4 h-4 text-gray-500" />
                <span>Copy Link</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {activeGradient && !post.image && !(post as any).attachments?.length ? (
          <div className={`rounded-2xl ${activeGradient.bg} p-6 sm:p-8 my-1 min-h-[200px] sm:min-h-[240px] flex items-center justify-center text-center shadow-inner`}>
            <p className="text-white font-bold text-lg sm:text-2xl drop-shadow-md leading-relaxed whitespace-pre-line max-w-lg">
              {displayContent}
            </p>
          </div>
        ) : displayContent ? (
          <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
            {displayContent}
          </p>
        ) : null}

        {/* Embedded Original Post if Repost or Quote */}
        {((post as any).originalPost || (post as any).postType === 'repost' || (post as any).postType === 'quote') && (
          <div className="mt-3">
            {(post as any).originalPost?.isUnavailable ? (
              <div className="p-3.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center gap-2.5 text-xs text-gray-500">
                <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{(post as any).originalPost?.message || 'This post is unavailable or has been removed.'}</span>
              </div>
            ) : (post as any).originalPost ? (
              <div className="rounded-xl border border-gray-200/90 bg-gray-50/60 overflow-hidden hover:bg-gray-50 transition-colors">
                <div className="p-3 flex items-center gap-2.5">
                  <img
                    src={(post as any).originalPost.createdBy?.image?.secure_url || (post as any).originalPost.createdBy?.image || '/assets/images/avatar/01.jpg'}
                    alt="Author"
                    className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
                  />
                  <div className="flex items-center gap-1.5 text-xs truncate">
                    <span className="font-semibold text-gray-900 truncate">
                      {(post as any).originalPost.createdBy?.username || (post as any).originalPost.createdBy?.firstName || 'Original Author'}
                    </span>
                    <span className="text-[10px] text-gray-400">• Shared Post</span>
                  </div>
                </div>

                {(post as any).originalPost.content && (
                  <p className="px-3 pb-2.5 text-xs text-gray-700 leading-relaxed">
                    {(post as any).originalPost.content}
                  </p>
                )}

                {(post as any).originalPost.attachments?.[0]?.secure_url && (
                  <div className="max-h-60 overflow-hidden bg-black/5">
                    <img
                      src={(post as any).originalPost.attachments[0].secure_url}
                      alt="Attachment"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Media Image or Video */}
      {post.image && (
        <div className="bg-black/5 overflow-hidden flex items-center justify-center">
          {post.image.includes('/video/upload/') || post.image.match(/\.(mp4|webm|mov|mkv)($|\?)/i) ? (
            <video
              src={post.image}
              controls
              playsInline
              className="w-full max-h-[500px] object-contain bg-black"
            />
          ) : (
            <img
              src={post.image}
              alt="Post media"
              className="w-full max-h-[480px] object-cover"
            />
          )}
        </div>
      )}

      {/* Action Buttons & Counters */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 text-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Multi-Reactions Popover Container (Facebook / LinkedIn Style) */}
          <div
            className="relative"
            onMouseEnter={() => {
              reactionHoverTimeout.current = setTimeout(() => {
                setIsReactionPickerOpen(true);
              }, 200);
            }}
            onMouseLeave={() => {
              if (reactionHoverTimeout.current) {
                clearTimeout(reactionHoverTimeout.current);
              }
              setIsReactionPickerOpen(false);
            }}
          >
            {/* Animated Reactions Bar Popover */}
            {isReactionPickerOpen && (
              <div 
                className="absolute -top-12 left-0 z-50 bg-white/95 backdrop-blur-md rounded-full px-2.5 py-1.5 shadow-2xl border border-gray-100 flex items-center gap-1.5 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150"
                role="tooltip"
                aria-label="Reactions"
              >
                {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((key) => {
                  const cfg = REACTION_CONFIG[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectReaction(key)}
                      className="relative group p-1 hover:scale-135 transition-all duration-150 cursor-pointer"
                      title={cfg.label}
                    >
                      <span className="text-xl leading-none select-none drop-shadow-xs block transition-transform group-hover:-translate-y-1">
                        {cfg.emoji}
                      </span>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm">
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Interactive Reaction Button */}
            <button
              type="button"
              onClick={handleMainReactionClick}
              disabled={isLiking}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all duration-200 font-medium hover:bg-gray-50 cursor-pointer ${
                currentReaction
                  ? REACTION_CONFIG[currentReaction].activeColor
                  : 'text-gray-500 hover:text-blue-600'
              } ${isLiking ? 'opacity-70' : ''}`}
            >
              {isLiking ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : currentReaction ? (
                <span className="text-base leading-none select-none animate-in zoom-in duration-150">
                  {REACTION_CONFIG[currentReaction].emoji}
                </span>
              ) : (
                <ThumbsUp className="w-4 h-4 transition-transform active:scale-125 text-gray-500" />
              )}
              <span className="text-xs">
                {currentReaction ? REACTION_CONFIG[currentReaction].label : 'Like'}
              </span>
              {likesCount > 0 && (
                <span className="text-xs text-gray-500 font-normal ml-0.5">
                  ({likesCount})
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length}</span>
          </button>
        </div>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors font-medium cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{sharesCount}</span>
        </button>
      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={post}
        onShared={() => setSharesCount((prev) => prev + 1)}
      />

      {/* Comments Section */}
      {showComments && (
        <div className="p-4 bg-gray-50/70 border-t border-gray-100 space-y-3">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isSubmittingComment}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[36px]"
            >
              {isSubmittingComment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          <div className="space-y-2.5 pt-2">
            {comments.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-2">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              comments.map((comm) => (
                <div key={comm.id} className="flex gap-2.5 items-start text-xs">
                  <img
                    src={comm.author.avatar}
                    alt={comm.author.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-gray-100"
                  />
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100 flex-1 shadow-2xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-gray-900">{comm.author.name}</span>
                      <span className="text-[10px] text-gray-400">{comm.createdAt}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{comm.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>

    {/* Edit Post Modal - Using rich Facebook-style CreateModal */}
    <CreateModal
      isOpen={isEditModalOpen}
      type="post"
      currentUser={
        user || {
          id: post.author.id,
          name: post.author.name,
          avatar: post.author.avatar,
          handle: post.author.handle,
        }
      }
      onClose={() => setIsEditModalOpen(false)}
      onSubmit={handleEditSubmitFromModal}
      isEditing={true}
      initialContent={displayContent}
      initialGradient={bgId || 'none'}
      initialFeeling={parsedFeeling}
      initialLocation={parsedLocation}
      initialVisibility={((post as any).privacy as any) || 'public'}
      initialMediaUrl={post.image || (post as any).attachments?.[0]?.secure_url || null}
    />

    {/* Delete Confirmation Modal - Facebook / Clean UI Dialog */}
    {isDeleteDialogOpen &&
      createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 leading-tight">Delete Post?</h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                  Are you sure you want to delete this post? This action cannot be undone and will permanently remove this post and all its interactions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
  </>
  );
};
