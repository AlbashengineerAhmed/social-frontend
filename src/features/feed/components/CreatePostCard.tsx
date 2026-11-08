import React, { useState } from 'react';
import { Card, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { User } from '../../../types';
import { Image, Video, Calendar, Smile } from 'lucide-react';
import { CreateModal, type CreateModalType } from '../../../components/modals/CreateModal';

interface CreatePostCardProps {
  currentUser: User;
  onPostCreated: (content: string, mediaFile?: File, visibility?: string) => Promise<void> | void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({ currentUser, onPostCreated }) => {
  const [modalType, setModalType] = useState<CreateModalType>(null);

  const handleModalSubmit = async (content: string, mediaFile?: File, visibility?: string) => {
    await onPostCreated(content, mediaFile, visibility);
  };

  return (
    <>
      <Card className="border border-gray-100 shadow-xs">
        <CardBody className="p-4">
          {/* Top Trigger Row */}
          <div className="flex gap-3 items-center">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <button
              type="button"
              onClick={() => setModalType('post')}
              className="w-full text-left text-xs sm:text-sm bg-gray-100 hover:bg-gray-200/80 text-gray-500 rounded-full px-4 py-2.5 transition-colors cursor-pointer"
            >
              Share your thoughts, {currentUser.name.split(' ')[0]}...
            </button>
          </div>

          {/* Quick Action Buttons - Opens Modal directly */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setModalType('photo')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <Image className="w-4 h-4" />
                <span>Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setModalType('video')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </button>

              <button
                type="button"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Event</span>
              </button>

              <button
                type="button"
                onClick={() => setModalType('post')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-500 hover:bg-amber-50 transition-colors"
              >
                <Smile className="w-4 h-4" />
                <span>Feeling</span>
              </button>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setModalType('post')}
            >
              Post
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Pop-up Creation Modal */}
      <CreateModal
        isOpen={!!modalType}
        type={modalType}
        currentUser={currentUser}
        onClose={() => setModalType(null)}
        onSubmit={handleModalSubmit}
      />
    </>
  );
};
