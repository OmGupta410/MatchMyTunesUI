import React from 'react';
import { useSelectionStore } from '../store/selection';

interface SpotifyPlaylistItemProps {
  id: string;
  name: string;
  image?: string;
  trackCount: number;
  type?: 'playlist' | 'favorite-songs' | 'favorite-albums' | 'favorite-artists';
  icon?: React.ReactNode;
}

export const SpotifyPlaylistItem: React.FC<SpotifyPlaylistItemProps> = ({
  id,
  name,
  image,
  trackCount,
  type = 'playlist',
  icon,
}) => {
  const { isSelected, togglePlaylist } = useSelectionStore();
  const selected = isSelected(id);

  const handleToggle = () => {
    togglePlaylist({
      id,
      name,
      image,
      trackCount,
      type,
    });
  };

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
      onClick={handleToggle}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={handleToggle}
        onClick={(e) => e.stopPropagation()}
        className="w-5 h-5 rounded border-gray-600 bg-transparent text-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer accent-green-500"
      />

      {/* Image or Icon */}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : icon ? (
          <div className="text-white text-2xl">{icon}</div>
        ) : (
          <div className="text-white text-xl font-bold">{name.charAt(0).toUpperCase()}</div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium text-sm truncate">{name}</h3>
        <p className="text-gray-400 text-xs mt-1">
          {selected ? `${trackCount}/${trackCount} selected` : `0/${trackCount} selected`}
        </p>
      </div>

      {/* Arrow Icon */}
      <svg
        className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
};

