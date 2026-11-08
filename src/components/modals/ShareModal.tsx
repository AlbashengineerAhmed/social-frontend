import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Repeat2, 
  Quote, 
  Link as LinkIcon, 
  Share2, 
  Bookmark, 
  Check, 
  Loader2, 
  Send 
} from 'lucide-react';
import { postApi } from '../../features/feed/api/post.api';
import { toast } from '../../stores/toastStore';
import type { Post } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onShared?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  post,
  onShared
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'quote'>('quick');
  const [quoteThoughts, setQuoteThoughts] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const canonicalPostUrl = `${window.location.origin}/post/${post.id}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(canonicalPostUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = canonicalPostUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      toast.success('Post link copied to clipboard!', 'Link Copied');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error('Could not copy link to clipboard');
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author.name}`,
          text: post.content.substring(0, 100),
          url: canonicalPostUrl,
        });
        toast.success('Shared successfully!');
        onClose();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error('Could not share externally');
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRepost = async () => {
    setIsSharing(true);
    try {
      await postApi.sharePost(post.id, { postType: 'repost' });
      toast.success('Post shared to your feed!', 'Reposted');
      onShared?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not repost at this time';
      toast.error(msg);
    } finally {
      setIsSharing(false);
    }
  };

  const handleQuoteRepost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteThoughts.trim() && activeTab === 'quote') return;

    setIsSharing(true);
    try {
      await postApi.sharePost(post.id, {
        postType: 'quote',
        content: quoteThoughts.trim()
      });
      toast.success('Quote repost published to your feed!', 'Quote Published');
      onShared?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not publish quote repost';
      toast.error(msg);
    } finally {
      setIsSharing(false);
    }
  };

  const handleSavePost = async () => {
    setIsSaving(true);
    try {
      await postApi.savePost(post.id);
      toast.success('Post saved to your bookmarks!', 'Saved');
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not save post';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-base sm:text-lg">Share Post</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-gray-100 px-6 bg-gray-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 mr-6 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quick'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Repeat2 className="w-4 h-4" />
            <span>Instant Options</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quote')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quote'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Quote className="w-4 h-4" />
            <span>Quote Repost</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {activeTab === 'quick' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Repost to Feed */}
              <button
                type="button"
                onClick={handleRepost}
                disabled={isSharing}
                className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="p-2.5 rounded-lg bg-blue-100/70 text-blue-600 group-hover:scale-105 transition-transform">
                  {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Repeat2 className="w-5 h-5" />}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 text-xs sm:text-sm">Repost</h5>
                  <p className="text-[11px] text-gray-500">Instantly share to your feed</p>
                </div>
              </button>

              {/* Quote Repost */}
              <button
                type="button"
                onClick={() => setActiveTab('quote')}
                className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="p-2.5 rounded-lg bg-purple-100/70 text-purple-600 group-hover:scale-105 transition-transform">
                  <Quote className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 text-xs sm:text-sm">Quote Post</h5>
                  <p className="text-[11px] text-gray-500">Add your own thoughts</p>
                </div>
              </button>

              {/* Copy Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-3.5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="p-2.5 rounded-lg bg-emerald-100/70 text-emerald-600 group-hover:scale-105 transition-transform">
                  {isCopied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 text-xs sm:text-sm">
                    {isCopied ? 'Link Copied!' : 'Copy Link'}
                  </h5>
                  <p className="text-[11px] text-gray-500">Canonical link for sharing</p>
                </div>
              </button>

              {/* External Share / Web Share */}
              <button
                type="button"
                onClick={handleWebShare}
                className="p-3.5 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 text-left transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="p-2.5 rounded-lg bg-amber-100/70 text-amber-600 group-hover:scale-105 transition-transform">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 text-xs sm:text-sm">External Share</h5>
                  <p className="text-[11px] text-gray-500">Share via device apps</p>
                </div>
              </button>

              {/* Save / Bookmark */}
              <button
                type="button"
                onClick={handleSavePost}
                disabled={isSaving}
                className="col-span-1 sm:col-span-2 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-left transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900 text-xs">Save to Bookmarks</h5>
                    <p className="text-[11px] text-gray-500">Read or revisit later</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600">Save →</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleQuoteRepost} className="space-y-3">
              <textarea
                rows={3}
                placeholder="What are your thoughts on this post?..."
                value={quoteThoughts}
                onChange={(e) => setQuoteThoughts(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                autoFocus
              />

              {/* Mini Preview of original post */}
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/80 space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="font-semibold text-gray-900">{post.author.name}</span>
                  <span className="text-[10px] text-gray-400">• {post.createdAt}</span>
                </div>
                <p className="line-clamp-2">{post.content}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!quoteThoughts.trim() || isSharing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Publish Quote</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

