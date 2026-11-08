import { axiosInstance } from '../../../lib/axios';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  cover: string;
  duration?: number;
  genre?: string;
  isLocal?: boolean;
  startTime?: number; // In seconds (trim start)
  x?: number; // Percentage on canvas (0-100)
  y?: number; // Percentage on canvas (0-100)
}

// 1. Local Arabic & Egyptian Hits from /public/assets/musics
export const LOCAL_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'local_keda_keda',
    title: 'كدا كدا (Keda Keda)',
    artist: 'أحمد سعد و جودي (Ahmed Saad & Judy)',
    audioUrl: '/assets/musics/keda-keda.mp3',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
    duration: 220,
    genre: 'Arabic Pop',
    isLocal: true,
  },
  {
    id: 'local_aleky_eyoun',
    title: 'عليكي عيون (Aleky Eyoun)',
    artist: 'أحمد سعد (Ahmed Saad)',
    audioUrl: '/assets/musics/aleky-eyoun.mp3',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80',
    duration: 250,
    genre: 'Arabic Romantic',
    isLocal: true,
  },
  {
    id: 'local_ekhtayaraty',
    title: 'اختياراتي (Ekhtayaraty)',
    artist: 'أحمد سعد (Ahmed Saad)',
    audioUrl: '/assets/musics/ekhtayaraty.mp3',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
    duration: 210,
    genre: 'Arabic Hit',
    isLocal: true,
  },
  {
    id: 'local_kooty',
    title: 'كوتي (Kooty)',
    artist: 'أحمد سعد (Ahmed Saad)',
    audioUrl: '/assets/musics/kooty.mp3',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    duration: 180,
    genre: 'Arabic Pop',
    isLocal: true,
  },
  {
    id: 'local_mekassarat',
    title: 'مكسرات (Mekassarat)',
    artist: 'أحمد سعد (Ahmed Saad)',
    audioUrl: '/assets/musics/mekassarat.mp3',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80',
    duration: 215,
    genre: 'Shaabi / Pop',
    isLocal: true,
  },
  {
    id: 'local_mertaheen',
    title: 'مرتاحين (Mertaheen)',
    artist: 'أحمد سعد (Ahmed Saad)',
    audioUrl: '/assets/musics/mertaheen.mp3',
    cover: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300&q=80',
    duration: 240,
    genre: 'Arabic Pop',
    isLocal: true,
  },
  {
    id: 'local_wasa3_wasa3',
    title: 'وسع وسع (Wasa3 Wasa3)',
    artist: 'أحمد سعد (Ahmed Saad)',
    audioUrl: '/assets/musics/wasa3-wasa3.mp3',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
    duration: 225,
    genre: 'Arabic Dance',
    isLocal: true,
  },
  {
    id: 'local_assala',
    title: 'أصالة (Assala)',
    artist: 'أصالة (Assala)',
    audioUrl: '/assets/musics/assala.mp3',
    cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80',
    duration: 190,
    genre: 'Tarab / Classic',
    isLocal: true,
  },
  {
    id: 'local_el_bakht',
    title: 'البخت (El Bakht)',
    artist: 'ويجز (Wegz)',
    audioUrl: '/assets/musics/el-bakht.mp3',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80',
    duration: 240,
    genre: 'Trap / Hip Hop',
    isLocal: true,
  },
  {
    id: 'local_el_wa3d',
    title: 'الوعد (El Wa3d)',
    artist: 'ويجز (Wegz)',
    audioUrl: '/assets/musics/el-wa3d.mp3',
    cover: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=300&q=80',
    duration: 260,
    genre: 'Hip Hop / Rap',
    isLocal: true,
  },
  {
    id: 'local_dabbaba',
    title: 'اركب الدبابه اركب الحصان',
    artist: 'حمو المرشدي',
    audioUrl: '/assets/musics/dabbaba.mp3',
    cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=80',
    duration: 180,
    genre: 'Mahraganat / Shaabi',
    isLocal: true,
  },
  {
    id: 'local_khasouma',
    title: 'ركبت الخصومه ركبت البومه',
    artist: 'حمو المرشدي',
    audioUrl: '/assets/musics/khasouma.mp3',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
    duration: 250,
    genre: 'Mahraganat / Shaabi',
    isLocal: true,
  },
  {
    id: 'local_bahibak',
    title: 'طب ب بحبك (العيون الحلوه دي)',
    artist: 'حمو المرشدي',
    audioUrl: '/assets/musics/bahibak.mp3',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80',
    duration: 175,
    genre: 'Mahraganat / Shaabi',
    isLocal: true,
  },
  {
    id: 'local_nesyan',
    title: 'كوكب النسيان (كفايا طيران)',
    artist: 'حمو المرشدي',
    audioUrl: '/assets/musics/nesyan.mp3',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80',
    duration: 195,
    genre: 'Mahraganat / Shaabi',
    isLocal: true,
  },
];

// 2. High-quality fallback royalty-free tracks
export const FALLBACK_TRACKS: MusicTrack[] = [
  {
    id: 'ftu-ambient-1',
    title: 'Starchild (Celestial Ambience)',
    artist: 'Zambolino',
    audioUrl: 'https://eu.data.freetouse.com/music/tracks/5c008648-f840-4e69-b62b-51d006b216e1/file/mp3/file.mp3',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
    duration: 135,
    genre: 'Soundtrack',
  },
  {
    id: 'ftu-lofi-1',
    title: 'Sunset Chill & Coffee',
    artist: 'Lofi Dreamer',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    duration: 140,
    genre: 'Lofi',
  },
];

export const musicApi = {
  // Get local library tracks with search
  getLocalTracks(query = ''): MusicTrack[] {
    if (!query.trim()) return LOCAL_MUSIC_TRACKS;
    const q = query.toLowerCase();
    return LOCAL_MUSIC_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.genre?.toLowerCase().includes(q)
    );
  },

  // Get online FreeToUse API tracks via backend proxy
  async getOnlineTracks(query = '', limit = 20, page = 1): Promise<MusicTrack[]> {
    try {
      const url = query.trim()
        ? `/music/tracks/search?q=${encodeURIComponent(query)}&limit=${limit}`
        : `/music/tracks/all?limit=${limit}&page=${page}`;
      const res: any = await axiosInstance.get(url);
      const tracks = res?.tracks || res?.data?.tracks;
      if (Array.isArray(tracks) && tracks.length > 0) {
        return tracks;
      }
      return FALLBACK_TRACKS;
    } catch (err) {
      console.warn('Online music fetch fallback:', err);
      return FALLBACK_TRACKS;
    }
  },
};
