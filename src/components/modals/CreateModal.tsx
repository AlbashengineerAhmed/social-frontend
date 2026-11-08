import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Image, 
  Video, 
  Smile, 
  UploadCloud, 
  Globe, 
  Users, 
  Lock, 
  MapPin, 
  Tag, 
  Palette, 
  Type, 
  Camera, 
  Sparkles,
  Loader2,
  Trash2,
  ChevronDown,
  Check,
  Music,
  AtSign,
  Play,
  Pause,
  PenTool,
  Eraser,
  Search,
  Scissors,
  ChevronLeft
} from 'lucide-react';
import type { User } from '../../types';
import { toast } from '../../stores/toastStore';
import { GoogleMapLocationModal, type PostLocation } from './GoogleMapLocationModal';
import { musicApi, type MusicTrack } from '../../features/feed/api/music.api';

export type CreateModalType = 'post' | 'photo' | 'video' | 'story' | null;

export type EpidemicTrack = MusicTrack;

export const STORY_STICKERS = [
  { id: 'fire', text: '🔥 HOT', type: 'sticker' },
  { id: '100', text: '💯 100', type: 'sticker' },
  { id: 'rocket', text: '🚀 VIBES', type: 'sticker' },
  { id: 'heart', text: '❤️ LOVE', type: 'sticker' },
  { id: 'party', text: '🎉 PARTY', type: 'sticker' },
  { id: 'cool', text: '😎 COOL', type: 'sticker' },
  { id: 'sparkles', text: '✨ MAGIC', type: 'sticker' },
  { id: 'music', text: '🎶 VIBING', type: 'sticker' },
  { id: 'coffee', text: '☕ MOOD', type: 'sticker' },
];

export const STORY_TEXT_COLORS = [
  { id: 'white', color: '#FFFFFF', name: 'White' },
  { id: 'black', color: '#111827', name: 'Black' },
  { id: 'yellow', color: '#FBBF24', name: 'Neon Yellow' },
  { id: 'pink', color: '#EC4899', name: 'Pink' },
  { id: 'cyan', color: '#06B6D4', name: 'Cyan' },
  { id: 'green', color: '#10B981', name: 'Emerald' }
];

interface CreateModalProps {
  isOpen: boolean;
  type: CreateModalType;
  currentUser: User;
  onClose: () => void;
  onSubmit: (
    content: string,
    mediaFile?: File,
    visibility?: string,
    extraOptions?: {
      backgroundColor?: string;
      textColor?: string;
      music?: any;
      stickers?: any[];
      location?: PostLocation | null;
      textPosition?: { x: number; y: number };
    }
  ) => Promise<void> | void;
  isEditing?: boolean;
  initialContent?: string;
  initialGradient?: string;
  initialFeeling?: { emoji: string; label: string } | null;
  initialLocation?: PostLocation | null;
  initialVisibility?: 'public' | 'friends' | 'private';
  initialMediaUrl?: string | null;
}

