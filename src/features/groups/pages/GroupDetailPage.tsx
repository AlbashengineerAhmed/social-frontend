import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { groupApi, type Group } from '../api/group.api';
import { postApi } from '../../feed/api/post.api';
import { useAuth } from '../../auth/context/AuthContext';
import { toast } from '../../../stores/toastStore';
import { QUICK_FEELINGS, POST_GRADIENTS } from '../../../components/modals/CreateModal';
import {
  Users,
  Lock,
  Globe,
  MessageSquare,
  Plus,
  Crown,
  ArrowLeft,
  Share2,
  Send,
  Loader2,
  ShieldCheck,
  Clock,
  Heart,
  FileText,
  UserCheck,
  Trash2,
  Camera,
  Settings,
  X,
  Image as ImageIcon,
  Smile,
  Palette,
  MessageCircle,
  MoreVertical,
  Pencil,
  Copy
} from 'lucide-react';

const PRESET_COVERS = [
  '/assets/images/bg/01.jpg',
  '/assets/images/bg/02.jpg',
  '/assets/images/bg/03.jpg',
  '/assets/images/bg/04.jpg',
  '/assets/images/bg/05.jpg',
  '/assets/images/bg/06.jpg',
  '/assets/images/bg/07.jpg',
];

const PRESET_LOGOS = [
  '/assets/images/logo/01.svg',
  '/assets/images/logo/02.svg',
  '/assets/images/logo/03.svg',
  '/assets/images/logo/04.svg',
  '/assets/images/logo/05.svg',
  '/assets/images/logo/06.svg',
  '/assets/images/logo/08.svg',
  '/assets/images/logo/09.svg',
  '/assets/images/logo/10.svg',
  '/assets/images/logo/11.svg',
  '/assets/images/logo/12.svg',
  '/assets/images/logo/13.svg',
];

const CATEGORIES = ['Technology', 'Community', 'Health', 'Design', 'Business'];

