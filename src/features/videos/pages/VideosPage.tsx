import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Video, Play, Upload, Loader2 } from 'lucide-react';
import { postApi } from '../../feed/api/post.api';
import { CreateModal } from '../../../components/modals/CreateModal';
import { useAuth } from '../../auth/context/AuthContext';

interface VideoItem {
  id: string;
  title: string;
  creator: string;
  avatar: string;
  views: string;
  time: string;
  poster?: string;
  videoUrl: string;
}

export const VideosPage: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const res = (await postApi.getPublicFeed(1, 50)) as any;
      const rawPosts = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.posts)
        ? res.data.posts
        : Array.isArray(res.posts)
        ? res.posts
        : [];

      const videoPosts: VideoItem[] = [];
      rawPosts.forEach((p: any) => {
        const videoAtt = p.attachments?.find((att: any) => 
          att.secure_url?.endsWith('.mp4') || 
          att.secure_url?.endsWith('.webm') || 
          att.secure_url?.includes('/video/')
        );
        if (videoAtt?.secure_url) {
          const authorObj = p.createdBy || p.userId || {};
          const creator = authorObj.username || `${authorObj.firstName || ''} ${authorObj.lastName || ''}`.trim() || 'Community Member';
          videoPosts.push({
            id: p._id,
            title: p.content || 'Video Clip',
            creator,
            avatar: authorObj.image?.secure_url || '/assets/images/avatar/01.jpg',
            views: `${p.shareCount || 0}`,
            time: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent',
            videoUrl: videoAtt.secure_url,
          });
        }
      });
      setVideos(videoPosts);
    } catch {
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />
            Video Feeds & Reels
          </h1>
          <p className="text-xs text-gray-500 mt-1">Watch and share technical presentations, clips, and team videos.</p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)} className="gap-1.5 shrink-0 cursor-pointer">
          <Upload className="w-4 h-4" />
          Upload Video
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs">Loading videos...</span>
        </div>
      ) : videos.length === 0 ? (
        <Card className="border border-gray-100 p-12 text-center bg-white rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
            <Video className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-gray-900 text-sm">No videos found</h4>
          <p className="text-xs text-gray-500 mt-1">Be the first to upload and share a video reel with the community!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <Card key={vid.id} className="border border-gray-100 overflow-hidden group">
              <div
                className="relative aspect-video bg-black cursor-pointer overflow-hidden flex items-center justify-center"
                onClick={() => setCurrentVideo(vid)}
              >
                <video src={vid.videoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90" />
                <div className="absolute w-12 h-12 bg-white/90 backdrop-blur-xs rounded-full flex items-center justify-center text-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>

              <div className="p-4 space-y-3">
                <h3
                  onClick={() => setCurrentVideo(vid)}
                  className="font-bold text-gray-900 text-sm hover:text-blue-600 cursor-pointer line-clamp-2"
                >
                  {vid.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <img src={vid.avatar} alt={vid.creator} className="w-6 h-6 rounded-full object-cover" />
                    <span className="font-semibold text-gray-800">{vid.creator}</span>
                  </div>
                  <span>{vid.views} shares • {vid.time}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {currentVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setCurrentVideo(null)}
        >
          <div className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <video
              src={currentVideo.videoUrl}
              controls
              autoPlay
              className="w-full aspect-video bg-black"
            />
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{currentVideo.title}</h3>
                <p className="text-xs text-gray-500 mt-1">Uploaded by {currentVideo.creator}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setCurrentVideo(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <CreateModal
          isOpen={isUploadOpen}
          type="video"
          currentUser={user}
          onClose={() => setIsUploadOpen(false)}
          onSubmit={async (content, file, visibility) => {
            await postApi.createPost(content, file, visibility);
            setIsUploadOpen(false);
            loadVideos();
          }}
        />
      )}
    </div>
  );
};
