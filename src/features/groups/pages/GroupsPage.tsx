import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { 
  Users, 
  Search, 
  Plus, 
  UserCheck, 
  Clock, 
  Lock, 
  Globe, 
  Loader2, 
  X,
  Crown,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { groupApi, type Group } from '../api/group.api';
import { toast } from '../../../stores/toastStore';
import { useAuth } from '../../auth/context/AuthContext';

const CATEGORIES = ['All', 'Technology', 'Community', 'Health', 'Design', 'Business'];

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

export const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Create Group Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCategory, setCreateCategory] = useState('Technology');
  const [createPrivacy, setCreatePrivacy] = useState<'public' | 'private'>('public');
  const [createRules, setCreateRules] = useState('');
  const [createCover, setCreateCover] = useState('/assets/images/bg/02.jpg');
  const [createAvatar, setCreateAvatar] = useState('/assets/images/logo/01.svg');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'my') {
        const myGroups = await groupApi.getMyGroups();
        setGroups(Array.isArray(myGroups) ? myGroups : []);
      } else {
        const res = await groupApi.getGroups({
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          search: search.trim() || undefined,
        });
        setGroups(Array.isArray(res?.groups) ? res.groups : []);
      }
    } catch {
      toast.error('Could not load groups. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [activeTab, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGroups();
  };

  const handleToggleJoin = async (group: Group) => {
    const isOwner =
      group.memberRole === 'owner' ||
      (typeof group.creator === 'object' && group.creator?._id === user?.id) ||
      group.creator === user?.id;

    if (isOwner) {
      toast.info('You are the owner of this group. Owners cannot leave their group.');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [group._id]: true }));
    try {
      const res = await groupApi.toggleJoinGroup(group._id);
      setGroups((prev) =>
        prev.map((g) => {
          if (g._id !== group._id) return g;
          const isNowMember = res.isMember;
          const isPending = res.isPendingRequest;
          return {
            ...g,
            isMember: isNowMember,
            isPendingRequest: isPending,
            membersCount: isNowMember
              ? (g.membersCount || 0) + 1
              : Math.max(0, (g.membersCount || 1) - 1),
          };
        })
      );
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update membership');
    } finally {
      setActionLoading((prev) => ({ ...prev, [group._id]: false }));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await groupApi.createGroup({
        name: createName.trim(),
        description: createDesc.trim(),
        category: createCategory,
        privacy: createPrivacy,
        rules: createRules.trim(),
        cover: createCover,
        avatar: createAvatar,
      });
      toast.success('Group created successfully!', 'Created');
      setIsCreateOpen(false);
      setCreateName('');
      setCreateDesc('');
      setCreateRules('');
      setCreateCover('/assets/images/bg/02.jpg');
      setCreateAvatar('/assets/images/logo/01.svg');

      if (created?._id) {
        navigate(`/groups/${created._id}`);
      } else {
        loadGroups();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGroupFeed = (group: Group) => {
    navigate(`/groups/${group._id}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Community Groups</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Connect, discuss, and collaborate with teams, clubs, and peers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 w-44 sm:w-60 transition-all focus:bg-white"
            />
          </form>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 shrink-0 rounded-xl py-2 px-3 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </Button>
        </div>
      </div>

      {/* Tabs & Categories Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Explore Groups
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'my'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Groups
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Groups Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Loading communities...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-semibold text-gray-900 text-base">No groups found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {activeTab === 'my'
              ? 'You have not joined any groups yet. Explore available groups and join one!'
              : 'Try searching with a different term or select another category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups.map((group) => {
            const isActing = actionLoading[group._id];
            const isOwner =
              group.memberRole === 'owner' ||
              (typeof group.creator === 'object' && group.creator?._id === user?.id) ||
              group.creator === user?.id;
            const isMember = Boolean(group.isMember || isOwner);
            return (
              <Card
                key={group._id}
                className="border border-gray-100 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-shadow group"
              >
                <div>
                  {/* Cover */}
                  <div 
                    onClick={() => openGroupFeed(group)}
                    className="h-28 overflow-hidden relative bg-slate-900 cursor-pointer"
                  >
                    <img
                      src={group.cover?.secure_url || '/assets/images/bg/02.jpg'}
                      alt={group.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-white flex items-center gap-1 font-medium">
                      {group.privacy === 'private' ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Private</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span>Public</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Body & Info */}
                  <div className="p-4 pt-0 text-center relative">
                    <div 
                      onClick={() => openGroupFeed(group)}
                      className="-mt-8 mb-2 inline-block cursor-pointer"
                    >
                      <img
                        src={group.avatar?.secure_url || '/assets/images/logo/01.svg'}
                        alt={group.name}
                        className="w-14 h-14 rounded-2xl border-2 border-white shadow-sm bg-white p-1 object-cover mx-auto ring-1 ring-black/5 hover:scale-105 transition-transform"
                      />
                    </div>

                    <h4
                      onClick={() => openGroupFeed(group)}
                      className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {group.name}
                    </h4>
                    <p className="text-[11px] text-blue-600 font-medium mt-0.5">{group.category}</p>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {group.description || 'Welcome to our community group. Share, collaborate and grow together.'}
                    </p>

                    <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-50">
                      <span>{group.membersCount || 1} Members</span>
                      <span>•</span>
                      <span>{group.postsCount || 0} Posts</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openGroupFeed(group)}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    <span>View Group</span>
                  </button>

                  {isOwner ? (
                    <span
                      className="py-1.5 px-3.5 rounded-xl font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center gap-1.5 shrink-0 select-none cursor-default"
                      title="You are the creator and owner of this group"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>Owner</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleJoin(group)}
                      disabled={isActing}
                      className={`py-1.5 px-3.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                        isMember
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                          : group.isPendingRequest
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                      }`}
                    >
                      {isActing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isMember ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Joined</span>
                        </>
                      ) : group.isPendingRequest ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{group.privacy === 'private' ? 'Request' : 'Join'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Create New Community</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Cover Banner Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose Cover Banner</span>
                </label>
                <div className="h-28 rounded-2xl overflow-hidden border border-gray-200 mb-3 relative bg-slate-900 shadow-inner">
                  <img
                    src={createCover}
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
                      onClick={() => setCreateCover(cov)}
                      className={`h-11 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        createCover === cov
                          ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                          : 'border-gray-200 hover:opacity-80'
                      }`}
                    >
                      <img src={cov} alt={`Cover ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo / Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose Community Icon / Logo</span>
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={createAvatar}
                    alt="Logo preview"
                    className="w-12 h-12 rounded-2xl border-2 border-white shadow-md bg-white p-1 object-cover ring-1 ring-black/5"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">
                      {createName.trim() || 'Your Community Name'}
                    </p>
                    <p className="text-[11px] text-gray-400">Select an icon for your group card</p>
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {PRESET_LOGOS.map((logo, idx) => (
                    <button
                      key={logo}
                      type="button"
                      onClick={() => setCreateAvatar(logo)}
                      className={`p-1.5 rounded-xl border-2 cursor-pointer bg-white transition-all ${
                        createAvatar === logo
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
                    placeholder="e.g. Next.js Developers"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Privacy</label>
                <select
                  value={createPrivacy}
                  onChange={(e) => setCreatePrivacy(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="public">Public (Instant Join)</option>
                  <option value="private">Private (Admin Review)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What is this group about?"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              {/* Rules */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Group Guidelines / Rules</label>
                <textarea
                  rows={2}
                  placeholder="Rules for group members..."
                  value={createRules}
                  onChange={(e) => setCreateRules(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!createName.trim() || isSubmitting}
                  className="rounded-xl gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Create Community</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