export const POST_GRADIENTS = [
  { id: 'none', label: 'Clean White', bg: 'bg-white', text: 'text-gray-900', preview: 'bg-white border-2 border-gray-200' },
  { id: 'sunset', label: 'Sunset Coral', bg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600', text: 'text-white font-bold text-center text-xl sm:text-2xl drop-shadow-md placeholder:text-white/70', preview: 'bg-gradient-to-tr from-amber-500 to-purple-600' },
  { id: 'ocean', label: 'Ocean Breeze', bg: 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500', text: 'text-white font-bold text-center text-xl sm:text-2xl drop-shadow-md placeholder:text-white/70', preview: 'bg-gradient-to-tr from-blue-600 to-cyan-500' },
  { id: 'aurora', label: 'Emerald Aurora', bg: 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-blue-700', text: 'text-white font-bold text-center text-xl sm:text-2xl drop-shadow-md placeholder:text-white/70', preview: 'bg-gradient-to-tr from-emerald-500 to-blue-700' },
  { id: 'midnight', label: 'Midnight Velvet', bg: 'bg-gradient-to-tr from-gray-900 via-purple-950 to-slate-900', text: 'text-white font-bold text-center text-xl sm:text-2xl drop-shadow-md placeholder:text-white/70', preview: 'bg-gradient-to-tr from-gray-900 to-purple-900' },
  { id: 'candy', label: 'Sweet Candy', bg: 'bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500', text: 'text-white font-bold text-center text-xl sm:text-2xl drop-shadow-md placeholder:text-white/70', preview: 'bg-gradient-to-tr from-pink-500 to-indigo-500' },
];

export interface StoryGradient {
  id: string;
  name: string;
  bg: string;
  css: string;
  hex: string;
}

export const STORY_GRADIENTS: StoryGradient[] = [
  { id: 'insta', name: 'Instagram Sunset', bg: 'from-amber-400 via-rose-500 to-purple-600', css: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)', hex: '#ec4899' },
  { id: 'purple', name: 'Deep Purple', bg: 'from-indigo-600 via-purple-600 to-pink-500', css: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #ec4899 100%)', hex: '#8b5cf6' },
  { id: 'ocean', name: 'Lagoon Cyan', bg: 'from-blue-600 via-teal-500 to-emerald-400', css: 'linear-gradient(135deg, #2563eb 0%, #14b8a6 50%, #34d399 100%)', hex: '#0284c7' },
  { id: 'fire', name: 'Electric Fire', bg: 'from-yellow-400 via-orange-500 to-red-600', css: 'linear-gradient(135deg, #facc15 0%, #f97316 50%, #dc2626 100%)', hex: '#f97316' },
  { id: 'dark', name: 'Midnight Onyx', bg: 'from-gray-950 via-slate-900 to-zinc-900', css: 'linear-gradient(135deg, #09090b 0%, #0f172a 50%, #18181b 100%)', hex: '#09090b' },
];

export const QUICK_FEELINGS = [
  { emoji: '😊', label: 'happy' },
  { emoji: '🚀', label: 'excited' },
  { emoji: '💻', label: 'coding' },
  { emoji: '🎉', label: 'celebrating' },
  { emoji: '❤️', label: 'loved' },
  { emoji: '☕', label: 'relaxed' },
  { emoji: '💡', label: 'inspired' },
  { emoji: '🔥', label: 'motivated' },
];

export const STORY_CLIP_DURATION = 40; // 40 seconds for story & music duration

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  type,
  currentUser,
  onClose,
  onSubmit,
  isEditing = false,
  initialContent = '',
  initialGradient = 'none',
  initialFeeling = null,
  initialLocation = null,
  initialVisibility = 'public',
  initialMediaUrl = null,
}) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Facebook & Instagram flair states
  const [selectedGradient, setSelectedGradient] = useState<string>('none');
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const [showFeelingsPicker, setShowFeelingsPicker] = useState(false);
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<{ emoji: string; label: string } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<PostLocation | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Story specific states (Instagram style)
  const [storyMode, setStoryMode] = useState<'text' | 'media'>('media');
  const [selectedStoryGradient, setSelectedStoryGradient] = useState<StoryGradient>(STORY_GRADIENTS[0]);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [musicTab, setMusicTab] = useState<'local' | 'online'>('local');
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [musicQuery, setMusicQuery] = useState('');
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Trimmer states (15-second story clip)
  const [trimmingTrack, setTrimmingTrack] = useState<MusicTrack | null>(null);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [isTrimPlaying, setIsTrimPlaying] = useState<boolean>(false);
  const trimAudioRef = useRef<HTMLAudioElement | null>(null);

  const [selectedStickers, setSelectedStickers] = useState<Array<{ type: string; text: string; x?: number; y?: number }>>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [mentionUsername, setMentionUsername] = useState('');
  const [selectedTextColor, setSelectedTextColor] = useState<string>('#FFFFFF');
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [isPhotoTextActive, setIsPhotoTextActive] = useState(false);

  // Free-form Drag & Drop positioning (Facebook / Instagram story style)
  const [musicPos, setMusicPos] = useState<{ x: number; y: number }>({ x: 50, y: 22 });
  const [textPos, setTextPos] = useState<{ x: number; y: number }>({ x: 50, y: 55 });
  const activeCanvasRef = useRef<HTMLDivElement | null>(null);
  const draggingItemRef = useRef<{
    type: 'music' | 'text' | 'sticker';
    index?: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  const handleOverlayPointerDown = (
    e: React.PointerEvent,
    type: 'music' | 'text' | 'sticker',
    index?: number
  ) => {
    e.stopPropagation();
    hasMovedRef.current = false;
    let orig = { x: 50, y: 50 };
    if (type === 'music') {
      orig = musicPos;
    } else if (type === 'text') {
      orig = textPos;
    } else if (type === 'sticker' && typeof index === 'number' && selectedStickers[index]) {
      orig = {
        x: selectedStickers[index].x ?? 50,
        y: selectedStickers[index].y ?? 50,
      };
    }

    draggingItemRef.current = {
      type,
      index,
      startX: e.clientX,
      startY: e.clientY,
      origX: orig.x,
      origY: orig.y,
      moved: false,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleOverlayPointerMove = (e: React.PointerEvent) => {
    if (!draggingItemRef.current || !activeCanvasRef.current) return;
    const item = draggingItemRef.current;
    const rect = activeCanvasRef.current.getBoundingClientRect();
    const deltaXPct = ((e.clientX - item.startX) / rect.width) * 100;
    const deltaYPct = ((e.clientY - item.startY) / rect.height) * 100;

    if (Math.abs(e.clientX - item.startX) > 4 || Math.abs(e.clientY - item.startY) > 4) {
      item.moved = true;
      hasMovedRef.current = true;
    }

    const newX = Math.max(12, Math.min(88, Math.round(item.origX + deltaXPct)));
    const newY = Math.max(14, Math.min(86, Math.round(item.origY + deltaYPct)));

    if (item.type === 'music') {
      setMusicPos({ x: newX, y: newY });
    } else if (item.type === 'text') {
      setTextPos({ x: newX, y: newY });
    } else if (item.type === 'sticker' && typeof item.index === 'number') {
      setSelectedStickers((prev) =>
        prev.map((s, idx) => (idx === item.index ? { ...s, x: newX, y: newY } : s))
      );
    }
  };

  const handleOverlayPointerUp = (e: React.PointerEvent) => {
    if (draggingItemRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        draggingItemRef.current = null;
      }, 50);
    }
  };

  // Pen / Doodle Drawing state
  const [isDoodling, setIsDoodling] = useState(false);
  const [doodleColor, setDoodleColor] = useState('#FBBF24');
  const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Load music tracks based on active tab (Local Hits vs FreeToUse Online Library)
  useEffect(() => {
    if (!showMusicPicker) return;

    if (musicTab === 'local') {
      setIsLoadingMusic(false);
      setMusicTracks(musicApi.getLocalTracks(musicQuery));
    } else {
      setIsLoadingMusic(true);
      const timer = setTimeout(() => {
        musicApi
          .getOnlineTracks(musicQuery)
          .then((tracks) => setMusicTracks(tracks))
          .catch(() => setMusicTracks([]))
          .finally(() => setIsLoadingMusic(false));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showMusicPicker, musicTab, musicQuery]);

  const togglePlayTrackPreview = (track: MusicTrack) => {
    if (previewTrackId === track.id) {
      previewAudioRef.current?.pause();
      setPreviewTrackId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(track.audioUrl);
      previewAudioRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => setPreviewTrackId(null);
      setPreviewTrackId(track.id);
    }
  };

  // Canvas Music playback preview
  const [isCanvasMusicPlaying, setIsCanvasMusicPlaying] = useState<boolean>(false);
  const canvasMusicAudioRef = useRef<HTMLAudioElement | null>(null);

  const toggleCanvasMusicPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedMusic) return;

    if (isCanvasMusicPlaying) {
      canvasMusicAudioRef.current?.pause();
      setIsCanvasMusicPlaying(false);
    } else {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      if (trimAudioRef.current) trimAudioRef.current.pause();

      if (!canvasMusicAudioRef.current || canvasMusicAudioRef.current.src !== selectedMusic.audioUrl) {
        if (canvasMusicAudioRef.current) canvasMusicAudioRef.current.pause();
        canvasMusicAudioRef.current = new Audio(selectedMusic.audioUrl);
      }
      const audio = canvasMusicAudioRef.current;
      const start = selectedMusic.startTime || 0;
      const duration = selectedMusic.duration || STORY_CLIP_DURATION;

      const playCanvasClip = () => {
        try {
          audio.currentTime = start;
        } catch {
          /* ignore */
        }
        audio.play().then(() => {
          setIsCanvasMusicPlaying(true);
        }).catch(() => {
          setIsCanvasMusicPlaying(false);
        });
      };

      if (audio.readyState >= 1) {
        playCanvasClip();
      } else {
        audio.addEventListener('loadedmetadata', playCanvasClip, { once: true });
        audio.load();
      }

      audio.ontimeupdate = () => {
        if (audio.currentTime >= start + duration || audio.currentTime < start) {
          try {
            audio.currentTime = start;
          } catch {
            /* ignore */
          }
        }
      };
      audio.onended = () => {
        try {
          audio.currentTime = start;
        } catch {
          /* ignore */
        }
        audio.play().catch(() => {});
      };
    }
  };

  // Facebook-style Trimmer handlers
  const handleOpenTrimmer = (track: MusicTrack) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewTrackId(null);
    }
    if (canvasMusicAudioRef.current) {
      canvasMusicAudioRef.current.pause();
      setIsCanvasMusicPlaying(false);
    }
    setTrimmingTrack(track);
    const start = track.startTime || 0;
    setTrimStart(start);
    setIsTrimPlaying(false);

    if (trimAudioRef.current) {
      trimAudioRef.current.pause();
    }
    const audio = new Audio(track.audioUrl);
    trimAudioRef.current = audio;
    const seekOnReady = () => {
      try {
        audio.currentTime = start;
      } catch {
        /* ignore */
      }
    };
    if (audio.readyState >= 1) {
      seekOnReady();
    } else {
      audio.addEventListener('loadedmetadata', seekOnReady, { once: true });
    }
  };

  const toggleTrimPlayback = () => {
    if (!trimmingTrack) return;
    const audio = trimAudioRef.current;
    if (!audio) return;

    if (isTrimPlaying) {
      audio.pause();
      setIsTrimPlaying(false);
    } else {
      const start = trimStart;
      const playSnippet = () => {
        try {
          audio.currentTime = start;
        } catch {
          /* ignore */
        }
        audio.play().then(() => {
          setIsTrimPlaying(true);
        }).catch(() => {
          setIsTrimPlaying(false);
        });
      };

      if (audio.readyState >= 1) {
        playSnippet();
      } else {
        audio.addEventListener('loadedmetadata', playSnippet, { once: true });
        audio.load();
      }

      audio.ontimeupdate = () => {
        if (audio.currentTime >= start + STORY_CLIP_DURATION || audio.currentTime < start) {
          try {
            audio.currentTime = start;
          } catch {
            /* ignore */
          }
        }
      };
      audio.onended = () => {
        try {
          audio.currentTime = start;
        } catch {
          /* ignore */
        }
        audio.play().catch(() => {});
      };
    }
  };

  const handleTrimStartChange = (val: number, autoPlay: boolean = false) => {
    setTrimStart(val);
    const audio = trimAudioRef.current;
    if (audio) {
      try {
        audio.currentTime = val;
      } catch {
        /* ignore */
      }

      audio.ontimeupdate = () => {
        if (audio.currentTime >= val + STORY_CLIP_DURATION || audio.currentTime < val) {
          try {
            audio.currentTime = val;
          } catch {
            /* ignore */
          }
        }
      };

      if (autoPlay || isTrimPlaying) {
        audio.play().then(() => {
          setIsTrimPlaying(true);
        }).catch(() => {});
      }
    }
  };

  // Draggable soundwave scrubber handlers (Facebook-style)
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingWaveform, setIsDraggingWaveform] = useState(false);
  const dragOffsetRef = useRef<number>(0);

  const handleWaveformPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!waveformRef.current || !trimmingTrack) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const totalSec = trimmingTrack.duration || 180;
    const maxStart = Math.max(1, Math.floor(totalSec - STORY_CLIP_DURATION));
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    const currentStartRatio = trimStart / totalSec;
    const windowRatio = STORY_CLIP_DURATION / totalSec;
    
    // Check if clicked inside the pink frame or outside
    if (clickRatio >= currentStartRatio && clickRatio <= currentStartRatio + windowRatio) {
      // Grabbing inside the frame: preserve relative offset so no jerky jump
      dragOffsetRef.current = clickRatio - currentStartRatio;
    } else {
      // Clicked outside: center the frame on cursor
      dragOffsetRef.current = windowRatio / 2;
      let newStart = Math.round((clickRatio - dragOffsetRef.current) * totalSec);
      if (newStart < 0) newStart = 0;
      if (newStart > maxStart) newStart = maxStart;
      handleTrimStartChange(newStart, false);
    }
    
    setIsDraggingWaveform(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleWaveformPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingWaveform || !waveformRef.current || !trimmingTrack) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const totalSec = trimmingTrack.duration || 180;
    const maxStart = Math.max(1, Math.floor(totalSec - STORY_CLIP_DURATION));
    const moveRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    let newStart = Math.round((moveRatio - dragOffsetRef.current) * totalSec);
    if (newStart < 0) newStart = 0;
    if (newStart > maxStart) newStart = maxStart;
    handleTrimStartChange(newStart, false);
  };

  const handleWaveformPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingWaveform) {
      setIsDraggingWaveform(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  const stopAllAudios = useCallback(() => {
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current.src = '';
      } catch {
        /* ignore */
      }
      previewAudioRef.current = null;
    }
    if (trimAudioRef.current) {
      try {
        trimAudioRef.current.pause();
        trimAudioRef.current.currentTime = 0;
        trimAudioRef.current.src = '';
      } catch {
        /* ignore */
      }
      trimAudioRef.current = null;
    }
    if (canvasMusicAudioRef.current) {
      try {
        canvasMusicAudioRef.current.pause();
        canvasMusicAudioRef.current.currentTime = 0;
        canvasMusicAudioRef.current.src = '';
      } catch {
        /* ignore */
      }
      canvasMusicAudioRef.current = null;
    }
    setIsCanvasMusicPlaying(false);
    setIsTrimPlaying(false);
    setPreviewTrackId(null);
  }, []);

  // Stop all active audio streams when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      stopAllAudios();
    }
  }, [isOpen, stopAllAudios]);

  useEffect(() => {
    return () => {
      stopAllAudios();
    };
  }, [stopAllAudios]);

  const handleModalClose = useCallback(() => {
    stopAllAudios();
    onClose();
  }, [stopAllAudios, onClose]);

  const handleApplyTrimmedTrack = () => {
    if (!trimmingTrack) return;
    if (trimAudioRef.current) {
      trimAudioRef.current.pause();
    }
    setIsTrimPlaying(false);
    setSelectedMusic({
      ...trimmingTrack,
      startTime: trimStart,
      duration: STORY_CLIP_DURATION,
    });
    setTrimmingTrack(null);
    setShowMusicPicker(false);
    toast.success(`Track "${trimmingTrack.title}" (40s clip) applied!`, 'Soundtrack Added');
  };

  // Doodle Canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = doodleColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    isDrawingRef.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearDoodle = () => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const feelingsRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);

  // Sync state when modal opens or edit data changes
  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setContent(initialContent || '');
        setSelectedGradient(initialGradient || 'none');
        setSelectedFeeling(initialFeeling || null);
        setSelectedLocation(initialLocation || null);
        setVisibility(initialVisibility || 'public');
        setPreviewUrl(initialMediaUrl || null);
        setSelectedFile(null);
      } else {
        setContent('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setSelectedGradient('none');
        setSelectedFeeling(null);
        setSelectedLocation(null);
        setVisibility('public');
      }
    }
  }, [isOpen, isEditing, initialContent, initialGradient, initialFeeling, initialLocation, initialVisibility, initialMediaUrl]);

  // Sync mode based on trigger type
  useEffect(() => {
    if (type === 'story') {
      setStoryMode(selectedFile ? 'media' : 'text');
    }
  }, [type, selectedFile]);

  // Outside click listener for feelings and privacy dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (feelingsRef.current && !feelingsRef.current.contains(e.target as Node)) {
        setShowFeelingsPicker(false);
      }
      if (privacyRef.current && !privacyRef.current.contains(e.target as Node)) {
        setShowPrivacyDropdown(false);
      }
    };
    if (showFeelingsPicker || showPrivacyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFeelingsPicker, showPrivacyDropdown]);

  if (!isOpen || !type) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedGradient('none'); // Reset gradient when media is added
      if (type === 'story') {
        setStoryMode('media');
      }
    }
  };

  const handleRemoveMedia = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPhotoTextActive(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && !selectedFile && !selectedLocation && !previewUrl && !selectedMusic) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let finalContent = trimmed;
      if (selectedGradient && selectedGradient !== 'none' && !selectedFile && !previewUrl && type !== 'story') {
        finalContent += ` [bg:${selectedGradient}]`;
      }
      if (selectedFeeling) {
        finalContent += ` — feeling ${selectedFeeling.label} ${selectedFeeling.emoji}`;
      }
      if (selectedLocation && type !== 'story') {
        finalContent += ` 📍 at ${selectedLocation.name}`;
      }

      await onSubmit(finalContent, selectedFile || undefined, visibility, {
        backgroundColor:
          type === 'story'
            ? selectedStoryGradient.css || selectedStoryGradient.bg || selectedStoryGradient.hex
            : selectedGradient !== 'none'
            ? selectedGradient
            : undefined,
        textColor: selectedTextColor,
        music: selectedMusic ? { ...selectedMusic, x: musicPos.x, y: musicPos.y } : undefined,
        stickers: selectedStickers,
        location: selectedLocation || undefined,
        textPosition: textPos,
      });
      
      const successMsg =
        isEditing
          ? 'Post updated successfully!'
          : type === 'story'
          ? 'Your story is now live for 24 hours!'
          : type === 'video'
          ? 'Reel / video uploaded successfully!'
          : 'Your post was published to your feed!';
      toast.success(successMsg, isEditing ? 'Saved' : 'Published');

      // Reset states if creating
      if (!isEditing) {
        setContent('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setSelectedGradient('none');
        setSelectedFeeling(null);
        setSelectedLocation(null);
        setSelectedMusic(null);
        setSelectedStickers([]);
        setMusicPos({ x: 50, y: 22 });
        setTextPos({ x: 50, y: 55 });
        setSelectedTextColor('#FFFFFF');
      }
      stopAllAudios();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publishing failed';
      toast.error(msg, isEditing ? 'Edit Error' : 'Upload Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeGradConfig = POST_GRADIENTS.find((g) => g.id === selectedGradient) || POST_GRADIENTS[0];
  const isPostTextOnly = !selectedFile && !previewUrl;
  const canPublish = Boolean(content.trim() || selectedFile || previewUrl || selectedLocation);

  return (
    <>
      {createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Facebook / Instagram clean centered style */}
        <div className="relative px-5 py-4 border-b border-gray-100 flex items-center justify-center">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg">
            {isEditing ? 'Edit Post' : type === 'story' ? 'Create Story' : 'Create Post'}
          </h3>
          <button
            type="button"
            onClick={handleModalClose}
            className="absolute right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Tab Switcher (Instagram Style: Text Story vs Media Story) */}
        {type === 'story' && (
          <div className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setStoryMode('text');
                handleRemoveMedia();
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                storyMode === 'text'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Text Story</span>
            </button>
            <button
              type="button"
              onClick={() => setStoryMode('media')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                storyMode === 'media'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Photo / Video</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* User Profile Bar & Privacy Pill (Facebook Style) */}
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/10 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h5 className="font-semibold text-sm text-gray-900 leading-tight">
                    {currentUser.name}
                  </h5>
                  {selectedLocation && (
                    <span className="text-xs text-gray-600 flex items-center gap-1 font-normal bg-gray-100 px-2 py-0.5 rounded-full">
                      <span>{type === 'story' ? '📍' : 'is at'}</span>
                      <button
                        type="button"
                        onClick={() => setIsMapModalOpen(true)}
                        className="font-semibold text-gray-900 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer"
                        title="Click to change location"
                      >
                        {type !== 'story' && <MapPin className="w-3 h-3 text-red-500 shrink-0" />}
                        <span>{selectedLocation.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLocation(null)}
                        className="text-gray-400 hover:text-gray-700 ml-0.5 text-xs font-bold cursor-pointer"
                        title="Remove location"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedFeeling && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>is feeling {selectedFeeling.label} {selectedFeeling.emoji}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFeeling(null)}
                        className="text-gray-400 hover:text-gray-700 ml-0.5 text-xs font-bold cursor-pointer"
                        title="Remove feeling"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>

                {/* Audience Privacy Dropdown (Custom Facebook Popover) */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="relative inline-block" ref={privacyRef}>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      {visibility === 'public' && <Globe className="w-3.5 h-3.5 text-blue-600" />}
                      {visibility === 'friends' && <Users className="w-3.5 h-3.5 text-emerald-600" />}
                      {visibility === 'private' && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                      <span>{visibility === 'private' ? 'Only me' : visibility === 'friends' ? 'Friends' : 'Public'}</span>
                      <ChevronDown className="w-3 h-3 text-gray-400 ml-0.5" />
                    </button>

                    {showPrivacyDropdown && (
                      <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Who can see your post?
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setVisibility('public');
                            setShowPrivacyDropdown(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                            visibility === 'public' ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-900">
                              <span>Public</span>
                              {visibility === 'public' && <Check className="w-4 h-4 text-blue-600" />}
                            </div>
                            <p className="text-[11px] text-gray-500">Anyone on or off Social</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setVisibility('friends');
                            setShowPrivacyDropdown(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                            visibility === 'friends' ? 'bg-emerald-50/70' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-900">
                              <span>Friends</span>
                              {visibility === 'friends' && <Check className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <p className="text-[11px] text-gray-500">Your friends on Social</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setVisibility('private');
                            setShowPrivacyDropdown(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                            visibility === 'private' ? 'bg-amber-50/70' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-900">
                              <span>Only me</span>
                              {visibility === 'private' && <Check className="w-4 h-4 text-amber-600" />}
                            </div>
                            <p className="text-[11px] text-gray-500">Only you can see this post</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* INSTAGRAM / FACEBOOK STORY LIVE CANVAS */}
            {type === 'story' ? (
              storyMode === 'text' ? (
                /* 1. TEXT STORY CANVAS */
                <div
                  ref={(el) => { if (el) activeCanvasRef.current = el; }}
                  className="relative w-full aspect-[9/14] sm:aspect-[9/13] max-h-[410px] rounded-3xl p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 mx-auto border border-white/20 overflow-hidden"
                  style={{ background: selectedStoryGradient.css || selectedStoryGradient.hex }}
                >
                  {/* Top Story Header */}
                  <div className="flex justify-between items-center text-white/90 text-xs z-10">
                    <div className="flex items-center gap-2">
                      <span className="font-bold flex items-center gap-1.5 bg-black/35 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 text-white text-xs shadow-md">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Story Preview
                      </span>
                      {selectedLocation && (
                        <span className="font-semibold flex items-center gap-1 bg-red-600/80 px-2.5 py-1 rounded-full backdrop-blur-md border border-red-400/30 text-white text-[11px] shadow-md animate-in fade-in duration-150">
                          <MapPin className="w-3 h-3" />
                          <span className="max-w-[85px] truncate">{selectedLocation.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedLocation(null)}
                            className="text-white/70 hover:text-white ml-0.5 text-xs font-bold cursor-pointer"
                            title="Remove location"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right-Side Vertical Floating Toolbar (Facebook / Instagram Column Style) */}
                  <div className="absolute top-3.5 right-3.5 flex flex-col items-center gap-2 z-30 animate-in fade-in slide-in-from-right-3 duration-200">
                    {/* Text Styling (Aa) */}
                    <button
                      type="button"
                      onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        showTextColorPicker
                          ? 'bg-white text-gray-950 font-black ring-2 ring-white/60 scale-105'
                          : 'bg-black/45 hover:bg-black/70 text-white border border-white/15'
                      }`}
                      title="Change text color (Aa)"
                    >
                      <span className="font-black text-xs tracking-tight">Aa</span>
                    </button>

                    {/* Music tool */}
                    <button
                      type="button"
                      onClick={() => setShowMusicPicker(true)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        selectedMusic
                          ? 'bg-pink-500 text-white ring-2 ring-pink-400 shadow-pink-500/30 scale-105'
                          : 'bg-black/45 hover:bg-black/70 text-white border border-white/15'
                      }`}
                      title={selectedMusic ? `Music: ${selectedMusic.title}` : 'Add Music'}
                    >
                      <Music className="w-4 h-4" />
                    </button>

                    {/* Stickers tool */}
                    <button
                      type="button"
                      onClick={() => setShowStickerPicker(true)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        selectedStickers.length > 0
                          ? 'bg-amber-500 text-white ring-2 ring-amber-400 shadow-amber-500/30 scale-105'
                          : 'bg-black/45 hover:bg-black/70 text-white border border-white/15'
                      }`}
                      title={selectedStickers.length > 0 ? `${selectedStickers.length} Sticker(s)` : 'Add Stickers & Mentions'}
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Location tool */}
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        selectedLocation
                          ? 'bg-red-500 text-white ring-2 ring-red-400 shadow-red-500/30 scale-105'
                          : 'bg-black/45 hover:bg-black/70 text-white border border-white/15'
                      }`}
                      title={selectedLocation ? `Location: ${selectedLocation.name}` : 'Tag Location'}
                    >
                      <MapPin className="w-4 h-4" />
                    </button>

                    {/* Palette tool */}
                    <button
                      type="button"
                      onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        showTextColorPicker
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400 scale-105'
                          : 'bg-black/45 hover:bg-black/70 text-white border border-white/15'
                      }`}
                      title="Text Colors"
                    >
                      <Palette className="w-4 h-4" />
                    </button>

                    {/* Doodle Pen tool */}
                    <button
                      type="button"
                      onClick={() => setIsDoodling(!isDoodling)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        isDoodling
                          ? 'bg-amber-500 text-white ring-2 ring-amber-400 scale-105'
                          : 'bg-black/45 hover:bg-black/70 text-white border border-white/15'
                      }`}
                      title="Draw / Pen tool"
                    >
                      <PenTool className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selected Draggable Music Sticker on Canvas (Facebook Style) */}
                  {selectedMusic && (
                    <div
                      style={{
                        left: `${musicPos.x}%`,
                        top: `${musicPos.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onPointerDown={(e) => handleOverlayPointerDown(e, 'music')}
                      onPointerMove={handleOverlayPointerMove}
                      onPointerUp={handleOverlayPointerUp}
                      onPointerCancel={handleOverlayPointerUp}
                      className="absolute z-20 select-none cursor-grab active:cursor-grabbing touch-none active:scale-105 transition-transform"
                      title="Drag to reposition soundtrack anywhere on story"
                    >
                      <div
                        onClick={() => {
                          if (!hasMovedRef.current) {
                            handleOpenTrimmer(selectedMusic);
                            setShowMusicPicker(true);
                          }
                        }}
                        className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-black/70 hover:bg-black/85 backdrop-blur-md text-white rounded-full text-xs font-semibold border border-white/25 shadow-2xl transition-all cursor-pointer group/music"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCanvasMusicPlay(e);
                          }}
                          className="w-6 h-6 rounded-md bg-gradient-to-tr from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform active:scale-90"
                          title={isCanvasMusicPlaying ? 'Pause story music' : 'Play story music snippet'}
                        >
                          {isCanvasMusicPlaying ? (
                            <Pause className="w-3 h-3 text-white" />
                          ) : (
                            <Play className="w-3 h-3 ml-0.5 fill-white text-white" />
                          )}
                        </button>
                        <div className="flex flex-col text-left min-w-0 max-w-[130px] pointer-events-none">
                          <span className="font-bold text-white text-[11px] leading-tight truncate group-hover/music:text-pink-300 transition-colors">
                            {selectedMusic.title}
                          </span>
                          <span className="text-[9px] text-white/70 font-normal leading-tight truncate">
                            {selectedMusic.artist || 'Music'}
                          </span>
                        </div>
                        {isCanvasMusicPlaying && (
                          <div className="flex items-end gap-0.5 h-3 px-0.5 pointer-events-none">
                            <span className="w-0.5 bg-pink-400 rounded-full animate-pulse h-2.5" />
                            <span className="w-0.5 bg-pink-400 rounded-full animate-bounce h-1.5" />
                            <span className="w-0.5 bg-pink-400 rounded-full animate-pulse h-3" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            stopAllAudios();
                            setSelectedMusic(null);
                          }}
                          className="w-4 h-4 rounded-full hover:bg-white/20 text-white/60 hover:text-red-400 flex items-center justify-center cursor-pointer font-bold text-xs ml-0.5 transition-colors"
                          title="Remove soundtrack"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Text Color Picker dropdown palette */}
                  {showTextColorPicker && (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 bg-black/40 backdrop-blur-md rounded-2xl mx-auto px-3 border border-white/10 z-10 animate-in fade-in zoom-in-95 duration-150">
                      {STORY_TEXT_COLORS.map((tc) => (
                        <button
                          key={tc.id}
                          type="button"
                          onClick={() => {
                            setSelectedTextColor(tc.color);
                            setShowTextColorPicker(false);
                          }}
                          className={`w-5 h-5 rounded-full transition-transform hover:scale-120 cursor-pointer ring-2 ${
                            selectedTextColor === tc.color ? 'ring-white scale-110 shadow-sm' : 'ring-transparent'
                          }`}
                          style={{ backgroundColor: tc.color }}
                          title={tc.name}
                        />
                      ))}
                    </div>
                  )}

                  {/* Doodle Controls Bar if active */}
                  {isDoodling && (
                    <div className="flex items-center justify-center gap-2 py-1.5 bg-black/60 backdrop-blur-md rounded-2xl mx-auto px-3 border border-white/20 z-30 animate-in fade-in duration-150">
                      <span className="text-[10px] font-bold text-white/80">Pen:</span>
                      {['#FFFFFF', '#FBBF24', '#EF4444', '#06B6D4', '#10B981'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDoodleColor(c)}
                          className={`w-4 h-4 rounded-full transition-transform cursor-pointer ring-2 ${
                            doodleColor === c ? 'ring-white scale-125' : 'ring-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={clearDoodle}
                        className="text-[10px] text-white/80 hover:text-white px-1.5 py-0.5 rounded bg-white/20 ml-1 cursor-pointer flex items-center gap-0.5"
                        title="Clear drawing"
                      >
                        <Eraser className="w-2.5 h-2.5" /> Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDoodling(false)}
                        className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-700 cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  )}

                  {/* Doodle Canvas overlay */}
                  {isDoodling && (
                    <canvas
                      ref={doodleCanvasRef}
                      width={380}
                      height={400}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="absolute inset-0 z-20 w-full h-full cursor-crosshair touch-none"
                    />
                  )}

                  {/* Central Canvas Textarea */}
                  <div className="my-auto text-center px-4 space-y-2 z-10">
                    <textarea
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Type your story thoughts here..."
                      style={{ color: selectedTextColor }}
                      className="w-full bg-transparent border-none text-center text-xl sm:text-2xl font-black placeholder:text-white/60 focus:outline-none resize-none drop-shadow-lg leading-relaxed"
                      autoFocus
                    />

                    {/* Render interactive draggable stickers on story canvas */}
                    {selectedStickers.map((stk, idx) => (
                      <div
                        key={idx}
                        style={{
                          left: `${stk.x ?? 50}%`,
                          top: `${stk.y ?? 45 + ((idx * 8) % 40)}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onPointerDown={(e) => handleOverlayPointerDown(e, 'sticker', idx)}
                        onPointerMove={handleOverlayPointerMove}
                        onPointerUp={handleOverlayPointerUp}
                        onPointerCancel={handleOverlayPointerUp}
                        className="absolute z-20 select-none cursor-grab active:cursor-grabbing touch-none active:scale-105 transition-transform"
                        title="Drag sticker anywhere on canvas"
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-md font-black text-xs sm:text-sm border shadow-xl ${
                            stk.type === 'mention'
                              ? 'bg-blue-600/85 text-white border-blue-400/40'
                              : 'bg-white/25 text-white border-white/30'
                          }`}
                        >
                          <span className="pointer-events-none">{stk.text}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStickers((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="w-4 h-4 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-red-400 flex items-center justify-center cursor-pointer font-bold text-xs ml-0.5 transition-colors"
                            title="Remove sticker"
                          >
                            ×
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Instagram Gradient Palette Swatches */}
                  <div className="flex items-center justify-center gap-2 pt-2 bg-black/25 rounded-full px-3 py-1.5 backdrop-blur-md w-fit mx-auto z-10 border border-white/10">
                    {STORY_GRADIENTS.map((grad) => (
                      <button
                        key={grad.id}
                        type="button"
                        onClick={() => setSelectedStoryGradient(grad)}
                        style={{ background: grad.css || grad.hex }}
                        className={`w-6 h-6 rounded-full transition-transform hover:scale-115 cursor-pointer ring-2 ${
                          selectedStoryGradient.id === grad.id ? 'ring-white scale-110 shadow-md' : 'ring-transparent'
                        }`}
                        title={grad.name}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* 2. PHOTO / VIDEO STORY CANVAS */
                <div
                  ref={(el) => { if (el) activeCanvasRef.current = el; }}
                  className="relative w-full aspect-[9/14] sm:aspect-[9/13] max-h-[410px] rounded-3xl p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 mx-auto border border-white/20 overflow-hidden bg-slate-900"
                >
                  {/* Photo / Video Background */}
                  {previewUrl ? (
                    <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
                      {selectedFile?.type.startsWith('video') ? (
                        <video src={previewUrl} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={previewUrl} alt="Story upload" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ) : null}

                  {/* Top Header */}
                  <div className="flex justify-between items-center text-white/90 text-xs z-20">
                    <div className="flex items-center gap-2">
                      <span className="font-bold flex items-center gap-1.5 bg-black/45 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/15 text-white text-xs shadow-md">
                        <Camera className="w-3.5 h-3.5 text-blue-400" /> Photo Story
                      </span>
                      {selectedLocation && (
                        <span className="font-semibold flex items-center gap-1 bg-red-600/80 px-2.5 py-1 rounded-full backdrop-blur-md border border-red-400/30 text-white text-[11px] shadow-md animate-in fade-in duration-150">
                          <MapPin className="w-3 h-3" />
                          <span className="max-w-[85px] truncate">{selectedLocation.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedLocation(null)}
                            className="text-white/70 hover:text-white ml-0.5 text-xs font-bold cursor-pointer"
                            title="Remove location"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right-Side Vertical Floating Toolbar (Facebook / Instagram Column Style) */}
                  <div className="absolute top-3.5 right-3.5 flex flex-col items-center gap-2 z-30 animate-in fade-in slide-in-from-right-3 duration-200">
                    {/* Aa Text tool button */}
                    <button
                      type="button"
                      onClick={() => setIsPhotoTextActive((prev) => !prev)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        isPhotoTextActive || content
                          ? 'bg-white text-gray-950 font-black ring-2 ring-white/60 scale-105'
                          : 'bg-black/50 hover:bg-black/75 text-white border border-white/15'
                      }`}
                      title={isPhotoTextActive || content ? 'Edit text overlay (Aa)' : 'Add text over photo (Aa)'}
                    >
                      <span className="font-black text-xs tracking-tight">Aa</span>
                    </button>

                    {/* Music tool */}
                    <button
                      type="button"
                      onClick={() => setShowMusicPicker(true)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        selectedMusic
                          ? 'bg-pink-500 text-white ring-2 ring-pink-400 shadow-pink-500/30 scale-105'
                          : 'bg-black/50 hover:bg-black/75 text-white border border-white/15'
                      }`}
                      title={selectedMusic ? `Music: ${selectedMusic.title}` : 'Add Music'}
                    >
                      <Music className="w-4 h-4" />
                    </button>

                    {/* Stickers tool */}
                    <button
                      type="button"
                      onClick={() => setShowStickerPicker(true)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        selectedStickers.length > 0
                          ? 'bg-amber-500 text-white ring-2 ring-amber-400 shadow-amber-500/30 scale-105'
                          : 'bg-black/50 hover:bg-black/75 text-white border border-white/15'
                      }`}
                      title={selectedStickers.length > 0 ? `${selectedStickers.length} Sticker(s)` : 'Add Stickers & Mentions'}
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Location tool */}
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        selectedLocation
                          ? 'bg-red-500 text-white ring-2 ring-red-400 shadow-red-500/30 scale-105'
                          : 'bg-black/50 hover:bg-black/75 text-white border border-white/15'
                      }`}
                      title={selectedLocation ? `Location: ${selectedLocation.name}` : 'Tag Location'}
                    >
                      <MapPin className="w-4 h-4" />
                    </button>

                    {/* Text Color tool */}
                    <button
                      type="button"
                      onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        showTextColorPicker
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400 scale-105'
                          : 'bg-black/50 hover:bg-black/75 text-white border border-white/15'
                      }`}
                      title="Change text color"
                    >
                      <Palette className="w-4 h-4" />
                    </button>

                    {/* Doodle Pen tool */}
                    <button
                      type="button"
                      onClick={() => setIsDoodling(!isDoodling)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                        isDoodling
                          ? 'bg-amber-500 text-white ring-2 ring-amber-400 scale-105'
                          : 'bg-black/50 hover:bg-black/75 text-white border border-white/15'
                      }`}
                      title="Draw / Pen tool"
                    >
                      <PenTool className="w-4 h-4" />
                    </button>

                    {/* Remove photo button */}
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveMedia}
                        className="w-9 h-9 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg border border-red-400/30 mt-1"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Selected Draggable Music Sticker on Photo Canvas (Facebook Style) */}
                  {selectedMusic && (
                    <div
                      style={{
                        left: `${musicPos.x}%`,
                        top: `${musicPos.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onPointerDown={(e) => handleOverlayPointerDown(e, 'music')}
                      onPointerMove={handleOverlayPointerMove}
                      onPointerUp={handleOverlayPointerUp}
                      onPointerCancel={handleOverlayPointerUp}
                      className="absolute z-20 select-none cursor-grab active:cursor-grabbing touch-none active:scale-105 transition-transform"
                      title="Drag to move soundtrack anywhere on photo"
                    >
                      <div
                        onClick={() => {
                          if (!hasMovedRef.current) {
                            handleOpenTrimmer(selectedMusic);
                            setShowMusicPicker(true);
                          }
                        }}
                        className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-black/70 hover:bg-black/85 backdrop-blur-md text-white rounded-full text-xs font-semibold border border-white/25 shadow-2xl transition-all cursor-pointer group/music"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCanvasMusicPlay(e);
                          }}
                          className="w-6 h-6 rounded-md bg-gradient-to-tr from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform active:scale-90"
                          title={isCanvasMusicPlaying ? 'Pause story music' : 'Play story music snippet'}
                        >
                          {isCanvasMusicPlaying ? (
                            <Pause className="w-3 h-3 text-white" />
                          ) : (
                            <Play className="w-3 h-3 ml-0.5 fill-white text-white" />
                          )}
                        </button>
                        <div className="flex flex-col text-left min-w-0 max-w-[130px] pointer-events-none">
                          <span className="font-bold text-white text-[11px] leading-tight truncate group-hover/music:text-pink-300 transition-colors">
                            {selectedMusic.title}
                          </span>
                          <span className="text-[9px] text-white/70 font-normal leading-tight truncate">
                            {selectedMusic.artist || 'Music'}
                          </span>
                        </div>
                        {isCanvasMusicPlaying && (
                          <div className="flex items-end gap-0.5 h-3 px-0.5 pointer-events-none">
                            <span className="w-0.5 bg-pink-400 rounded-full animate-pulse h-2.5" />
                            <span className="w-0.5 bg-pink-400 rounded-full animate-bounce h-1.5" />
                            <span className="w-0.5 bg-pink-400 rounded-full animate-pulse h-3" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            stopAllAudios();
                            setSelectedMusic(null);
                          }}
                          className="w-4 h-4 rounded-full hover:bg-white/20 text-white/60 hover:text-red-400 flex items-center justify-center cursor-pointer font-bold text-xs ml-0.5 transition-colors"
                          title="Remove soundtrack"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Text Color Picker dropdown palette */}
                  {showTextColorPicker && (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 bg-black/60 backdrop-blur-md rounded-2xl mx-auto px-3 border border-white/10 z-30 animate-in fade-in zoom-in-95 duration-150">
                      {STORY_TEXT_COLORS.map((tc) => (
                        <button
                          key={tc.id}
                          type="button"
                          onClick={() => {
                            setSelectedTextColor(tc.color);
                            setShowTextColorPicker(false);
                          }}
                          className={`w-5 h-5 rounded-full transition-transform hover:scale-120 cursor-pointer ring-2 ${
                            selectedTextColor === tc.color ? 'ring-white scale-110 shadow-sm' : 'ring-transparent'
                          }`}
                          style={{ backgroundColor: tc.color }}
                          title={tc.name}
                        />
                      ))}
                    </div>
                  )}

                  {/* Doodle Controls Bar if active */}
                  {isDoodling && (
                    <div className="flex items-center justify-center gap-2 py-1.5 bg-black/60 backdrop-blur-md rounded-2xl mx-auto px-3 border border-white/20 z-30 animate-in fade-in duration-150">
                      <span className="text-[10px] font-bold text-white/80">Pen:</span>
                      {['#FFFFFF', '#FBBF24', '#EF4444', '#06B6D4', '#10B981'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDoodleColor(c)}
                          className={`w-4 h-4 rounded-full transition-transform cursor-pointer ring-2 ${
                            doodleColor === c ? 'ring-white scale-125' : 'ring-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={clearDoodle}
                        className="text-[10px] text-white/80 hover:text-white px-1.5 py-0.5 rounded bg-white/20 ml-1 cursor-pointer flex items-center gap-0.5"
                        title="Clear drawing"
                      >
                        <Eraser className="w-2.5 h-2.5" /> Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDoodling(false)}
                        className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-700 cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  )}

                  {/* Doodle Canvas overlay */}
                  {isDoodling && (
                    <canvas
                      ref={doodleCanvasRef}
                      width={380}
                      height={400}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="absolute inset-0 z-25 w-full h-full cursor-crosshair touch-none"
                    />
                  )}

                  {/* Photo / Video Center Content Area */}
                  {previewUrl ? (
                    <div
                      className="my-auto text-center px-4 space-y-2 z-20 w-full"
                      onClick={() => {
                        if (!isPhotoTextActive && !content) {
                          setIsPhotoTextActive(true);
                        }
                      }}
                    >
                      {isPhotoTextActive ? (
                        <div
                          className="relative max-w-xs mx-auto animate-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <textarea
                            rows={3}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Type text over photo..."
                            style={{ color: selectedTextColor }}
                            className="w-full bg-black/65 backdrop-blur-md rounded-2xl p-3.5 pr-9 border border-white/20 text-center text-lg sm:text-xl font-black placeholder:text-white/50 focus:outline-none resize-none drop-shadow-lg leading-relaxed"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setIsPhotoTextActive(false)}
                            className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-colors"
                            title="Done adding text"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : content.trim().length > 0 ? (
                        <div
                          style={{
                            left: `${textPos.x}%`,
                            top: `${textPos.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          onPointerDown={(e) => handleOverlayPointerDown(e, 'text')}
                          onPointerMove={handleOverlayPointerMove}
                          onPointerUp={handleOverlayPointerUp}
                          onPointerCancel={handleOverlayPointerUp}
                          className="absolute z-20 select-none cursor-grab active:cursor-grabbing touch-none active:scale-105 transition-transform"
                          title="Drag to reposition text anywhere above photo, or click to edit"
                        >
                          <div
                            onClick={(e) => {
                              if (!hasMovedRef.current) {
                                e.stopPropagation();
                                setIsPhotoTextActive(true);
                              }
                            }}
                            className="cursor-pointer group/caption"
                          >
                            <span
                              className="inline-block bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-lg sm:text-xl font-black drop-shadow-md max-w-xs group-hover/caption:border-white/50 transition-colors shadow-2xl"
                              style={{ color: selectedTextColor }}
                            >
                              {content}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* Draggable Stickers & Mentions on Media Canvas */}
                      {selectedStickers.map((stk, idx) => (
                        <div
                          key={idx}
                          style={{
                            left: `${stk.x ?? 50}%`,
                            top: `${stk.y ?? 45 + ((idx * 8) % 40)}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          onPointerDown={(e) => handleOverlayPointerDown(e, 'sticker', idx)}
                          onPointerMove={handleOverlayPointerMove}
                          onPointerUp={handleOverlayPointerUp}
                          onPointerCancel={handleOverlayPointerUp}
                          className="absolute z-20 select-none cursor-grab active:cursor-grabbing touch-none active:scale-105 transition-transform"
                          title="Drag sticker anywhere on canvas"
                        >
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-md font-black text-xs sm:text-sm border shadow-xl ${
                              stk.type === 'mention'
                                ? 'bg-blue-600/85 text-white border-blue-400/40'
                                : 'bg-white/25 text-white border-white/30'
                            }`}
                          >
                            <span className="pointer-events-none">{stk.text}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStickers((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="w-4 h-4 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-red-400 flex items-center justify-center cursor-pointer font-bold text-xs ml-0.5 transition-colors"
                              title="Remove sticker"
                            >
                              ×
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center p-6 text-center my-auto z-10 group/drop">
                      <div className="w-16 h-16 rounded-3xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 ring-1 ring-blue-500/30 group-hover/drop:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <span className="text-white font-bold text-sm block">Choose Photo or Video</span>
                      <span className="text-white/60 text-xs mt-1 block">Tap to select from your device</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )
            ) : (
              /* STANDARD FEED POST COMPOSER */
              <div
                className={`rounded-2xl transition-all duration-300 ${
                  activeGradConfig.id !== 'none' && isPostTextOnly
                    ? `${activeGradConfig.bg} p-6 min-h-[190px] flex items-center justify-center shadow-inner`
                    : 'bg-transparent'
                }`}
              >
                <textarea
                  rows={isPostTextOnly && activeGradConfig.id !== 'none' ? 4 : type === 'video' ? 3 : 4}
                  placeholder={
                    type === 'video'
                      ? 'Write a captivating caption for your reel...'
                      : `What's on your mind, ${currentUser.name.split(' ')[0]}?`
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`w-full text-base sm:text-lg border-none focus:ring-0 p-0 resize-none focus:outline-none transition-colors ${
                    activeGradConfig.id !== 'none' && isPostTextOnly
                      ? activeGradConfig.text
                      : 'text-gray-900 placeholder:text-gray-400'
                  }`}
                  autoFocus
                />
              </div>
            )}

            {/* Facebook Colorful Post Background Picker (Aa Bar) */}
            {type !== 'story' && isPostTextOnly && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowGradientPicker(!showGradientPicker)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-purple-600" />
                    <span>Backgrounds</span>
                  </button>

                  {showGradientPicker && (
                    <div className="flex items-center gap-1.5 pl-2 animate-in fade-in slide-in-from-left-2 duration-150">
                      {POST_GRADIENTS.map((grad) => (
                        <button
                          key={grad.id}
                          type="button"
                          onClick={() => setSelectedGradient(grad.id)}
                          className={`w-6 h-6 rounded-lg ${grad.preview} transition-transform hover:scale-115 cursor-pointer ring-2 ${
                            selectedGradient === grad.id ? 'ring-blue-600 scale-105' : 'ring-transparent'
                          }`}
                          title={grad.label}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[11px] text-gray-400">
                  {content.length}/1000
                </span>
              </div>
            )}

            {/* Media Upload & Preview Dropzone (For feed posts) */}
            {type !== 'story' && (type === 'photo' || type === 'video' || previewUrl) && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all p-3 bg-gray-50/60 relative group">
                {previewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden max-h-80 bg-black flex items-center justify-center shadow-inner group/preview">
                    {selectedFile?.type.startsWith('video') ? (
                      <video src={previewUrl} controls className="max-h-80 w-full object-contain" />
                    ) : (
                      <img src={previewUrl} alt="Upload preview" className="max-h-80 w-full object-contain" />
                    )}

                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors backdrop-blur-xs cursor-pointer shadow-md z-30"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100/80 text-blue-600 mx-auto flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-800 block">
                      Add {type === 'video' ? 'Video' : 'Photos and Videos'}
                    </span>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      or drag and drop directly into this zone
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={type === 'video' ? 'video/*' : 'image/*,video/*'}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* "ADD TO YOUR POST" - Professional Facebook Action Bar */}
            <div className="rounded-xl border border-gray-200/90 p-3 flex items-center justify-between shadow-2xs bg-white">
              <span className="text-xs sm:text-sm font-semibold text-gray-700 select-none">
                Add to your post
              </span>

              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Photo Trigger */}
                <label
                  className="p-2 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer group relative"
                  title="Photo / Video"
                >
                  <Image className="w-5 h-5 group-hover:scale-115 transition-transform" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Video Trigger */}
                <label
                  className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer group relative"
                  title="Video / Reel"
                >
                  <Video className="w-5 h-5 group-hover:scale-115 transition-transform" />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Feeling / Activity Trigger */}
                <div className="relative" ref={feelingsRef}>
                  <button
                    type="button"
                    onClick={() => setShowFeelingsPicker(!showFeelingsPicker)}
                    className="p-2 rounded-full hover:bg-amber-50 text-amber-500 transition-colors cursor-pointer group"
                    title="Feeling / Activity"
                  >
                    <Smile className="w-5 h-5 group-hover:scale-115 transition-transform" />
                  </button>

                  {/* Feelings Popover */}
                  {showFeelingsPicker && (
                    <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        How are you feeling?
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        {QUICK_FEELINGS.map((f) => (
                          <button
                            key={f.label}
                            type="button"
                            onClick={() => {
                              setSelectedFeeling(f);
                              setShowFeelingsPicker(false);
                            }}
                            className="px-2 py-1.5 rounded-lg hover:bg-gray-100 text-left text-xs text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>{f.emoji}</span>
                            <span className="capitalize">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Maps Location / Check In Trigger */}
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="p-2 rounded-full hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer group"
                  title="Check in with Google Maps"
                >
                  <MapPin className="w-5 h-5 group-hover:scale-115 transition-transform" />
                </button>

                {/* Tag Friends Trigger */}
                <button
                  type="button"
                  onClick={() => toast.info('Mention friends by typing @ in your post!')}
                  className="p-2 rounded-full hover:bg-purple-50 text-purple-600 transition-colors cursor-pointer group"
                  title="Tag People"
                >
                  <Tag className="w-5 h-5 group-hover:scale-115 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer - Full-width Facebook Style Primary Button */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <button
              type="submit"
              disabled={!canPublish || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEditing ? 'Saving...' : 'Publishing...'}</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : type === 'story' ? 'Share to Story' : 'Post'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )}

  {/* Google Map Location Picker Modal */}
  <GoogleMapLocationModal
    isOpen={isMapModalOpen}
    onClose={() => setIsMapModalOpen(false)}
    onSelectLocation={(loc) => setSelectedLocation(loc)}
    initialLocation={selectedLocation}
  />

  {/* Story Soundtrack Picker & Trimmer Modal */}
  {showMusicPicker && (
    <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-lg p-5 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            {trimmingTrack ? (
              <button
                type="button"
                onClick={() => {
                  if (trimAudioRef.current) trimAudioRef.current.pause();
                  setIsTrimPlaying(false);
                  setTrimmingTrack(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Back to tracks"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center ring-1 ring-pink-500/30">
                <Music className="w-5 h-5" />
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <span>{trimmingTrack ? 'Trim Story Soundtrack' : 'Story Soundtrack Library'}</span>
                <span className="text-[9px] bg-pink-500/30 text-pink-300 px-1.5 py-0.2 rounded-full font-semibold">
                  {trimmingTrack ? '40s Clip' : musicTab === 'local' ? 'Local Hits' : 'Online API'}
                </span>
              </h4>
              <p className="text-[10px] text-white/60">
                {trimmingTrack
                  ? 'Drag the 40-second frame to select your favorite chorus or melody'
                  : 'Add background music from Egyptian hits or royalty-free library'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {trimmingTrack && (
              <button
                type="button"
                onClick={handleApplyTrimmedTrack}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-pink-500/25 flex items-center gap-1 cursor-pointer transition-all"
                title="Done - Apply snippet to story"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done (تم)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                stopAllAudios();
                setTrimmingTrack(null);
                setShowMusicPicker(false);
              }}
              className="text-white/60 hover:text-white p-1 rounded-full cursor-pointer hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW A: FACEBOOK-STYLE 40-SECOND AUDIO TRIMMER */}
        {trimmingTrack ? (
          <div className="space-y-4 py-1">
            {/* Center Album Art & Track Info (Facebook Style) */}
            <div className="flex flex-col items-center justify-center text-center pt-1 space-y-2">
              <div className="relative group">
                <img
                  src={trimmingTrack.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80'}
                  alt={trimmingTrack.title}
                  className={`w-20 h-20 rounded-2xl object-cover ring-2 ring-pink-500/40 shadow-2xl transition-transform ${
                    isTrimPlaying ? 'scale-105 shadow-pink-500/30' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={toggleTrimPlayback}
                  className="absolute inset-0 bg-black/40 hover:bg-black/50 rounded-2xl flex items-center justify-center text-white transition-opacity cursor-pointer group-hover:opacity-100"
                  title={isTrimPlaying ? 'Pause snippet' : 'Play snippet'}
                >
                  <div className="w-10 h-10 rounded-full bg-pink-500/90 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    {isTrimPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-white" />}
                  </div>
                </button>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-white leading-tight max-w-xs truncate">
                  {trimmingTrack.title}
                </h4>
                <p className="text-xs text-pink-300 font-semibold mt-0.5">{trimmingTrack.artist}</p>
                <div className="flex items-center justify-center gap-2 text-[10px] text-white/50 mt-1">
                  <span className="bg-white/10 px-2 py-0.5 rounded-full">{trimmingTrack.genre || 'Soundtrack'}</span>
                  <span>•</span>
                  <span>40 Seconds Story Clip</span>
                </div>
              </div>
            </div>

            {/* Facebook Horizontal Soundwave & Highlighted 60s Window */}
            <div className="bg-black/50 border border-white/10 rounded-3xl p-4 text-center space-y-3 shadow-inner">
              {/* Selected Window Time Pill */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-1.5 font-mono text-pink-300 font-bold bg-pink-950/70 px-2.5 py-1 rounded-xl border border-pink-500/30 shadow-xs">
                  <span>Start:</span>
                  <span>{Math.floor(trimStart / 60)}:{String(Math.floor(trimStart % 60)).padStart(2, '0')}</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-extrabold text-white bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  <Scissors className="w-3 h-3 text-pink-400" />
                  <span>40s Clip</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-pink-300 font-bold bg-pink-950/70 px-2.5 py-1 rounded-xl border border-pink-500/30 shadow-xs">
                  <span>End:</span>
                  <span>{Math.floor((trimStart + STORY_CLIP_DURATION) / 60)}:{String(Math.floor((trimStart + STORY_CLIP_DURATION) % 60)).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Soundwave Visualizer Bar with Facebook Highlight Draggable Frame */}
              <div
                ref={waveformRef}
                onPointerDown={handleWaveformPointerDown}
                onPointerMove={handleWaveformPointerMove}
                onPointerUp={handleWaveformPointerUp}
                onPointerCancel={handleWaveformPointerUp}
                className="relative h-16 w-full bg-slate-950/80 rounded-2xl border border-white/10 flex items-center justify-between gap-1 px-3 overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
                title="Click and drag directly on the soundwave or pink frame to move the 40-second clip"
              >
                {/* Visual soundwave bars (Facebook styling) */}
                {Array.from({ length: 38 }).map((_, i) => {
                  const totalSec = trimmingTrack.duration || 180;
                  const pct = i / 38;
                  const startPct = trimStart / totalSec;
                  const endPct = (trimStart + STORY_CLIP_DURATION) / totalSec;
                  const isInside = pct >= startPct && pct <= endPct;
                  const wavePattern = [32, 48, 65, 88, 52, 74, 98, 42, 68, 84, 58, 92, 78, 46, 62, 88, 100, 72, 54, 82, 68, 92, 42, 78, 98, 64, 88, 52, 74, 84, 62, 92, 78, 48, 68, 88, 58, 42];
                  const height = wavePattern[i % wavePattern.length];

                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full pointer-events-none transition-colors duration-150 ${
                        isInside
                          ? isTrimPlaying
                            ? 'bg-gradient-to-t from-pink-500 via-rose-400 to-amber-300 shadow-xs shadow-pink-500/50'
                            : 'bg-gradient-to-t from-pink-500 to-rose-400'
                          : 'bg-slate-700/60'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}

                {/* Facebook Draggable Pink Frame Handle */}
                <div
                  className={`absolute inset-y-1 rounded-2xl border-2 border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/20 flex items-center justify-between px-1 pointer-events-none transition-[left,width] duration-75 ${
                    isDraggingWaveform ? 'border-pink-300 ring-2 ring-pink-400/50' : ''
                  }`}
                  style={{
                    left: `${(trimStart / (trimmingTrack.duration || 180)) * 100}%`,
                    width: `${Math.min(100 - (trimStart / (trimmingTrack.duration || 180)) * 100, (STORY_CLIP_DURATION / (trimmingTrack.duration || 180)) * 100)}%`,
                  }}
                >
                  {/* Left Facebook handle pill */}
                  <div className="w-1.5 h-7 bg-pink-400 rounded-full shadow-md flex items-center justify-center">
                    <div className="w-0.5 h-3 bg-white/80 rounded-full" />
                  </div>

                  {/* Middle Badge */}
                  <div className="text-[9px] font-mono font-bold text-pink-200 tracking-wider hidden sm:block bg-black/40 px-2 py-0.5 rounded-full border border-pink-400/30">
                    40 SEC
                  </div>

                  {/* Right Facebook handle pill */}
                  <div className="w-1.5 h-7 bg-pink-400 rounded-full shadow-md flex items-center justify-center">
                    <div className="w-0.5 h-3 bg-white/80 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Interactive Scrubber Slider */}
              <div className="space-y-1 pt-1">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, Math.floor(trimmingTrack.duration || 180) - STORY_CLIP_DURATION)}
                  step={1}
                  value={trimStart}
                  onChange={(e) => handleTrimStartChange(Number(e.target.value), false)}
                  className="w-full h-2.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex justify-between text-[10px] text-white/50 px-1 font-medium">
                  <span>0:00 (Start)</span>
                  <span>Drag handle to pick 40s chorus</span>
                  <span>{Math.floor((trimmingTrack.duration || 180) / 60)}:{String(Math.floor((trimmingTrack.duration || 180) % 60)).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Facebook Quick Jump Presets */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-white/60">Quick Jump:</span>
                {[
                  { label: 'Intro (0:00)', sec: 0 },
                  { label: 'Verse (0:30)', sec: 30 },
                  { label: 'Chorus (1:00)', sec: 60 },
                  { label: 'Climax (1:30)', sec: 90 },
                ]
                  .filter((p) => p.sec + STORY_CLIP_DURATION <= (trimmingTrack.duration || 180))
                  .map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleTrimStartChange(p.sec, true)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer border ${
                        trimStart === p.sec
                          ? 'bg-pink-500 text-white border-pink-400 shadow-xs'
                          : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/10'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
              </div>
            </div>

            {/* Trimmer Bottom Done / Apply Button */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={toggleTrimPlayback}
                className="flex-1 py-3 rounded-2xl font-bold text-xs bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10 shadow-sm"
              >
                {isTrimPlaying ? (
                  <>
                    <Pause className="w-4 h-4 text-pink-400" />
                    <span>Pause Snippet</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-pink-400 fill-pink-400" />
                    <span>Preview 40s Snippet</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleApplyTrimmedTrack}
                className="flex-1 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 active:scale-95 text-white shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply to Story (تطبيق)</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW B: DUAL-TAB MUSIC TRACK EXPLORER */
          <>
            {/* Dual Mode Switcher Tabs */}
            <div className="flex border border-white/15 rounded-2xl bg-white/5 p-1 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMusicTab('local');
                  setMusicQuery('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  musicTab === 'local'
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Local Hits (أغاني محلية)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMusicTab('online');
                  setMusicQuery('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  musicTab === 'online'
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>FreeToUse API Online</span>
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
              <input
                type="text"
                value={musicQuery}
                onChange={(e) => setMusicQuery(e.target.value)}
                placeholder={
                  musicTab === 'local'
                    ? 'Search Ahmed Saad, Wegz, Assala, Hamo El Morshedy...'
                    : 'Search lofi, beats, ambient, pop from FreeToUse API...'
                }
                className="w-full bg-white/10 border border-white/15 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-pink-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Track list */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 flex-1">
              {isLoadingMusic ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-white/60">
                  <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
                  <span className="text-xs">Loading tracks from FreeToUse API...</span>
                </div>
              ) : musicTracks.length === 0 ? (
                <div className="py-8 text-center text-white/50 text-xs">
                  No tracks found matching "{musicQuery}".
                </div>
              ) : (
                musicTracks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      selectedMusic?.id === t.id
                        ? 'bg-pink-500/20 border-pink-500/60 shadow-inner'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => togglePlayTrackPreview(t)}
                        className="w-10 h-10 rounded-xl bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-md transition-transform active:scale-95 relative overflow-hidden group/btn"
                        title={previewTrackId === t.id ? 'Pause preview' : 'Play preview'}
                      >
                        {t.cover && (
                          <img
                            src={t.cover}
                            alt={t.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/btn:opacity-40 transition-opacity"
                          />
                        )}
                        <span className="relative z-10">
                          {previewTrackId === t.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </span>
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="text-xs font-bold truncate text-white">{t.title}</h5>
                          {t.isLocal && (
                            <span className="text-[9px] font-bold bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded-full">
                              Local Hit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/60 truncate mt-0.5">
                          <span className="truncate">{t.artist}</span>
                          {t.genre && (
                            <>
                              <span>•</span>
                              <span className="text-pink-300 font-medium truncate">{t.genre}</span>
                            </>
                          )}
                          {t.duration && (
                            <>
                              <span>•</span>
                              <span>
                                {Math.floor(t.duration / 60)}:{Math.floor(t.duration % 60).toString().padStart(2, '0')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenTrimmer(t)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-pink-500 hover:bg-pink-600 active:scale-95 text-white shadow-md transition-all cursor-pointer flex items-center gap-1"
                        title="Choose 15s snippet"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Trim</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMusic({
                            ...t,
                            startTime: 0,
                            duration: STORY_CLIP_DURATION,
                          });
                          stopAllAudios();
                          setShowMusicPicker(false);
                          toast.success(`Track "${t.title}" (40s clip) added to story!`, 'Music Selected');
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedMusic?.id === t.id
                            ? 'bg-white text-gray-900 shadow-md'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                        title="Use first 40 seconds"
                      >
                        {selectedMusic?.id === t.id ? 'Selected' : 'Use'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )}

  {/* Stickers & Mentions Picker Modal */}
  {showStickerPicker && (
    <div className="fixed inset-0 z-[10001] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-sm p-5 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center ring-1 ring-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Stickers & @Mentions</h4>
              <p className="text-[10px] text-white/60">Tap to place on your story</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowStickerPicker(false)}
            className="text-white/60 hover:text-white p-1 rounded-full cursor-pointer hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stickers Grid */}
        <div>
          <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block mb-2">Popular Stickers</span>
          <div className="grid grid-cols-4 gap-2">
            {STORY_STICKERS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedStickers((prev) => [
                    ...prev,
                    { type: 'sticker', text: s.text, x: 50, y: 38 + ((prev.length * 9) % 36) },
                  ]);
                  setShowStickerPicker(false);
                }}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-black text-center cursor-pointer border border-white/10"
              >
                {s.text}
              </button>
            ))}
          </div>
        </div>

        {/* @Mention Tag Input */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">Tag a Friend (@mention)</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <AtSign className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="username..."
                value={mentionUsername}
                onChange={(e) => setMentionUsername(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
              />
            </div>
            <button
              type="button"
              disabled={!mentionUsername.trim()}
              onClick={() => {
                const clean = mentionUsername.trim().replace(/^@/, '');
                if (!clean) return;
                setSelectedStickers((prev) => [
                  ...prev,
                  { type: 'mention', text: `@${clean}`, x: 50, y: 44 + ((prev.length * 9) % 36) },
                ]);
                setMentionUsername('');
                setShowStickerPicker(false);
                toast.success(`Tagged @${clean}!`, 'Mention Added');
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
  </>
  );
};