const formatTimeAgo = (dateStr?: string): string => {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discussions' | 'members' | 'about'>('discussions');

  // Posts Feed State
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Rich Group Post Composer State
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<{ emoji: string; label: string } | null>(null);
  const [selectedGradient, setSelectedGradient] = useState<string>('none');
  const [isFeelingsOpen, setIsFeelingsOpen] = useState(false);
  const [isGradientsOpen, setIsGradientsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Members List State
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Join Action State
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Group State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Group Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('Technology');
  const [editPrivacy, setEditPrivacy] = useState<'public' | 'private'>('public');
  const [editRules, setEditRules] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Group Post Options & Editing State
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Load Group Data
  const loadGroupDetails = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const data = await groupApi.getGroupById(groupId);
      if (!data) {
        toast.error('Group not found');
        navigate('/groups');
        return;
      }

      // Check ownership
      const isOwner =
        data.memberRole === 'owner' ||
        (typeof data.creator === 'object' && data.creator?._id === user?.id) ||
        data.creator === user?.id;

      setGroup({
        ...data,
        isMember: Boolean(data.isMember || isOwner),
        memberRole: isOwner ? 'owner' : data.memberRole
      });
    } catch {
      toast.error('Could not load group details');
      navigate('/groups');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, user?.id, navigate]);

  // Load Group Posts
  const loadPosts = useCallback(async () => {
    if (!groupId) return;
    setIsLoadingPosts(true);
    try {
      const res = await groupApi.getGroupPosts(groupId);
      setPosts(Array.isArray(res?.posts) ? res.posts : []);
    } catch {
      // Ignore private feed lock errors gracefully
    } finally {
      setIsLoadingPosts(false);
    }
  }, [groupId]);

  // Load Group Members
  const loadMembers = useCallback(async () => {
    if (!groupId) return;
    setIsLoadingMembers(true);
    try {
      const res = await groupApi.getGroupMembers(groupId);
      const list =
        (Array.isArray(res?.members) && res.members) ||
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res) && res) ||
        [];
      setMembers(list);
    } catch {
      toast.error('Could not load group members');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]);

  useEffect(() => {
    if (activeTab === 'discussions') {
      loadPosts();
    } else if (activeTab === 'members') {
      loadMembers();
    }
  }, [activeTab, loadPosts, loadMembers]);

  // Toggle Join/Leave
  const handleToggleJoin = async () => {
    if (!group) return;

    if (group.memberRole === 'owner') {
      toast.info('You are the owner of this group. Owners cannot leave their group.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await groupApi.toggleJoinGroup(group._id);
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              isMember: res.isMember,
              isPendingRequest: res.isPendingRequest,
              membersCount: res.isMember
                ? (prev.membersCount || 0) + 1
                : Math.max(0, (prev.membersCount || 1) - 1)
            }
          : prev
      );
      toast.success(res.message);
      if (res.isMember) {
        loadPosts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update membership');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error('File size exceeds 25MB limit.');
        return;
      }
      setSelectedMedia(file);
      setMediaPreview(URL.createObjectURL(file));
      setSelectedGradient('none');
    }
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newPostContent.trim() && !selectedMedia) || !group) return;

    setIsPosting(true);
    try {
      let finalContent = newPostContent.trim();

      // Format feeling
      if (selectedFeeling) {
        finalContent += ` — feeling ${selectedFeeling.label} ${selectedFeeling.emoji}`;
      }

      // Format gradient tag if selected and no media
      if (selectedGradient && selectedGradient !== 'none' && !selectedMedia) {
        finalContent += ` [bg:${selectedGradient}]`;
      }

      const created = await groupApi.createGroupPost(group._id, finalContent, selectedMedia || undefined);
      const postItem = created?.data?.post || created?.post || created;
      setPosts((prev) => [postItem, ...prev]);
      setNewPostContent('');
      setSelectedFeeling(null);
      setSelectedGradient('none');
      removeMedia();
      setIsFeelingsOpen(false);
      setIsGradientsOpen(false);
      setGroup((prev) => (prev ? { ...prev, postsCount: (prev.postsCount || 0) + 1 } : prev));
      toast.success('Discussion posted successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not share post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (post: any) => {
    const isCurrentlyLiked = Boolean(
      post.isLiked ||
      (Array.isArray(post.likes) && post.likes.some((l: any) => (l?._id || l) === user?.id))
    );

    try {
      await postApi.likePost(post._id, isCurrentlyLiked ? 'unLike' : 'like');
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== post._id) return p;
          const currentLikes = Array.isArray(p.likes) ? p.likes : [];
          const updatedLikes = isCurrentlyLiked
            ? currentLikes.filter((l: any) => (l?._id || l) !== user?.id)
            : [...currentLikes, user?.id];
          return {
            ...p,
            likes: updatedLikes,
            isLiked: !isCurrentlyLiked,
          };
        })
      );
    } catch {
      toast.error('Could not update reaction');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Group link copied to clipboard!');
  };

  const handleOpenEditPost = (post: any) => {
    setEditingPost(post);
    const clean = post.content ? post.content.replace(/\[bg:[a-zA-Z0-9_-]+\]/g, '').trim() : '';
    setEditPostContent(clean);
    setActiveMenuPostId(null);
  };

  const handleSavePostEdit = async () => {
    if (!editingPost || !editPostContent.trim()) return;
    setIsUpdatingPost(true);
    try {
      const bgMatch = editingPost.content?.match(/\[bg:([a-zA-Z0-9_-]+)\]/);
      const finalContent = bgMatch ? `${editPostContent.trim()} ${bgMatch[0]}` : editPostContent.trim();

      await groupApi.updateGroupPost(editingPost._id, finalContent);
      setPosts((prev) =>
        prev.map((p) => (p._id === editingPost._id ? { ...p, content: finalContent } : p))
      );
      toast.success('Post updated successfully!');
      setEditingPost(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update post');
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this discussion post?');
    if (!confirmed) return;

    setDeletingPostId(postId);
    try {
      await groupApi.deleteGroupPost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setGroup((prev) => (prev ? { ...prev, postsCount: Math.max(0, (prev.postsCount || 1) - 1) } : prev));
      toast.success('Post removed successfully!');
      setActiveMenuPostId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    setIsDeleting(true);
    try {
      await groupApi.deleteGroup(group._id);
      toast.success('Group deleted successfully');
      navigate('/groups');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete group');
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const openEditModal = () => {
    if (!group) return;
    setEditName(group.name || '');
    setEditDesc(group.description || '');
    setEditCategory(group.category || 'Technology');
    setEditPrivacy(group.privacy || 'public');
    setEditRules(group.rules || '');
    setEditCover(group.cover?.secure_url || '/assets/images/bg/02.jpg');
    setEditAvatar(group.avatar?.secure_url || '/assets/images/logo/01.svg');
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !editName.trim()) return;

    setIsUpdating(true);
    try {
      await groupApi.updateGroup(group._id, {
        name: editName.trim(),
        description: editDesc.trim(),
        category: editCategory,
        privacy: editPrivacy,
        rules: editRules.trim(),
        cover: editCover,
        avatar: editAvatar,
      });

      setGroup((prev) =>
        prev
          ? {
              ...prev,
              name: editName.trim(),
              description: editDesc.trim(),
              category: editCategory,
              privacy: editPrivacy,
              rules: editRules.trim(),
              cover: { secure_url: editCover },
              avatar: { secure_url: editAvatar },
            }
          : prev
      );

      toast.success('Group updated successfully!');
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update group');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading community group...</span>
      </div>
    );
  }

  if (!group) return null;

  const isOwner =
    group.memberRole === 'owner' ||
    (typeof group.creator === 'object' && group.creator?._id === user?.id) ||
    group.creator === user?.id ||
    user?.role === 'admin';
  const isMember = Boolean(group.isMember || isOwner);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Groups</span>
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={copyShareLink}
          className="gap-1.5 text-xs h-8 bg-white"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </Button>
      </div>

      {/* Hero Header Card */}
      <Card className="overflow-hidden border border-gray-100 shadow-xs bg-white rounded-3xl">
        {/* Cover Banner */}
        <div className="h-48 sm:h-64 relative bg-slate-900 overflow-hidden group/cover">
          <img
            src={group.cover?.secure_url || '/assets/images/bg/02.jpg'}
            alt={group.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/cover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Privacy badge */}
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white flex items-center gap-1.5 font-medium border border-white/10 shadow-sm">
            {group.privacy === 'private' ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Private Group</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Public Group</span>
              </>
            )}
          </div>

          {/* Edit Cover button (Owners only) */}
          {isOwner && (
            <button
              type="button"
              onClick={openEditModal}
              className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer border border-white/20 transition-all shadow-md"
            >
              <Camera className="w-4 h-4" />
              <span>Edit Cover</span>
            </button>
          )}
        </div>

        {/* Group Identity & Primary Actions Bar */}
        <div className="px-6 pb-6 pt-0 relative bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-gray-100">
            {/* Left: Avatar popping over banner + Clean Text Info on White Background */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2 sm:pt-3">
              {/* Avatar */}
              <div
                className="-mt-16 sm:-mt-20 shrink-0 relative group/avatar cursor-pointer z-10"
                onClick={() => isOwner && openEditModal()}
                title={isOwner ? 'Click to change avatar logo' : group.name}
              >
                <img
                  src={group.avatar?.secure_url || '/assets/images/logo/01.svg'}
                  alt={group.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white shadow-xl bg-white object-cover ring-1 ring-black/5"
                />
                {isOwner && (
                  <div className="absolute inset-0 bg-black/50 rounded-3xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer border-4 border-transparent">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold tracking-wide uppercase">Edit</span>
                  </div>
                )}
              </div>

              {/* Group Title, Category, and Counts (Crisp & Readable on White Background) */}
              <div className="space-y-1.5 pt-1 sm:pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                    {group.category}
                  </span>
                  <span className="text-[11px] text-gray-400">•</span>
                  <span className="text-xs text-gray-500 font-medium">
                    {group.membersCount || 1} Members
                  </span>
                  <span className="text-[11px] text-gray-400">•</span>
                  <span className="text-xs text-gray-500 font-medium">
                    {group.postsCount || 0} Discussions
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  {group.name}
                </h1>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-3">
              {isOwner ? (
                <>
                  <span
                    className="py-2 px-3.5 rounded-xl font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 select-none"
                    title="You created and own this group"
                  >
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>Owner</span>
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openEditModal}
                    className="gap-1.5 text-xs font-semibold rounded-xl h-9 border-gray-200 hover:bg-gray-50 text-gray-700"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Manage Group</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="py-2 px-3 rounded-xl font-semibold text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer h-9"
                    title="Delete this group permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </>
              ) : isMember ? (
                <button
                  type="button"
                  onClick={handleToggleJoin}
                  disabled={actionLoading}
                  className="py-2 px-4 rounded-xl font-semibold text-xs bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Click to leave group"
                >
                  {actionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Joined</span>
                </button>
              ) : group.isPendingRequest ? (
                <span className="py-2 px-4 rounded-xl font-semibold text-xs bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Request Pending</span>
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={handleToggleJoin}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-5 gap-1.5 shadow-sm"
                >
                  {actionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{group.privacy === 'private' ? 'Request to Join' : 'Join Community'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-100 pt-2">
            {[
              { id: 'discussions', label: 'Discussions', icon: MessageSquare },
              { id: 'members', label: 'Members', icon: Users, count: group.membersCount },
              { id: 'about', label: 'About & Rules', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded-full text-[10px]">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Tab Contents (2 Columns wide) */}
        <div className="lg:col-span-2 space-y-4">
          {/* TAB 1: DISCUSSIONS FEED */}
          {activeTab === 'discussions' && (
            <div className="space-y-4">
              {/* Post Composer Card (if member or owner) */}
              {isMember ? (
                <Card className="border border-gray-100 shadow-xs bg-white rounded-3xl overflow-hidden">
                  <div className="p-4 sm:p-5 space-y-3.5">
                    {/* Author Meta */}
                    <div className="flex items-center gap-3">
                      <img
                        src={user?.avatar || '/assets/images/avatar/01.jpg'}
                        alt={user?.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-gray-900 block truncate">
                          {user?.name || 'Community Member'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                          <span>Sharing in {group.name}</span>
                          {selectedFeeling && (
                            <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <span>{selectedFeeling.emoji}</span>
                              <span className="capitalize">{selectedFeeling.label}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedFeeling(null)}
                                className="ml-0.5 hover:text-red-500 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Textarea with dynamic gradient background */}
                    {(() => {
                      const activeGrad = POST_GRADIENTS.find((g) => g.id === selectedGradient);
                      const isGrad = activeGrad && activeGrad.id !== 'none' && !mediaPreview;
                      return (
                        <div
                          className={`rounded-2xl transition-all ${
                            isGrad
                              ? `${activeGrad.bg} p-6 min-h-[140px] flex items-center justify-center shadow-inner`
                              : 'bg-gray-50/70 border border-gray-200 p-3.5'
                          }`}
                        >
                          <textarea
                            rows={isGrad ? 3 : 3}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder={
                              isGrad
                                ? 'What are you thinking about?...'
                                : `Start a discussion or share insights with ${group.name}...`
                            }
                            disabled={isPosting}
                            className={`w-full text-xs focus:outline-none transition-all resize-none bg-transparent ${
                              isGrad
                                ? 'text-white placeholder:text-white/70 font-bold text-base sm:text-lg text-center drop-shadow-md'
                                : 'text-gray-800 placeholder:text-gray-400'
                            }`}
                          />
                        </div>
                      );
                    })()}

                    {/* Attached Media Preview */}
                    {mediaPreview && (
                      <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-slate-900 max-h-64 group/media">
                        <img
                          src={mediaPreview}
                          alt="Post upload preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeMedia}
                          className="absolute top-2.5 right-2.5 bg-black/70 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors cursor-pointer shadow-md"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Bottom Toolbar & Publish Button */}
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 relative">
                      {/* Media & Styling Triggers */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 text-emerald-500" />
                          <span>Photo / Media</span>
                        </button>

                        {/* Theme Popover Container */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsGradientsOpen((prev) => !prev);
                              setIsFeelingsOpen(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                              isGradientsOpen || selectedGradient !== 'none'
                                ? 'bg-purple-100 text-purple-700'
                                : 'text-purple-600 hover:bg-purple-50'
                            }`}
                          >
                            <Palette className="w-4 h-4 text-purple-500" />
                            <span>Theme</span>
                          </button>

                          {/* Floating Theme Popup */}
                          {isGradientsOpen && !mediaPreview && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setIsGradientsOpen(false)}
                              />
                              <div className="absolute bottom-full mb-2 left-0 sm:left-1/2 sm:-translate-x-1/2 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-64 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                                  <span className="text-[11px] font-bold text-gray-700">Choose Post Theme</span>
                                  <button
                                    type="button"
                                    onClick={() => setIsGradientsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="grid grid-cols-6 gap-2">
                                  {POST_GRADIENTS.map((g) => (
                                    <button
                                      key={g.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedGradient(g.id);
                                        setIsGradientsOpen(false);
                                      }}
                                      className={`h-7 rounded-xl ${g.preview} cursor-pointer transition-transform ${
                                        selectedGradient === g.id
                                          ? 'scale-110 ring-2 ring-blue-500 shadow-sm'
                                          : 'hover:scale-105'
                                      }`}
                                      title={g.label}
                                    />
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Feeling Popover Container */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsFeelingsOpen((prev) => !prev);
                              setIsGradientsOpen(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                              isFeelingsOpen || selectedFeeling
                                ? 'bg-amber-100 text-amber-700'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            <Smile className="w-4 h-4 text-amber-500" />
                            <span>Feeling</span>
                          </button>

                          {/* Floating Feelings Popup */}
                          {isFeelingsOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setIsFeelingsOpen(false)}
                              />
                              <div className="absolute bottom-full mb-2 left-0 sm:left-1/2 sm:-translate-x-1/2 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-72 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                                  <span className="text-[11px] font-bold text-gray-700">How are you feeling?</span>
                                  <button
                                    type="button"
                                    onClick={() => setIsFeelingsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                                  {QUICK_FEELINGS.map((f) => (
                                    <button
                                      key={f.label}
                                      type="button"
                                      onClick={() => {
                                        setSelectedFeeling(f);
                                        setIsFeelingsOpen(false);
                                      }}
                                      className={`p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors flex items-center gap-2 ${
                                        selectedFeeling?.label === f.label
                                          ? 'bg-blue-600 text-white font-bold'
                                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      <span className="text-base">{f.emoji}</span>
                                      <span className="capitalize text-xs">{f.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Publish button */}
                      <Button
                        type="button"
                        onClick={handleCreatePost}
                        size="sm"
                        disabled={(!newPostContent.trim() && !selectedMedia) || isPosting}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 gap-1.5 h-9 font-semibold shadow-xs"
                      >
                        {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Publish</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 border border-amber-200 shadow-xs bg-amber-50/40 rounded-2xl text-center space-y-2">
                  <Lock className="w-6 h-6 text-amber-500 mx-auto" />
                  <h4 className="text-xs font-bold text-amber-900">Members-Only Discussions</h4>
                  <p className="text-xs text-amber-700 max-w-md mx-auto">
                    Join this community group to share posts, participate in discussions, and connect with other members.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleToggleJoin}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs gap-1 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Join Group to Post</span>
                  </Button>
                </Card>
              )}

              {/* Group Posts List */}
              {isLoadingPosts ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-xs font-medium">Loading group discussions...</p>
                </div>
              ) : posts.length === 0 ? (
                <Card className="p-12 text-center text-gray-400 border border-gray-100 shadow-xs bg-white rounded-2xl">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No discussions yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Be the first to start a conversation in this community!
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => {
                    const author = post.createdBy || post.userId;
                    const authorName =
                      author?.username ||
                      `${author?.firstName || ''} ${author?.lastName || ''}`.trim() ||
                      'Member';
                    const authorAvatar =
                      author?.image?.secure_url || author?.avatar || '/assets/images/avatar/01.jpg';

                    // Parse background gradient tag e.g. [bg:candy]
                    const bgMatch = post.content?.match(/\[bg:([a-zA-Z0-9_-]+)\]/);
                    const gradientId = bgMatch ? bgMatch[1] : null;
                    const cleanContent = post.content ? post.content.replace(/\[bg:[a-zA-Z0-9_-]+\]/g, '').trim() : '';
                    const postGrad = gradientId ? POST_GRADIENTS.find((g) => g.id === gradientId) : null;

                    const isLiked = Boolean(
                      post.isLiked ||
                      (Array.isArray(post.likes) && post.likes.some((l: any) => (l?._id || l) === user?.id))
                    );
                    const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;

                    return (
                      <Card
                        key={post._id}
                        className="border border-gray-100 shadow-xs bg-white rounded-3xl overflow-hidden space-y-3"
                      >
                        {/* Post Header */}
                        <div className="p-5 pb-0 flex items-center justify-between relative">
                          <div className="flex items-center gap-3">
                            <Link to={`/profile/${author?._id}`}>
                              <img
                                src={authorAvatar}
                                alt={authorName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/10"
                              />
                            </Link>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Link
                                  to={`/profile/${author?._id}`}
                                  className="text-xs font-bold text-gray-900 hover:text-blue-600 block"
                                >
                                  {authorName}
                                </Link>
                                {author?._id === (typeof group.creator === 'object' ? group.creator._id : group.creator) && (
                                  <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md border border-amber-200">
                                    Owner
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">
                                {formatTimeAgo(post.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Post Action Menu (Edit / Delete / Copy) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuPostId(activeMenuPostId === post._id ? null : post._id)}
                              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                              title="Post options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuPostId === post._id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setActiveMenuPostId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-48 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                                  {/* Author Edit */}
                                  {(author?._id === user?.id || user?.isAdmin) && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditPost(post)}
                                      className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Edit Post</span>
                                    </button>
                                  )}

                                  {/* Copy Link */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`${window.location.origin}/group/${group._id}`);
                                      toast.success('Post link copied to clipboard!');
                                      setActiveMenuPostId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Copy Link</span>
                                  </button>

                                  {/* Delete Post (Author OR Group Owner/Admin) */}
                                  {(author?._id === user?.id || isOwner || group.memberRole === 'admin' || user?.isAdmin) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePost(post._id)}
                                      disabled={deletingPostId === post._id}
                                      className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-gray-50"
                                    >
                                      {deletingPostId === post._id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                      )}
                                      <span>{author?._id === user?.id ? 'Delete Post' : 'Remove Post (Mod)'}</span>
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Post Body (with styled background gradient if tagged) */}
                        {postGrad && (!post.attachments || post.attachments.length === 0) ? (
                          <div className={`p-8 ${postGrad.bg} flex items-center justify-center my-2 text-center`}>
                            <p className="text-white font-extrabold text-base sm:text-lg drop-shadow-md whitespace-pre-wrap max-w-lg leading-relaxed">
                              {cleanContent}
                            </p>
                          </div>
                        ) : (
                          cleanContent && (
                            <p className="px-5 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {cleanContent}
                            </p>
                          )
                        )}

                        {/* Attachments if any */}
                        {post.attachments && post.attachments.length > 0 && (
                          <div className="px-5 overflow-hidden">
                            <div className="rounded-2xl overflow-hidden max-h-96 border border-gray-100 bg-slate-900">
                              <img
                                src={post.attachments[0].secure_url}
                                alt="Post media attachment"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* Interactive Engagement Row (Like, Comment, Share) */}
                        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <button
                            type="button"
                            onClick={() => handleLikePost(post)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                              isLiked
                                ? 'bg-rose-50 text-rose-600 font-bold'
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                            <span>{likesCount > 0 ? `${likesCount} Likes` : 'Like'}</span>
                          </button>

                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-gray-400">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments?.length || 0} Comments</span>
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEMBERS LIST */}
          {activeTab === 'members' && (
            <Card className="border border-gray-100 shadow-xs bg-white rounded-2xl divide-y divide-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50/50 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Community Members ({members.length})</span>
                </h3>
              </div>

              {isLoadingMembers ? (
                <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-xs">Loading members list...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-medium">No members found</p>
                </div>
              ) : (
                members.map((m) => {
                  const memberUser = m.userId;
                  const memberName =
                    memberUser?.username ||
                    `${memberUser?.firstName || ''} ${memberUser?.lastName || ''}`.trim() ||
                    'Member';
                  const memberAvatar =
                    memberUser?.image?.secure_url || memberUser?.avatar || '/assets/images/avatar/01.jpg';
                  const isMemOwner = m.role === 'owner';
                  const isMemAdmin = m.role === 'admin';

                  return (
                    <div
                      key={m._id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Link to={`/profile/${memberUser?._id}`}>
                          <img
                            src={memberAvatar}
                            alt={memberName}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100 hover:opacity-90"
                          />
                        </Link>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/profile/${memberUser?._id}`}
                              className="text-xs font-bold text-gray-900 hover:text-blue-600 truncate"
                            >
                              {memberName}
                            </Link>
                            {isMemOwner && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold text-[9px] flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" /> Owner
                              </span>
                            )}
                            {isMemAdmin && !isMemOwner && (
                              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold text-[9px]">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Joined {formatTimeAgo(m.joinedAt || m.createdAt)}
                          </span>
                        </div>
                      </div>

                      <Link to={`/profile/${memberUser?._id}`}>
                        <Button variant="outline" size="sm" className="text-[11px] h-7 px-3">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  );
                })
              )}
            </Card>
          )}

          {/* TAB 3: ABOUT & RULES */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <Card className="p-6 border border-gray-100 shadow-xs bg-white rounded-2xl space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                    About this Community
                  </h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {group.description || 'Welcome to our group. Connect, collaborate and grow with peers.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-semibold text-gray-800">{group.category}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Privacy:</span>
                    <span className="font-semibold text-gray-800 capitalize">{group.privacy} Group</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Visibility:</span>
                    <span className="font-semibold text-gray-800 capitalize">{group.visibility}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(group.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>

              {group.rules && (
                <Card className="p-6 border border-gray-100 shadow-xs bg-white rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Group Guidelines & Rules</span>
                  </h3>
                  <div className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
                    {group.rules}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Group Sidebar Info */}
        <div className="space-y-4">
          {/* About Summary Card */}
          <Card className="p-5 border border-gray-100 shadow-xs bg-white rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-gray-900">Community Overview</h4>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
              {group.description || 'Join discussions, ask questions, and share updates with this community.'}
            </p>

            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700 capitalize">{group.privacy}</span>
                <span>• Anyone can find this group</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700">{group.membersCount || 1} members</span>
              </div>
            </div>
          </Card>

          {/* Group Creator / Admin Card */}
          {group.creator && (
            <Card className="p-5 border border-gray-100 shadow-xs bg-white rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Group Admin</span>
              </h4>

              <div className="flex items-center gap-3">
                <img
                  src={group.creator.image?.secure_url || '/assets/images/avatar/01.jpg'}
                  alt={group.creator.username}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100"
                />
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-gray-900 truncate">
                    {group.creator.username}
                  </h5>
                  <p className="text-[10px] text-gray-400">Founder & Administrator</p>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Share Link Card */}
          <Card className="p-4 border border-blue-100 bg-blue-50/50 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Invite Friends</span>
            </h5>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Share this group URL with friends to invite them directly to discussions.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={copyShareLink}
              className="w-full text-xs h-8 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Copy Group Link
            </Button>
          </Card>
        </div>
      </div>

      {/* Edit Group Settings Modal (Owner Only) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Manage Community Settings</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleUpdateGroup} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Cover Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose Cover Banner</span>
                </label>
                <div className="h-28 rounded-2xl overflow-hidden border border-gray-200 mb-3 relative bg-slate-900 shadow-inner">
                  <img
                    src={editCover || '/assets/images/bg/02.jpg'}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white">
                    Preview
                  </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {PRESET_COVERS.map((cov, idx) => (
                    <button
                      key={cov}
                      type="button"
                      onClick={() => setEditCover(cov)}
                      className={`h-11 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        editCover === cov
                          ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                          : 'border-gray-200 hover:opacity-80'
                      }`}
                    >
                      <img src={cov} alt={`Cover ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose Group Logo / Avatar</span>
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={editAvatar || '/assets/images/logo/01.svg'}
                    alt="Logo preview"
                    className="w-14 h-14 rounded-2xl border-2 border-white shadow-md bg-white p-1 object-cover ring-1 ring-black/5"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">Community Icon</p>
                    <p className="text-[11px] text-gray-400">Select one from the preset logos below</p>
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {PRESET_LOGOS.map((logo, idx) => (
                    <button
                      key={logo}
                      type="button"
                      onClick={() => setEditAvatar(logo)}
                      className={`p-1.5 rounded-xl border-2 cursor-pointer bg-white transition-all ${
                        editAvatar === logo
                          ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={logo} alt={`Logo ${idx + 1}`} className="w-6 h-6 object-contain mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Group Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Privacy</label>
                <select
                  value={editPrivacy}
                  onChange={(e) => setEditPrivacy(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="public">Public (Anyone can find and join)</option>
                  <option value="private">Private (Join requests require admin approval)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">About Group</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              {/* Rules */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Community Guidelines / Rules</label>
                <textarea
                  rows={2}
                  value={editRules}
                  onChange={(e) => setEditRules(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!editName.trim() || isUpdating}
                  className="rounded-xl gap-1.5"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-gray-900">Delete Community Group?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-800">"{group.name}"</span>? All member discussions and community activity will be permanently archived.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                className="flex-1 rounded-xl text-xs h-9 bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-xs"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Edit Discussion Post</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Discussion Content</label>
              <textarea
                rows={4}
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                placeholder="What would you like to update?..."
                className="w-full text-xs p-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setEditingPost(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="button"
                disabled={!editPostContent.trim() || isUpdatingPost}
                onClick={handleSavePostEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs px-5 font-semibold shadow-xs"
              >
                {isUpdatingPost ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
