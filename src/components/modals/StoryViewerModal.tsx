import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Heart, Send, Pause, Play, Sparkles, Trash2, Loader2, MapPin, Eye, ChevronUp, Users, Clock, Music, Volume2, VolumeX } from 'lucide-react';
import { toast } from '../../stores/toastStore';
import { storyApi } from '../../features/feed/api/story.api';
import { STORY_GRADIENTS } from './CreateModal';

export const resolveStoryBackground = (color?: string): React.CSSProperties => {
  if (!color) {
    return { background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)' };
  }
  if (color.startsWith('linear-gradient') || color.startsWith('#') || color.startsWith('rgb')) {
    return { background: color };
  }
  const match = STORY_GRADIENTS.find((g) => g.id === color || g.bg === color);
  if (match?.css) {
    return { background: match.css };
  }
  if (color.includes('purple')) {
    return { background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #ec4899 100%)' };
  }
  if (color.includes('ocean') || color.includes('cyan') || color.includes('blue')) {
    return { background: 'linear-gradient(135deg, #2563eb 0%, #14b8a6 50%, #34d399 100%)' };
  }
  if (color.includes('fire') || color.includes('yellow') || color.includes('orange')) {
    return { background: 'linear-gradient(135deg, #facc15 0%, #f97316 50%, #dc2626 100%)' };
  }
  if (color.includes('dark') || color.includes('gray')) {
    return { background: 'linear-gradient(135deg, #09090b 0%, #0f172a 50%, #18181b 100%)' };
  }
  return { background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)' };
};

export interface StoryItem {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  backgroundColor?: string;
  textColor?: string;
  location?: {
    name?: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  music?: {
    title: string;
    artist: string;
    audioUrl: string;
    cover?: string;
    startTime?: number;
    duration?: number;
    x?: number;
    y?: number;
  };
  stickers?: Array<{ type: string; text: string; x?: number; y?: number }>;
  textPosition?: { x: number; y: number };
  createdAt?: string;
}

export interface UserStoryGroup {
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  stories: StoryItem[];
}

interface StoryViewerModalProps {
  isOpen: boolean;
  storyGroups?: UserStoryGroup[];
  stories?: StoryItem[]; // Legacy fallback
  initialGroupIndex?: number;
  initialStoryIndex?: number;
  initialIndex?: number; // Legacy fallback
  currentUserId?: string;
  onClose: () => void;
  onDeleteStory?: (storyId: string) => Promise<void> | void;
}

const STORY_DURATION_MS = 60000; // 1 minute (60 seconds) for story progression

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  storyGroups,
  stories: legacyStories,
  initialGroupIndex = 0,
  initialStoryIndex = 0,
  initialIndex = 0,
  currentUserId,
  onClose,
  onDeleteStory,
}) => {
  // Normalize groups: prefer storyGroups, fallback to wrapping legacy stories into groups
  const normalizedGroups: UserStoryGroup[] = React.useMemo(() => {
    if (storyGroups && storyGroups.length > 0) {
      return storyGroups.filter((g) => g.stories && g.stories.length > 0);
    }
    if (legacyStories && legacyStories.length > 0) {
      // Group flat legacy stories by author ID
      const map: { [key: string]: UserStoryGroup } = {};
      legacyStories.forEach((s) => {
        const uId = s.author.id || 'default_user';
        if (!map[uId]) {
          map[uId] = {
            userId: uId,
            user: { ...s.author },
            stories: [],
          };
        }
        map[uId].stories.push(s);
      });
      return Object.values(map);
    }
    return [];
  }, [storyGroups, legacyStories]);

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex || initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Story viewers state (Instagram style)
  const [viewers, setViewers] = useState<any[]>([]);
  const [viewersCount, setViewersCount] = useState(0);
  const [storyReactions, setStoryReactions] = useState<any[]>([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const pausedProgressRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Sync state whenever modal opens or initial indices change
  useEffect(() => {
    if (isOpen) {
      const validGroupIdx = Math.max(0, Math.min(initialGroupIndex, normalizedGroups.length - 1));
      setGroupIndex(validGroupIdx);
      const groupStories = normalizedGroups[validGroupIdx]?.stories || [];
      const validStoryIdx = Math.max(0, Math.min(initialStoryIndex || initialIndex, groupStories.length - 1));
      setStoryIndex(validStoryIdx);
      setProgress(0);
      pausedProgressRef.current = 0;
      setIsPaused(false);
      setLiked(false);
      setReplyText('');
    }
  }, [isOpen, initialGroupIndex, initialStoryIndex, initialIndex, normalizedGroups]);

  const currentGroup = normalizedGroups[groupIndex];
  const currentStories = currentGroup?.stories || [];
  const currentStory = currentStories[storyIndex];

  // Parse content to extract clean text and location sticker
  const { cleanText, locationText } = useMemo(() => {
    let text = currentStory?.content || '';
    let location: string | null = currentStory?.location?.name || null;

    // Check for explicit location tags or "📍 at Location" or "📍 Location" in text
    if (!location && text) {
      const locTagMatch = text.match(/\[loc:([^\]]+)\]/i);
      if (locTagMatch) {
        location = locTagMatch[1].trim();
        text = text.replace(/\[loc:[^\]]+\]/i, '').trim();
      } else {
        const pinMatch = text.match(/(?:📍\s*(?:at\s*)?|at\s+📍\s*)([^\n\r]+)$/i);
        if (pinMatch) {
          location = pinMatch[1].trim();
          text = text.replace(/(?:📍\s*(?:at\s*)?|at\s+📍\s*)[^\n\r]+$/i, '').trim();
        }
      }
    } else if (text) {
      // Strip any trailing location pin from text if location was passed separately
      text = text.replace(/(?:📍\s*(?:at\s*)?|at\s+📍\s*)[^\n\r]+$/i, '').trim();
    }

    // Also strip background tags if any
    text = text.replace(/\[bg:[a-zA-Z0-9_-]+\]/gi, '').trim();

    return { cleanText: text, locationText: location };
  }, [currentStory?.content, currentStory?.location]);

  // Advance to next story in current account, or switch to next account
  const handleNext = useCallback(() => {
    if (!currentGroup) return;

    if (storyIndex < currentStories.length - 1) {
      // Next story of the SAME account
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
      pausedProgressRef.current = 0;
    } else if (groupIndex < normalizedGroups.length - 1) {
      // Move to NEXT account's first story
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
      setProgress(0);
      pausedProgressRef.current = 0;
    } else {
      // Reached the end of all stories from all accounts
      onClose();
    }
  }, [currentGroup, storyIndex, currentStories.length, groupIndex, normalizedGroups.length, onClose]);

  // Step back to previous story or previous account
  const handlePrev = useCallback(() => {
    if (storyIndex > 0) {
      // Previous story of the SAME account
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
      pausedProgressRef.current = 0;
    } else if (groupIndex > 0) {
      // Move to PREVIOUS account's last story
      const prevGroup = normalizedGroups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
      pausedProgressRef.current = 0;
    } else {
      // Reset current story to beginning
      setProgress(0);
      pausedProgressRef.current = 0;
    }
  }, [storyIndex, groupIndex, normalizedGroups]);

  // Animation timer loop for current story
  useEffect(() => {
    if (!isOpen || isPaused || isDeleteDialogOpen || !currentStory) return;

    startTimeRef.current = Date.now() - (pausedProgressRef.current / 100) * STORY_DURATION_MS;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        handleNext();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, groupIndex, storyIndex, isPaused, isDeleteDialogOpen, currentStory, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDeleteDialogOpen) {
        if (e.key === 'Escape') {
          setIsDeleteDialogOpen(false);
          setIsPaused(false);
        }
        return;
      }
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') setIsPaused((p) => !p);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleteDialogOpen, handleNext, handlePrev, onClose]);

  const isOwnStory = Boolean(
    currentUserId &&
    (currentGroup?.userId === currentUserId || currentStory?.author?.id === currentUserId)
  );

  // Automatically track view when viewing someone else's story
  useEffect(() => {
    if (isOpen && currentStory?.id && !isOwnStory) {
      storyApi.viewStory(currentStory.id).catch(() => {});
    }
  }, [isOpen, currentStory?.id, isOwnStory]);

  // Fetch viewers when viewing own story
  const loadViewers = useCallback(async () => {
    if (!isOpen || !currentStory?.id || !isOwnStory) return;
    setIsLoadingViewers(true);
    try {
      const res: any = await storyApi.getViewers(currentStory.id);
      const d = res?.data || res;
      setViewers(Array.isArray(d?.viewers) ? d.viewers : []);
      setViewersCount(d?.count || (Array.isArray(d?.viewers) ? d.viewers.length : 0));
      setStoryReactions(Array.isArray(d?.reactions) ? d.reactions : []);
    } catch {
      setViewers([]);
      setViewersCount(0);
      setStoryReactions([]);
    } finally {
      setIsLoadingViewers(false);
    }
  }, [isOpen, currentStory?.id, isOwnStory]);

  useEffect(() => {
    loadViewers();
  }, [loadViewers]);

  // Music playback sync with 15-second trimmed window
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isOpen || isPaused || !currentStory?.music?.audioUrl || isMuted) {
      audio.pause();
      return;
    }

    const startTime = currentStory.music.startTime || 0;
    const duration = currentStory.music.duration || 60; // 1 minute (60s) music clip

    // Reset to start time safely once metadata is available
    const applySeekAndPlay = () => {
      try {
        audio.currentTime = startTime;
      } catch {
        /* ignore */
      }
      audio.play().catch(() => {});
    };

    if (audio.readyState >= 1) {
      applySeekAndPlay();
    } else {
      audio.addEventListener('loadedmetadata', applySeekAndPlay, { once: true });
      audio.addEventListener('canplay', applySeekAndPlay, { once: true });
    }

    const handleTimeUpdate = () => {
      if (audio.currentTime >= startTime + duration || audio.currentTime < startTime) {
        try {
          audio.currentTime = startTime;
        } catch {
          /* ignore */
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('loadedmetadata', applySeekAndPlay);
      audio.removeEventListener('canplay', applySeekAndPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [
    isOpen,
    isPaused,
    currentStory?.music?.audioUrl,
    currentStory?.music?.startTime,
    currentStory?.music?.duration,
    isMuted,
    storyIndex,
    groupIndex,
  ]);

  if (!isOpen || !currentStory || !currentGroup) return null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSendingReply) return;

    const trimmed = replyText.trim();
    setIsSendingReply(true);
    try {
      await storyApi.replyToStory(currentStory.id, trimmed);
      toast.success(`Reply sent to ${currentGroup.user.name}!`, 'Message Sent');
      setReplyText('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send reply');
    } finally {
      setIsSendingReply(false);
      setIsPaused(false);
    }
  };

  const handleQuickReaction = async (emoji: string) => {
    try {
      if (emoji === '❤️') {
        setLiked(true);
      }
      await storyApi.reactToStory(currentStory.id, emoji);
      toast.success(`Reacted ${emoji} to ${currentGroup.user.name}'s story!`, 'Reaction Sent');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send reaction');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    pausedProgressRef.current = progress;
    setIsPaused(true);
    setIsDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setIsPaused(false);
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteStory || isDeleting || !currentStory?.id) return;

    setIsDeleting(true);
    try {
      await onDeleteStory(currentStory.id);
      toast.delete('Story deleted successfully', 'Deleted');
      setIsDeleteDialogOpen(false);
      // If it was the only story, close or move
      if (currentStories.length <= 1) {
        if (groupIndex < normalizedGroups.length - 1) {
          handleNext();
        } else {
          onClose();
        }
      } else {
        handleNext();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete story', 'Error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Mobile Story Container */}
      <div
        className="relative w-full max-w-sm sm:max-w-md h-[92vh] max-h-[820px] rounded-3xl overflow-hidden shadow-2xl bg-gray-950 flex flex-col justify-between border border-white/10"
        onMouseDown={() => {
          pausedProgressRef.current = progress;
          setIsPaused(true);
        }}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => {
          pausedProgressRef.current = progress;
          setIsPaused(true);
        }}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Story Background / Media */}
        <div className="absolute inset-0 z-0 bg-slate-900">
          {/* Music Audio Element */}
          <audio
            ref={audioRef}
            src={currentStory.music?.audioUrl}
            loop
            playsInline
            muted={isMuted}
          />

          {currentStory.mediaUrl ? (
            <div className="relative w-full h-full">
              {currentStory.mediaType === 'video' ? (
                <video
                  src={currentStory.mediaUrl}
                  autoPlay
                  playsInline
                  muted
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={currentStory.mediaUrl}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Floating Music Sticker on Media Story if present */}
              {currentStory.music && (
                <div
                  style={{
                    left: `${currentStory.music.x ?? 50}%`,
                    top: `${currentStory.music.y ?? 22}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-20 pointer-events-none"
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-black/75 backdrop-blur-md text-white rounded-full text-xs font-bold border border-white/25 shadow-2xl">
                    <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Music className="w-2.5 h-2.5 animate-pulse" />
                    </div>
                    <span className="truncate max-w-[140px]">{currentStory.music.title}</span>
                  </div>
                </div>
              )}

              {/* Text Caption positioned by author */}
              {cleanText && (
                <div
                  style={{
                    left: `${currentStory.textPosition?.x ?? 50}%`,
                    top: `${currentStory.textPosition?.y ?? 55}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-20 pointer-events-none w-full max-w-[90%] text-center px-4"
                >
                  <span
                    className="inline-block bg-black/60 backdrop-blur-md text-sm sm:text-base font-black px-4 py-2 rounded-2xl border border-white/15 shadow-2xl drop-shadow-md whitespace-pre-line"
                    style={{ color: currentStory.textColor || '#FFFFFF' }}
                  >
                    {cleanText}
                  </span>
                </div>
              )}

              {/* Positioned stickers & mentions on media story */}
              {Array.isArray(currentStory.stickers) && currentStory.stickers.length > 0 &&
                currentStory.stickers.map((stk, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${stk.x ?? 50}%`,
                      top: `${stk.y ?? (45 + ((idx * 8) % 40))}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute z-20 pointer-events-none"
                  >
                    <span
                      className={`px-3 py-1.5 rounded-2xl backdrop-blur-md text-white font-black text-xs sm:text-sm border shadow-xl ${
                        stk.type === 'mention'
                          ? 'bg-blue-600/85 border-blue-400/40'
                          : 'bg-white/25 border-white/30'
                      }`}
                    >
                      {stk.text}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div
              className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center transition-all overflow-hidden"
              style={resolveStoryBackground(currentStory.backgroundColor)}
            >
              {/* Floating Music Sticker on Text Story if present */}
              {currentStory.music && (
                <div
                  style={{
                    left: `${currentStory.music.x ?? 50}%`,
                    top: `${currentStory.music.y ?? 22}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-20 pointer-events-none"
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-black/75 backdrop-blur-md text-white rounded-full text-xs font-bold border border-white/25 shadow-2xl">
                    <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Music className="w-2.5 h-2.5 animate-pulse" />
                    </div>
                    <span className="truncate max-w-[140px]">{currentStory.music.title}</span>
                  </div>
                </div>
              )}

              {cleanText && (
                <p
                  className="text-xl sm:text-2xl font-black leading-relaxed tracking-wide drop-shadow-md max-w-sm whitespace-pre-line"
                  style={{ color: currentStory.textColor || '#FFFFFF' }}
                >
                  {cleanText}
                </p>
              )}

              {/* Render positioned interactive stickers on text story */}
              {Array.isArray(currentStory.stickers) && currentStory.stickers.length > 0 &&
                currentStory.stickers.map((stk, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${stk.x ?? 50}%`,
                      top: `${stk.y ?? (45 + ((idx * 8) % 40))}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute z-20 pointer-events-none"
                  >
                    <span
                      className={`px-3 py-1.5 rounded-2xl backdrop-blur-md text-white font-black text-xs sm:text-sm border shadow-xl ${
                        stk.type === 'mention'
                          ? 'bg-blue-600/85 border-blue-400/40'
                          : 'bg-white/25 border-white/30'
                      }`}
                    >
                      {stk.text}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Vignette gradients for header & bottom controls */}
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />
        </div>

        {/* Tap zones: Left (Prev) / Right (Next) */}
        <div className="absolute inset-0 z-10 grid grid-cols-2">
          <div
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="h-full cursor-pointer"
            title="Previous story"
          />
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="h-full cursor-pointer"
            title="Next story"
          />
        </div>

        {/* Top Header: Account Info & Story Progress Bars */}
        <div className="relative z-20 p-4 space-y-3">
          {/* Segmented Progress Bars (For THIS user's active stories) */}
          <div className="flex gap-1.5 w-full">
            {currentStories.map((s, idx) => (
              <div
                key={s.id || idx}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-xs"
              >
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear"
                  style={{
                    width:
                      idx < storyIndex
                        ? '100%'
                        : idx === storyIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author info & controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={currentGroup.user.avatar}
                  alt={currentGroup.user.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/90"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-white text-xs sm:text-sm font-bold leading-tight drop-shadow-xs truncate max-w-[150px]">
                    {currentGroup.user.name}
                  </h4>
                  {isOwnStory && (
                    <span className="bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                      You
                    </span>
                  )}
                  {locationText && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-bold text-white text-[10px] bg-white/20 hover:bg-white/35 px-2 py-0.5 rounded-full backdrop-blur-md transition-colors shadow-2xs border border-white/20 truncate max-w-[130px]"
                      title={`Location: ${locationText} (Click to open map)`}
                    >
                      <MapPin className="w-2.5 h-2.5 text-red-400 fill-red-400 shrink-0" />
                      <span className="truncate">{locationText}</span>
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/75 mt-0.5">
                  <span>{currentStory.createdAt || 'Just now'}</span>
                  {currentStories.length > 1 && (
                    <>
                      <span>•</span>
                      <span className="text-white/90 font-medium">
                        {storyIndex + 1} / {currentStories.length}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-blue-300">
                    <Sparkles className="w-2.5 h-2.5" /> Story
                  </span>
                </div>

                {/* Soundtrack Pill with Trim Range */}
                {currentStory.music && (
                  <div className="flex items-center gap-1.5 text-[10px] text-pink-300 font-semibold mt-1 bg-black/40 px-2 py-0.5 rounded-full w-fit border border-white/10 backdrop-blur-md max-w-[240px] truncate">
                    <Music className="w-2.5 h-2.5 animate-pulse shrink-0" />
                    <span className="truncate">{currentStory.music.title}</span>
                    {currentStory.music.artist && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="text-white/70 font-normal truncate">{currentStory.music.artist}</span>
                      </>
                    )}
                    {typeof currentStory.music.startTime === 'number' && (
                      <span className="text-pink-400 font-mono text-[9px] bg-pink-950/40 px-1.5 py-0.2 rounded ml-0.5 border border-pink-500/20">
                        {Math.floor(currentStory.music.startTime / 60)}:{String(Math.floor(currentStory.music.startTime % 60)).padStart(2, '0')} - {Math.floor((currentStory.music.startTime + (currentStory.music.duration || 60)) / 60)}:{String(Math.floor((currentStory.music.startTime + (currentStory.music.duration || 60)) % 60)).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              {/* Volume / Mute Soundtrack toggle button */}
              {currentStory.music?.audioUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = !isMuted;
                    setIsMuted(next);
                    if (audioRef.current) audioRef.current.muted = next;
                  }}
                  className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute soundtrack' : 'Mute soundtrack'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
                </button>
              )}

              {/* Delete own story button */}
              {isOwnStory && onDeleteStory && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="p-1.5 rounded-full text-white/80 hover:text-red-400 hover:bg-white/20 transition-colors cursor-pointer"
                  title="Delete this story"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                aria-label={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                aria-label="Close stories"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Interactive Bar (Reply & Quick Reactions) */}
        <div className="relative z-20 p-4 space-y-3">
          {isOwnStory ? (
            <div className="py-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(true);
                  setShowViewersSheet(true);
                }}
                className="w-full py-2.5 px-4 bg-white/15 hover:bg-white/25 active:scale-98 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-between text-white transition-all cursor-pointer shadow-lg group/viewers"
              >
                <div className="flex items-center gap-2.5">
                  {viewers.length > 0 ? (
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {viewers.slice(0, 3).map((v, i) => {
                        const u = v.viewerId;
                        const avatar =
                          u?.image?.secure_url ||
                          u?.profilePicture?.secure_url ||
                          '/assets/images/avatar/01.jpg';
                        return (
                          <img
                            key={i}
                            src={avatar}
                            alt={u?.username || 'Viewer'}
                            className="w-5 h-5 rounded-full object-cover ring-2 ring-white/60 shadow-xs"
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <Eye className="w-4 h-4 text-white/80" />
                  )}
                  <span className="text-xs font-bold text-white tracking-wide">
                    {viewersCount} {viewersCount === 1 ? 'Viewer' : 'Viewers'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-white/90 group-hover/viewers:text-white flex items-center gap-1">
                  <span>See Viewers</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          ) : (
            <>
              {/* Quick Reaction Emojis */}
              <div className="flex items-center justify-around px-2">
                {['❤️', '🔥', '👏', '😂', '😍'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickReaction(emoji);
                    }}
                    className="text-xl sm:text-2xl hover:scale-125 active:scale-95 transition-transform cursor-pointer p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={`Reply to ${currentGroup.user.name.split(' ')[0]}...`}
                    value={replyText}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-xs sm:text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!replyText.trim() || isSendingReply}
                  className="p-2 rounded-full bg-white text-gray-900 disabled:opacity-40 hover:bg-white/90 transition-opacity cursor-pointer shadow-md"
                >
                  {isSendingReply ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Send className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickReaction('❤️');
                  }}
                  className={`p-2 rounded-full border border-white/30 backdrop-blur-md transition-colors cursor-pointer ${
                    liked ? 'bg-red-500 text-white border-red-500' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                </button>
              </form>
            </>
          )}

          {/* Account Indicator Dots if multiple accounts exist */}
          {normalizedGroups.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {normalizedGroups.map((g, gIdx) => (
                <div
                  key={g.userId || gIdx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    gIdx === groupIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                  title={g.user.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Instagram-style Story Viewers Drawer Sheet */}
        {showViewersSheet && (
          <div
            className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setShowViewersSheet(false);
              setIsPaused(false);
            }}
          >
            <div
              className="bg-slate-900 border-t border-white/15 rounded-t-3xl max-h-[70vh] flex flex-col p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Handle & Header */}
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">Story Viewers</h4>
                  <span className="text-xs bg-blue-600/80 text-white font-bold px-2 py-0.2 rounded-full">
                    {viewersCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowViewersSheet(false);
                    setIsPaused(false);
                  }}
                  className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Viewers List */}
              <div className="overflow-y-auto flex-1 py-2 divide-y divide-white/5 space-y-1">
                {isLoadingViewers ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-white/60">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="text-xs">Loading viewers...</span>
                  </div>
                ) : viewers.length === 0 ? (
                  <div className="py-10 text-center text-white/60 space-y-1.5">
                    <Users className="w-8 h-8 mx-auto text-white/30 mb-1" />
                    <p className="text-xs font-semibold text-white/80">No views yet</p>
                    <p className="text-[11px] text-white/50">When friends or community members view your story, they will appear here.</p>
                  </div>
                ) : (
                  viewers.map((v, i) => {
                    const u = v.viewerId || {};
                    const uName =
                      u.username ||
                      `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                      'Social User';
                    const avatar =
                      u.image?.secure_url ||
                      u.profilePicture?.secure_url ||
                      '/assets/images/avatar/01.jpg';
                    const reaction = storyReactions.find(
                      (r) => String(r.userId?._id || r.userId) === String(u._id)
                    );

                    return (
                      <div key={v._id || i} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={avatar}
                              alt={uName}
                              className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
                            />
                            {reaction && (
                              <span className="absolute -bottom-1 -right-1 text-sm bg-black/60 rounded-full px-1 shadow-xs ring-1 ring-white/30">
                                {reaction.emoji}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {uName}
                            </span>
                            <span className="text-[10px] text-white/50 block truncate">
                              @{u.username || 'user'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-white/40 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>
                            {v.createdAt
                              ? new Date(v.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Seen'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Prev / Next Floating Navigation */}
      {(groupIndex > 0 || storyIndex > 0) && (
        <button
          type="button"
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-all hover:scale-110 cursor-pointer backdrop-blur-xs shadow-lg"
          title="Previous story"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {(groupIndex < normalizedGroups.length - 1 || storyIndex < currentStories.length - 1) && (
        <button
          type="button"
          onClick={handleNext}
          className="hidden md:flex absolute right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-all hover:scale-110 cursor-pointer backdrop-blur-xs shadow-lg"
          title="Next story"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Story Delete Confirmation Dialog */}
      {isDeleteDialogOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[10002] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => !isDeleting && handleCancelDelete()}
          >
            <div
              className="bg-slate-900 border border-white/15 rounded-3xl max-w-sm sm:max-w-md w-full p-6 text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 ring-4 ring-red-500/10">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-white leading-tight">Delete Story?</h4>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    Are you sure you want to delete this story? It will be permanently removed for you and all your followers. This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Small preview of the story */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-12 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10 flex items-center justify-center">
                  {currentStory?.mediaUrl ? (
                    <img
                      src={currentStory.mediaUrl}
                      alt="Story thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center p-1 text-[8px] text-white font-bold text-center"
                      style={resolveStoryBackground(currentStory?.backgroundColor)}
                    >
                      {cleanText?.slice(0, 15) || 'Text'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {cleanText || (currentStory?.mediaUrl ? 'Photo / Video Story' : 'Story')}
                  </p>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    {currentStory?.music?.title ? `🎵 ${currentStory.music.title}` : '24h Story'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleCancelDelete}
                  className="px-4 py-2.5 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 hover:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-red-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Story</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
