import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { followApi, type UserSuggestion } from '../api/follow.api';
import { toast } from '../../../stores/toastStore';
import { useNavigate } from 'react-router-dom';

export const RightWidgets: React.FC = () => {
  const [users, setUsers] = useState<UserSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadSuggestions = async () => {
      try {
        const fetched = await followApi.getSuggestions();
        if (isMounted) {
          if (Array.isArray(fetched) && fetched.length > 0) {
            setUsers(fetched);
          } else {
            setUsers([]);
          }
        }
      } catch {
        if (isMounted) {
          setUsers([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadSuggestions();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleFollow = async (targetUser: UserSuggestion) => {
    const userId = targetUser._id || targetUser.id;
    if (!userId) return;

    setFollowLoading((prev) => ({ ...prev, [userId]: true }));
    const wasFollowing = targetUser.isFollowing;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) =>
        (u._id === userId || u.id === userId)
          ? { ...u, isFollowing: !wasFollowing }
          : u
      )
    );

    try {
      if (wasFollowing) {
        await followApi.unfollowUser(userId);
        toast.info(`You unfollowed ${targetUser.name}`, 'Unfollowed');
      } else {
        await followApi.followUser(userId);
        toast.success(`You are now following ${targetUser.name}!`, 'Followed');
      }
    } catch {
      // Rollback on failure
      setUsers((prev) =>
        prev.map((u) =>
          (u._id === userId || u.id === userId)
            ? { ...u, isFollowing: wasFollowing }
            : u
        )
      );
      toast.error('Could not update follow status. Please try again.');
    } finally {
      setFollowLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const displayedUsers = showAll ? users : users.slice(0, 4);

  const newsItems = [
    { title: 'Ten questions you should answer truthfully', time: '2hr' },
    { title: 'Five unbelievable facts about money', time: '3hr' },
    { title: 'Best Pinterest Boards for learning about business', time: '4hr' },
    { title: 'Skills that you can learn now that will pay off forever', time: '6hr' },
  ];

  return (
    <div className="space-y-5">
      {/* Dynamic Who to Follow Widget */}
      <Card className="border border-gray-100 shadow-xs">
        <CardHeader className="p-4 flex items-center justify-between border-b border-gray-50">
          <h6 className="font-bold text-gray-900 text-sm">Who to follow</h6>
          {users.length > 0 && (
            <span className="text-[11px] font-medium text-gray-400">
              {users.length} members
            </span>
          )}
        </CardHeader>

        <CardBody className="p-4 pt-3 space-y-3.5">
          {isLoading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs">Finding members...</span>
            </div>
          ) : displayedUsers.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No suggestions right now</p>
          ) : (
            displayedUsers.map((item) => {
              const uId = item._id || item.id;
              const isActionLoading = followLoading[uId];
              return (
                <div key={uId} className="flex items-center justify-between gap-3">
                  <div
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2.5 overflow-hidden cursor-pointer group flex-1"
                  >
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-100 group-hover:ring-blue-500 transition-all"
                    />
                    <div className="truncate">
                      <h6 className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </h6>
                      <p className="text-[11px] text-gray-400 truncate">{item.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(item)}
                      disabled={isActionLoading}
                      title={item.isFollowing ? `Unfollow ${item.name}` : `Follow ${item.name}`}
                      aria-label={item.isFollowing ? `Unfollow ${item.name}` : `Follow ${item.name}`}
                      className={`p-2.5 rounded-xl transition-all shrink-0 active:scale-95 cursor-pointer flex items-center justify-center ${
                        item.isFollowing
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-50/90 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {isActionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : item.isFollowing ? (
                        <UserCheck className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}

          <div className="pt-2 text-center border-t border-gray-50 mt-1">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors py-1 cursor-pointer"
            >
              {showAll ? 'Show less' : 'View more'}
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Today's News */}
      <Card className="border border-gray-100 shadow-xs">
        <CardHeader className="p-4 flex items-center justify-between border-b border-gray-50">
          <h6 className="font-bold text-gray-900 text-sm">Today's news</h6>
        </CardHeader>
        <CardBody className="p-4 pt-3 space-y-3">
          {newsItems.map((news, idx) => (
            <div key={idx} className="group cursor-pointer">
              <h6 className="text-xs font-medium text-gray-800 group-hover:text-blue-600 leading-snug transition-colors">
                {news.title}
              </h6>
              <span className="text-[10px] text-gray-400 mt-0.5 block">{news.time}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Footer Links */}
      <div className="px-2 text-[11px] text-gray-400 space-x-2 leading-relaxed">
        <a href="#about" className="hover:underline">About</a>
        <span>•</span>
        <a href="#settings" className="hover:underline">Settings</a>
        <span>•</span>
        <a href="#support" className="hover:underline">Support</a>
        <span>•</span>
        <a href="#privacy" className="hover:underline">Privacy & terms</a>
        <p className="mt-2 text-gray-400">©2026 Social Network</p>
      </div>
    </div>
  );
};
