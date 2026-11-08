import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Image, Heart, MessageCircle, Plus } from 'lucide-react';

interface PhotoItem {
  id: string;
  title: string;
  image: string;
  likes: number;
  comments: number;
}

const ALBUMS_DATA: PhotoItem[] = [
  { id: '1', title: 'Mountain Hiking with Colleagues', image: '/assets/images/albums/01.jpg', likes: 132, comments: 18 },
  { id: '2', title: 'Tech Conference 2026 Keynote', image: '/assets/images/albums/02.jpg', likes: 245, comments: 34 },
  { id: '3', title: 'Office Workspace & Coffee Break', image: '/assets/images/albums/03.jpg', likes: 98, comments: 12 },
  { id: '4', title: 'Product Launch Celebration Dinner', image: '/assets/images/albums/04.jpg', likes: 312, comments: 45 },
  { id: '5', title: 'Weekend Workshop & Design Sprint', image: '/assets/images/albums/05.jpg', likes: 184, comments: 20 },
  { id: '6', title: 'Hackathon Final Presentation', image: '/assets/images/albums/06.jpg', likes: 270, comments: 29 },
];

export const AlbumsPage: React.FC = () => {
  const [photos] = useState<PhotoItem[]>(ALBUMS_DATA);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Image className="w-6 h-6 text-blue-600" />
            Photo Albums & Media
          </h1>
          <p className="text-xs text-gray-500 mt-1">Browse photos and albums shared by the community.</p>
        </div>

        <Button variant="primary" size="sm" className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" />
          Create Album
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {photos.map((item) => (
          <Card key={item.id} className="border border-gray-100 group overflow-hidden">
            <div className="relative aspect-4/3 overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setSelectedPhoto(item)}>
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                <span className="flex items-center gap-1 text-xs font-semibold">
                  <Heart className="w-4 h-4 fill-current" />
                  {item.likes}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold">
                  <MessageCircle className="w-4 h-4 fill-current" />
                  {item.comments}
                </span>
              </div>
            </div>

            <div className="p-3.5">
              <h4 className="text-xs font-bold text-gray-900 truncate hover:text-blue-600 cursor-pointer">
                {item.title}
              </h4>
            </div>
          </Card>
        ))}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.image} alt={selectedPhoto.title} className="w-full max-h-[70vh] object-cover" />
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{selectedPhoto.title}</h3>
                <div className="flex gap-3 text-xs text-gray-500 mt-1">
                  <span>{selectedPhoto.likes} Likes</span>
                  <span>{selectedPhoto.comments} Comments</span>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setSelectedPhoto(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
