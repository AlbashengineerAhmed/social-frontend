import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Clock, 
  Loader2, 
  Check, 
  X 
} from 'lucide-react';
import { friendshipApi, type FriendshipStatus } from '../api/friendship.api';
import { toast } from '../../../stores/toastStore';

interface FriendshipButtonProps {
  userId: string;
  userName?: string;
  initialStatus?: FriendshipStatus;
  initialRequestId?: string;
  onStatusChange?: (newStatus: FriendshipStatus) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'full';
}

export const FriendshipButton: React.FC<FriendshipButtonProps> = ({
  userId,
  userName = 'User',
  initialStatus,
  initialRequestId,
  onStatusChange,
  size = 'sm',
  variant = 'compact'
}) => {
  const [status, setStatus] = useState<FriendshipStatus>(initialStatus || 'none');
  const [requestId, setRequestId] = useState<string | undefined>(initialRequestId);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(!initialStatus);

  useEffect(() => {
    if (!initialStatus && userId) {
      let isMounted = true;
      setIsChecking(true);
      friendshipApi.getStatus(userId)
        .then((res) => {
          if (isMounted) {
            setStatus(res.status);
            if (res.requestId) setRequestId(res.requestId);
          }
        })
        .catch(() => {
          // Keep default 'none'
        })
        .finally(() => {
          if (isMounted) setIsChecking(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [userId, initialStatus]);

  const handleSendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      const res = await friendshipApi.sendRequest(userId);
      setStatus('pending_sent');
      if (res?._id) setRequestId(res._id);
      onStatusChange?.('pending_sent');
      toast.success(`Friend request sent to ${userName}`, 'Request Sent');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not send friend request';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await friendshipApi.cancelRequest(requestId || userId);
      setStatus('none');
      setRequestId(undefined);
      onStatusChange?.('none');
      toast.info('Friend request cancelled', 'Cancelled');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not cancel friend request';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await friendshipApi.acceptRequest(requestId || userId);
      setStatus('friends');
      onStatusChange?.('friends');
      toast.success(`You and ${userName} are now friends!`, 'Request Accepted');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not accept friend request';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await friendshipApi.rejectRequest(requestId || userId);
      setStatus('none');
      setRequestId(undefined);
      onStatusChange?.('none');
      toast.info('Friend request declined', 'Declined');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not decline friend request';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove ${userName} from your friends?`)) {
      return;
    }
    setIsLoading(true);
    try {
      await friendshipApi.removeFriend(userId);
      setStatus('none');
      onStatusChange?.('none');
      toast.info(`Removed ${userName} from friends`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not remove friend';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'self') return null;

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-1 text-gray-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </div>
    );
  }

  // Pending Received (Another user sent request to current user)
  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          size={size}
          variant="primary"
          onClick={handleAcceptRequest}
          disabled={isLoading}
          className="gap-1 text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Accept
        </Button>
        <Button
          size={size}
          variant="outline"
          onClick={handleRejectRequest}
          disabled={isLoading}
          className="gap-1 text-xs py-1 px-2 text-gray-500 hover:text-red-600"
        >
          <X className="w-3.5 h-3.5" />
          Decline
        </Button>
      </div>
    );
  }

  // Pending Sent (Current user sent request, waiting for response)
  if (status === 'pending_sent') {
    return (
      <Button
        size={size}
        variant="outline"
        onClick={handleCancelRequest}
        disabled={isLoading}
        className="gap-1.5 text-xs text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
        title="Click to cancel friend request"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-amber-600" />
        )}
        {variant === 'full' ? 'Cancel Friend Request' : 'Requested'}
      </Button>
    );
  }

  // Already Friends
  if (status === 'friends') {
    return (
      <Button
        size={size}
        variant="outline"
        onClick={handleRemoveFriend}
        disabled={isLoading}
        className="gap-1.5 text-xs text-blue-700 bg-blue-50 border-blue-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors group"
        title="Click to remove friend"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <UserCheck className="w-3.5 h-3.5 text-blue-600 group-hover:hidden" />
            <UserX className="w-3.5 h-3.5 text-red-600 hidden group-hover:block" />
          </>
        )}
        <span className="group-hover:hidden">{variant === 'full' ? 'Friends' : 'Friend'}</span>
        <span className="hidden group-hover:inline">Remove</span>
      </Button>
    );
  }

  // None (Not friends)
  return (
    <Button
      size={size}
      variant="outline"
      onClick={handleSendRequest}
      disabled={isLoading}
      className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <UserPlus className="w-3.5 h-3.5" />
      )}
      {variant === 'full' ? 'Add Friend' : 'Add'}
    </Button>
  );
};

