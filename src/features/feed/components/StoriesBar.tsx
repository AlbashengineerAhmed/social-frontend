import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import type { User } from '../../../types';
import { CreateModal } from '../../../components/modals/CreateModal';
import { StoryViewerModal, type StoryItem, type UserStoryGroup } from '../../../components/modals/StoryViewerModal';
import { storyApi } from '../api/story.api';
import { toast } from '../../../stores/toastStore';

export const StoriesBar: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myStories, setMyStories] = useState<StoryItem[]>([]);
  const [accountGroups, setAccountGroups] = useState<UserStoryGroup[]>([]);

  // Story Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Load active stories from backend
  const fetchStories = useCallback(async () => {
    try {
      // 1. Fetch own active stories
      const myRes = (await storyApi.getMyStories()) as any;
      const myRaw = Array.isArray(myRes.data?.stories)
        ? myRes.data.stories
        : Array.isArray(myRes.stories)
        ? myRes.stories
        : [];

      if (myRaw.length > 0) {
        const mappedMy: StoryItem[] = myRaw.map((s: any) => ({
          id: s._id,
          author: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
          },
          content: s.content,
          mediaUrl: s.media?.secure_url,
          mediaType: s.media?.type || (s.media?.secure_url?.endsWith('.mp4') ? 'video' : 'image'),
          backgroundColor: s.backgroundColor || '#2563eb',
          textColor: s.textColor || '#FFFFFF',
          location: s.location,
          music: s.music,
          stickers: Array.isArray(s.stickers) ? s.stickers : [],
          createdAt: s.createdAt
            ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
        }));
        setMyStories(mappedMy);
      } else {
        setMyStories([]);
      }

      // 2. Fetch community / following feed stories (grouped by account)
      const feedRes = (await storyApi.getStoryFeed()) as any;
      const feedGroups = feedRes.data?.feed || feedRes.feed || [];

      if (Array.isArray(feedGroups) && feedGroups.length > 0) {
        const groups: UserStoryGroup[] = [];

        feedGroups.forEach((g: any) => {
          if (!g.user || !Array.isArray(g.stories) || g.stories.length === 0) return;
          const u = g.user;
          const uId = u._id?.toString() || u.id;

          // Skip own stories from community feed since they are in myStories
          if (uId === currentUser.id) return;

          const authorName = (u.firstName && u.lastName)
            ? `${u.firstName} ${u.lastName}`
            : u.username || 'Community Member';

          const authorAvatar =
            u.image?.secure_url ||
            u.profilePicture?.secure_url ||
            '/assets/images/avatar/01.jpg';

          const stories: StoryItem[] = g.stories.map((s: any) => ({
            id: s._id,
            author: {
              id: uId,
              name: authorName,
              avatar: authorAvatar,
            },
            content: s.content,
            mediaUrl: s.media?.secure_url,
            mediaType: s.media?.type || (s.media?.secure_url?.endsWith('.mp4') ? 'video' : 'image'),
            backgroundColor: s.backgroundColor || '#3b82f6',
            textColor: s.textColor || '#FFFFFF',
            location: s.location,
            music: s.music,
            stickers: Array.isArray(s.stickers) ? s.stickers : [],
            createdAt: s.createdAt
              ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recent',
          }));

          groups.push({
            userId: uId,
            user: {
              id: uId,
              name: authorName,
              avatar: authorAvatar,
            },
            stories,
          });
        });

        setAccountGroups(groups);
      } else {
        setAccountGroups([]);
      }
    } catch (err) {
      console.warn('Stories fetch error:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Handle new story upload to backend
  const handleStoryCreated = async (
    content: string,
    mediaFile?: File,
    visibility?: string,
    extraOptions?: {
      backgroundColor?: string;
      textColor?: string;
      music?: any;
      stickers?: any[];
      location?: any;
      textPosition?: { x: number; y: number };
    }
  ) => {
    try {
      const res = (await storyApi.createStory(
        content,
        mediaFile,
        visibility || 'public',
        extraOptions?.backgroundColor,
        extraOptions?.music,
        extraOptions?.stickers,
        extraOptions?.textColor,
        extraOptions?.location,
        extraOptions?.textPosition
      )) as any;
      const s = res.story || res.data?.story;

      const createdItem: StoryItem = {
        id: s?._id || `story_${Date.now()}`,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
        content: s?.content || content,
        mediaUrl: s?.media?.secure_url || (mediaFile ? URL.createObjectURL(mediaFile) : undefined),
        mediaType: s?.media?.type || (mediaFile?.type?.startsWith('video') ? 'video' : 'image'),
        backgroundColor: s?.backgroundColor || extraOptions?.backgroundColor || '#2563eb',
        textColor: s?.textColor || extraOptions?.textColor || '#FFFFFF',
        music: s?.music || extraOptions?.music,
        stickers: s?.stickers || extraOptions?.stickers || [],
        textPosition: s?.textPosition || extraOptions?.textPosition,
        location: s?.location || extraOptions?.location,
        createdAt: 'Just now',
      };

      const updatedMy = [createdItem, ...myStories];
      setMyStories(updatedMy);

      toast.success('Your story has been uploaded and is live for 24 hours!', 'Story Published');

      // Open viewer immediately for newly uploaded story
      setActiveGroupIndex(0);
      setActiveStoryIndex(0);
      setViewerOpen(true);
    } catch (err: unknown) {
      console.error('Failed to create story:', err);
      toast.error('Could not upload story. Please try again.', 'Upload Error');
      throw err;
    }
  };

  // Handle delete story
  const handleDeleteStory = async (storyId: string) => {
    try {
      await storyApi.deleteStory(storyId);
      setMyStories((prev) => prev.filter((s) => s.id !== storyId));
      fetchStories();
    } catch (err) {
      console.error('Failed to delete story:', err);
      throw err;
    }
  };

  const hasMyActiveStory = myStories.length > 0;

  // Build full normalized story groups for the viewer
  const allViewerGroups: UserStoryGroup[] = [
    ...(hasMyActiveStory
      ? [
          {
            userId: currentUser.id,
            user: {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar,
            },
            stories: myStories,
          },
        ]
      : []),
    ...accountGroups,
  ];

  const handleOpenMyStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMyActiveStory) {
      setActiveGroupIndex(0);
      setActiveStoryIndex(0);
      setViewerOpen(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const handleOpenAccountStories = (targetGroupIndex: number) => {
    setActiveGroupIndex(targetGroupIndex);
    setActiveStoryIndex(0);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 min-w-max">
          {/* User Account Story Card / Create Trigger */}
          <div className="flex flex-col items-center gap-1.5 cursor-pointer group select-none">
            <div className="relative" onClick={handleOpenMyStory}>
              <div
                className={`p-0.5 rounded-full transition-transform group-hover:scale-105 ${
                  hasMyActiveStory
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2.5px] shadow-xs'
                    : 'border-2 border-dashed border-blue-500 p-0.5'
                }`}
              >
                <div className="bg-white p-0.5 rounded-full">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Story count badge on own avatar if multiple active stories */}
              {hasMyActiveStory && myStories.length > 1 && (
                <span className="absolute -top-1 -left-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white shadow-xs">
                  {myStories.length}
                </span>
              )}

              {/* Plus Button to add another story anytime */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
                className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white text-[11px] ring-2 ring-white font-bold transition-transform hover:scale-110 shadow-xs cursor-pointer"
                title="Create a new story"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-[11px] font-semibold text-gray-800 max-w-[70px] truncate text-center">
              {hasMyActiveStory ? 'Your Story' : 'Add Story'}
            </span>
          </div>

          {/* Stories Stream from Other Accounts (Separated Strictly per User) */}
          {accountGroups.map((group, idx) => {
            const storiesCount = group.stories.length;
            const targetViewerGroupIndex = hasMyActiveStory ? idx + 1 : idx;
            const firstName = group.user.name.split(' ')[0] || group.user.name;

            return (
              <div
                key={group.userId}
                onClick={() => handleOpenAccountStories(targetViewerGroupIndex)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group select-none relative"
              >
                <div className="relative">
                  {/* Distinct Instagram-style Gradient Ring */}
                  <div className="bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2.5px] rounded-full transition-transform group-hover:scale-105 shadow-xs">
                    <div className="bg-white p-0.5 rounded-full">
                      <img
                        src={group.user.avatar}
                        alt={group.user.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Multi-story count badge (e.g. 2, 3 stories) */}
                  {storiesCount > 1 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white shadow-xs">
                      {storiesCount}
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-gray-700 font-medium max-w-[68px] truncate text-center group-hover:text-blue-600 transition-colors">
                  {firstName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Story Creation Modal */}
      <CreateModal
        isOpen={showCreateModal}
        type="story"
        currentUser={currentUser}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleStoryCreated}
      />

      {/* Multi-Account Fullscreen Story Viewer */}
      <StoryViewerModal
        isOpen={viewerOpen}
        storyGroups={allViewerGroups}
        initialGroupIndex={activeGroupIndex}
        initialStoryIndex={activeStoryIndex}
        currentUserId={currentUser.id}
        onDeleteStory={handleDeleteStory}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
};
