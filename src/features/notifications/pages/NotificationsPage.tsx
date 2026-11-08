import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import {
  Bell,
  UserPlus,
  UserCheck,
  Heart,
  MessageCircle,
  Trash2,
  CheckCheck,
  Loader2,
  RefreshCw,
  Users,
  Check,
  X,
  Clock,
  ShieldAlert,
  Share2,
  Sparkles
} from 'lucide-react';
import { notificationApi, type NotificationItem } from '../api/notification.api';
import { friendshipApi, type FriendRequestItem } from '../../friendship/api/friendship.api';
import { toast } from '../../../stores/toastStore';
import { useAuth } from '../../auth/context/AuthContext';
import { useNotificationStore } from '../../../stores/notificationStore';
import { getSocket } from '../../../lib/socket';

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

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setUnreadCount, clearUnread, decrementUnread, incrementUnread } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequestItem[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [respondedRequests, setRespondedRequests] = useState<Record<string, 'accepted' | 'declined'>>({});

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [notifs, received, sent] = await Promise.all([
        notificationApi.getMyNotifications(1, 40),
        friendshipApi.getReceivedRequests().catch(() => []),
        friendshipApi.getSentRequests().catch(() => [])
      ]);
      setNotifications(notifs);
      setReceivedRequests(received);
      setSentRequests(sent);

      const unread = notifs.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch {
      toast.error('Could not load notifications.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live Socket.IO listener for real-time notification delivery
  useEffect(() => {
    if (!user) return;
    const socket = getSocket(user.id);

    const handleLiveNotification = (data: any) => {
      if (data) {
        setNotifications((prev) => [data, ...prev]);
        incrementUnread();
        toast.info(data.message || 'You received a new notification', 'New Notification');

        if (data.type === 'friend_request' || data.type === 'friend_accept') {
          friendshipApi.getReceivedRequests().then(setReceivedRequests).catch(() => {});
        }
      }
    };

    socket.on('notification', handleLiveNotification);
    socket.on('message_notification', handleLiveNotification);

    return () => {
      socket.off('notification', handleLiveNotification);
      socket.off('message_notification', handleLiveNotification);
    };
  }, [user, incrementUnread]);

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      clearUnread();
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Could not mark all notifications as read.');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => ((n._id === id || n.id === id) ? { ...n, isRead: true } : n))
      );
      decrementUnread();
    } catch {
      // Ignore background read failures
    }
  };

  const removeNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id && n.id !== id));
      toast.info('Notification removed.');
    } catch {
      toast.error('Could not delete notification.');
    }
  };

  // Friend Request Actions: Accept Request
  const handleAcceptFriendRequest = async (requestIdOrUserId: string, notifId?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [requestIdOrUserId]: true }));
    try {
      await friendshipApi.acceptRequest(requestIdOrUserId);
      toast.success('Friend request accepted! You are now friends.', 'Accepted');

      if (notifId) {
        setRespondedRequests((prev) => ({ ...prev, [notifId]: 'accepted' }));
        handleMarkAsRead(notifId);
      }

      setReceivedRequests((prev) =>
        prev.filter((r) => r._id !== requestIdOrUserId && r.sender?._id !== requestIdOrUserId)
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not accept request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestIdOrUserId]: false }));
    }
  };

  // Friend Request Actions: Reject Request
  const handleRejectFriendRequest = async (requestIdOrUserId: string, notifId?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [requestIdOrUserId]: true }));
    try {
      await friendshipApi.rejectRequest(requestIdOrUserId);
      toast.info('Friend request declined.', 'Declined');

      if (notifId) {
        setRespondedRequests((prev) => ({ ...prev, [notifId]: 'declined' }));
        handleMarkAsRead(notifId);
      }

      setReceivedRequests((prev) =>
        prev.filter((r) => r._id !== requestIdOrUserId && r.sender?._id !== requestIdOrUserId)
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not decline request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestIdOrUserId]: false }));
    }
  };

  // Cancel sent friend request
  const handleCancelSentRequest = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      await friendshipApi.cancelRequest(requestId);
      toast.info('Sent friend request cancelled.', 'Cancelled');
      setSentRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not cancel request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // Handle clicking a notification row (navigate to relevant page)
  const handleNotificationClick = (notif: NotificationItem) => {
    const notifId = notif._id || notif.id;
    if (!notif.isRead) {
      handleMarkAsRead(notifId);
    }

    // Determine target navigation based on type & entity
    if (
      notif.type.startsWith('support_') ||
      notif.type.startsWith('appeal_') ||
      notif.type === 'content_removed'
    ) {
      navigate('/help/support-inbox');
      return;
    }

    if (
      notif.type === 'like_post' ||
      notif.type === 'reaction_post' ||
      notif.type === 'comment' ||
      notif.type === 'reply' ||
      notif.type === 'post_share'
    ) {
      if (notif.entityId) {
        navigate(`/feed?postId=${notif.entityId}`);
      } else {
        navigate('/feed');
      }
      return;
    }

    if (
      notif.type === 'follow' ||
      notif.type === 'friend_request' ||
      notif.type === 'friend_accept'
    ) {
      const targetUserId = notif.actor?._id || notif.entityId;
      if (targetUserId) {
        navigate(`/profile/${targetUserId}`);
      }
    }
  };

  // Parse notification text cleanly (avoids "Member mohamed ahmed" or duplicated prefixes)
  const parseNotificationContent = (notif: NotificationItem) => {
    const actor = notif.actor;
    const actorDisplayName =
      actor?.username ||
      (actor?.firstName ? `${actor.firstName} ${actor.lastName || ''}`.trim() : '');

    const rawMsg = (notif.message || '').trim();

    // 1. If raw message starts with actor's name, split cleanly
    if (actorDisplayName && rawMsg.toLowerCase().startsWith(actorDisplayName.toLowerCase())) {
      const rest = rawMsg.slice(actorDisplayName.length).trim();
      return {
        actorName: actorDisplayName,
        actionText: rest || 'interacted with your content'
      };
    }

    // 2. Try matching standard action phrases
    const match = rawMsg.match(
      /^(.*?)\s+(liked your|reacted to your|sent you|started following|commented on|replied to|shared your|accepted your|reported your|reviewed your)(.*)$/i
    );
    if (match) {
      return {
        actorName: actorDisplayName || match[1] || 'Someone',
        actionText: `${match[2]}${match[3]}`
      };
    }

    // 3. System / moderation notifications
    if (
      notif.type === 'support_reply' ||
      notif.type === 'appeal_approved' ||
      notif.type === 'appeal_rejected' ||
      notif.type === 'content_removed'
    ) {
      return {
        actorName: 'Moderation Team',
        actionText: rawMsg || 'updated your case status'
      };
    }

    // 4. Default fallbacks based on type
    const defaultActions: Record<string, string> = {
      friend_request: 'sent you a friend request.',
      friend_accept: 'accepted your friend request.',
      follow: 'started following you.',
      like_post: 'liked your post.',
      reaction_post: 'reacted to your post.',
      comment: 'commented on your post.',
      reply: 'replied to your comment.',
      post_share: 'shared your post.',
      story_reaction: 'reacted to your story.',
      story_reply: 'replied to your story.'
    };

    return {
      actorName: actorDisplayName || 'Someone',
      actionText: defaultActions[notif.type] || rawMsg || 'interacted with your profile.'
    };
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notifications & Requests
          </h1>
          <p className="text-xs text-gray-500">Manage interactions, alerts, and friend connections</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {activeTab === 'all' && unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
              <CheckCheck className="w-4 h-4 text-blue-600" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          All Notifications
          {unreadCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Friend Requests
          {receivedRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
              {receivedRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: All Notifications */}
      {activeTab === 'all' && (
        <Card className="border border-gray-100 divide-y divide-gray-100 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-0.5">
                When members interact with your profile or send requests, they will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const notifId = notif._id || notif.id;
              const { actorName, actionText } = parseNotificationContent(notif);
              const actorAvatar =
                notif.actor?.image?.secure_url ||
                notif.actor?.avatar ||
                '/assets/images/avatar/01.jpg';
              const isFriendReq = notif.type === 'friend_request';
              const targetEntityId = notif.entityId || notif.actor?._id || '';
              const friendReqStatus = respondedRequests[notifId];

              return (
                <div
                  key={notifId}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                    !notif.isRead
                      ? 'bg-blue-50/50 hover:bg-blue-50/80 border-l-4 border-l-blue-600'
                      : 'bg-white hover:bg-gray-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Avatar with type badge */}
                    <div
                      className="relative shrink-0 cursor-pointer"
                      onClick={(e) => {
                        if (notif.actor?._id) {
                          e.stopPropagation();
                          navigate(`/profile/${notif.actor._id}`);
                        }
                      }}
                    >
                      <img
                        src={actorAvatar}
                        alt={actorName}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100 hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-xs">
                        {isFriendReq && <Users className="w-3 h-3 text-purple-600" />}
                        {notif.type === 'friend_accept' && <UserCheck className="w-3 h-3 text-emerald-600" />}
                        {notif.type === 'follow' && <UserPlus className="w-3 h-3 text-blue-600" />}
                        {(notif.type === 'like_post' || notif.type === 'reaction_post') && (
                          <Heart className="w-3 h-3 text-red-500 fill-current" />
                        )}
                        {(notif.type === 'comment' || notif.type === 'reply') && (
                          <MessageCircle className="w-3 h-3 text-emerald-500" />
                        )}
                        {notif.type === 'story_reaction' && (
                          <Sparkles className="w-3 h-3 text-rose-500 fill-current" />
                        )}
                        {notif.type === 'story_reply' && (
                          <MessageCircle className="w-3 h-3 text-blue-500" />
                        )}
                        {notif.type === 'post_share' && <Share2 className="w-3 h-3 text-blue-500" />}
                        {(notif.type.startsWith('support_') ||
                          notif.type.startsWith('appeal_') ||
                          notif.type === 'content_removed') && (
                          <ShieldAlert className="w-3 h-3 text-amber-500" />
                        )}
                        {notif.type !== 'follow' &&
                          notif.type !== 'like_post' &&
                          notif.type !== 'reaction_post' &&
                          notif.type !== 'comment' &&
                          notif.type !== 'reply' &&
                          notif.type !== 'post_share' &&
                          !isFriendReq &&
                          notif.type !== 'friend_accept' &&
                          !notif.type.startsWith('support_') &&
                          !notif.type.startsWith('appeal_') &&
                          notif.type !== 'content_removed' && (
                            <Bell className="w-3 h-3 text-blue-600" />
                          )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-xs min-w-0">
                      <p className="text-gray-900 leading-normal">
                        <span
                          className="font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={(e) => {
                            if (notif.actor?._id) {
                              e.stopPropagation();
                              navigate(`/profile/${notif.actor._id}`);
                            }
                          }}
                        >
                          {actorName}
                        </span>{' '}
                        <span className="text-gray-700">{actionText}</span>
                      </p>

                      <span className="text-gray-400 text-[10px] block mt-0.5">
                        {formatTimeAgo(notif.createdAt)}
                      </span>

                      {/* Interactive Accept / Decline for Friend Request notifications */}
                      {isFriendReq && (
                        <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          {friendReqStatus === 'accepted' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                              <Check className="w-3.5 h-3.5" />
                              Friends
                            </span>
                          ) : friendReqStatus === 'declined' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
                              Request declined
                            </span>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={actionLoading[targetEntityId]}
                                onClick={(e) => handleAcceptFriendRequest(targetEntityId, notifId, e)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] py-1 px-3 gap-1 rounded-md"
                              >
                                {actionLoading[targetEntityId] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionLoading[targetEntityId]}
                                onClick={(e) => handleRejectFriendRequest(targetEntityId, notifId, e)}
                                className="text-gray-600 hover:text-red-600 text-[11px] py-1 px-3 gap-1 rounded-md"
                              >
                                <X className="w-3 h-3" />
                                Decline
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Read dot */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" title="Unread" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => removeNotification(notifId, e)}
                      className="text-gray-300 hover:text-red-500 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                      title="Remove notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      )}

      {/* Tab: Dedicated Friend Requests Management */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Received Requests */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center justify-between">
              <span>Received Requests</span>
              <span className="text-xs text-gray-400 font-normal">{receivedRequests.length} pending</span>
            </h2>

            <Card className="border border-gray-100 divide-y divide-gray-100 shadow-xs overflow-hidden">
              {receivedRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <UserPlus className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-gray-600">No incoming friend requests</p>
                  <p className="text-[11px] text-gray-400">You're all caught up!</p>
                </div>
              ) : (
                receivedRequests.map((req) => {
                  const sender = req.sender;
                  const senderAvatar =
                    sender?.image?.secure_url || sender?.avatar || '/assets/images/avatar/01.jpg';
                  const senderName =
                    sender?.username ||
                    `${sender?.firstName || ''} ${sender?.lastName || ''}`.trim() ||
                    'User';
                  const reqId = req._id;

                  return (
                    <div
                      key={reqId}
                      className="p-4 flex items-center justify-between gap-3 bg-white hover:bg-gray-50/70"
                    >
                      <div
                        className="flex items-center gap-3 min-w-0 cursor-pointer"
                        onClick={() => sender?._id && navigate(`/profile/${sender._id}`)}
                      >
                        <img
                          src={senderAvatar}
                          alt={senderName}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100 hover:opacity-90"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 hover:text-blue-600 truncate">
                            {senderName}
                          </h4>
                          <p className="text-[11px] text-gray-400">{sender?.email || 'Sent you a friend request'}</p>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            {formatTimeAgo(req.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={actionLoading[reqId]}
                          onClick={() => handleAcceptFriendRequest(reqId)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-3 gap-1 rounded-md"
                        >
                          {actionLoading[reqId] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading[reqId]}
                          onClick={() => handleRejectFriendRequest(reqId)}
                          className="text-gray-600 hover:text-red-600 text-xs py-1 px-3 gap-1 rounded-md"
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </Card>
          </div>

          {/* Sent Requests */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center justify-between">
              <span>Sent Requests</span>
              <span className="text-xs text-gray-400 font-normal">{sentRequests.length} pending</span>
            </h2>

            <Card className="border border-gray-100 divide-y divide-gray-100 shadow-xs overflow-hidden">
              {sentRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Clock className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-gray-600">No pending sent requests</p>
                  <p className="text-[11px] text-gray-400">
                    Friend requests you send to other members will appear here.
                  </p>
                </div>
              ) : (
                sentRequests.map((req) => {
                  const receiver = req.receiver;
                  const receiverAvatar =
                    receiver?.image?.secure_url || receiver?.avatar || '/assets/images/avatar/01.jpg';
                  const receiverName =
                    receiver?.username ||
                    `${receiver?.firstName || ''} ${receiver?.lastName || ''}`.trim() ||
                    'User';
                  const reqId = req._id;

                  return (
                    <div
                      key={reqId}
                      className="p-4 flex items-center justify-between gap-3 bg-white hover:bg-gray-50/70"
                    >
                      <div
                        className="flex items-center gap-3 min-w-0 cursor-pointer"
                        onClick={() => receiver?._id && navigate(`/profile/${receiver._id}`)}
                      >
                        <img
                          src={receiverAvatar}
                          alt={receiverName}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100 hover:opacity-90"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 hover:text-blue-600 truncate">
                            {receiverName}
                          </h4>
                          <p className="text-[11px] text-gray-400">Waiting for response...</p>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            {formatTimeAgo(req.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading[reqId]}
                          onClick={() => handleCancelSentRequest(reqId)}
                          className="text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 text-xs py-1 px-3 gap-1 rounded-md"
                        >
                          {actionLoading[reqId] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          Cancel Request
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
