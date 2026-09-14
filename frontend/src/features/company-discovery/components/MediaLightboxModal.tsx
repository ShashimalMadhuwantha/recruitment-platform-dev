import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PublicCompanyCultureMedia } from '../types';

interface MediaLightboxModalProps {
  mediaList: PublicCompanyCultureMedia[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  mediaList,
  initialIndex,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mediaList.length, onClose]);

  if (!isOpen || mediaList.length === 0) return null;

  const currentMedia = mediaList[currentIndex] || mediaList[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
        title="Close (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-6 text-sm font-medium text-white/75 z-50">
        {currentIndex + 1} / {mediaList.length}
      </div>

      {/* Prev button */}
      {mediaList.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110 z-50"
          title="Previous (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Media container */}
      <div
        className="max-w-5xl max-h-[85vh] w-full flex flex-col items-center justify-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {currentMedia.type === 'VIDEO' ? (
          <video
            src={currentMedia.url}
            controls
            autoPlay
            className="max-h-[75vh] w-auto max-w-full rounded-xl shadow-2xl object-contain"
          />
        ) : (
          <img
            src={currentMedia.url}
            alt={currentMedia.caption || 'Company culture media'}
            className="max-h-[75vh] w-auto max-w-full rounded-xl shadow-2xl object-contain"
          />
        )}

        {/* Caption */}
        {currentMedia.caption && (
          <div className="mt-4 px-6 py-2 rounded-full bg-black/60 border border-white/10 text-center text-sm text-white/90 max-w-2xl">
            {currentMedia.caption}
          </div>
        )}
      </div>

      {/* Next button */}
      {mediaList.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110 z-50"
          title="Next (Right Arrow)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
