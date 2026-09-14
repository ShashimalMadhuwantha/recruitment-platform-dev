import React, { useState } from 'react';
import { Play, Image as ImageIcon } from 'lucide-react';
import type { PublicCompanyCultureMedia } from '../types';
import { MediaLightboxModal } from './MediaLightboxModal';

interface CompanyCultureGalleryProps {
  media: PublicCompanyCultureMedia[];
  companyName: string;
}

export const CompanyCultureGallery: React.FC<CompanyCultureGalleryProps> = ({
  media,
  companyName,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border-default p-8 text-center text-text-secondary space-y-2">
        <ImageIcon className="w-8 h-8 text-text-muted mx-auto" />
        <p className="text-sm font-semibold text-text-primary">Life at {companyName}</p>
        <p className="text-xs text-text-muted max-w-sm mx-auto">
          This employer hasn't uploaded culture media yet. Explore their open roles below.
        </p>
      </div>
    );
  }

  const handleOpenLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-brand-900 tracking-tight flex items-center gap-2">
          <span>Life & Culture at {companyName}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
            {media.length} {media.length === 1 ? 'photo' : 'photos & clips'}
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {media.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => handleOpenLightbox(idx)}
            className="group relative h-44 rounded-xl overflow-hidden cursor-pointer border border-border-default bg-surface-muted shadow-sm hover:shadow-md transition-all duration-300"
          >
            {item.type === 'VIDEO' ? (
              <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                <video
                  src={item.url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/90 text-brand-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-brand-900" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                alt={item.caption || `${companyName} culture moment`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}

            {/* Gradient overlay & caption */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              {item.caption && (
                <p className="text-xs font-medium text-white line-clamp-2 leading-tight">
                  {item.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <MediaLightboxModal
        mediaList={media}
        initialIndex={selectedIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};
