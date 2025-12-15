import React, { useMemo, useState } from 'react';
import { SpotifyPlaylistItem } from './spotify-playlist-item';

export const PlaylistSection = (props) => {
  const {
    title = 'Playlists',
    playlists,
    searchPlaceholder = 'Search',
    showSearch = true,
  } = props || {};

  const [searchQuery, setSearchQuery] = useState('');

  const safePlaylists = useMemo(() => {
    if (!Array.isArray(playlists)) {
      return [];
    }

    return playlists.filter((item) => item && typeof item.id === 'string');
  }, [playlists]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredPlaylists = useMemo(() => {
    if (!normalizedQuery) {
      return safePlaylists;
    }

    return safePlaylists.filter((playlist) => {
      const name = typeof playlist.name === 'string' ? playlist.name : '';
      return name.toLowerCase().includes(normalizedQuery);
    });
  }, [normalizedQuery, safePlaylists]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showSearch && (
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          )}
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>

        {showSearch && (
          <div className="relative flex-1 max-w-xs ml-4">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {filteredPlaylists.length > 0 ? (
          filteredPlaylists.map((playlist) => (
            <SpotifyPlaylistItem
              key={playlist.id}
              id={playlist.id}
              name={playlist.name}
              image={playlist.image}
              trackCount={playlist.trackCount}
              type={playlist.type}
              icon={playlist.icon}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            {normalizedQuery ? 'No playlists found' : 'No playlists available'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistSection;