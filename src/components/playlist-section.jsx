import { useMemo, useState } from "react";
import { SpotifyPlaylistItem } from "./spotify-playlist-item.jsx";

/**
 * @typedef {Object} Playlist
 * @property {string} id
 * @property {string} name
 * @property {string} [image]
 * @property {number} trackCount
 * @property {import("react").ReactNode} [icon]
 */

/**
 * @typedef {Object} PlaylistSectionProps
 * @property {string} title
 * @property {Playlist[]} playlists
 * @property {string} [searchPlaceholder]
 * @property {boolean} [showSearch]
 * @property {(playlistId: string) => Promise<Array<{id:string,title:string,artist?:string,album?:string,thumbnail?:string}>>} [onFetchTracks]
 */

/**
 * Renders a searchable playlist section.
 * @param {PlaylistSectionProps} props
 */
const PlaylistSection = ({
  title,
  playlists,
  searchPlaceholder = "Search",
  showSearch = true,
  onFetchTracks,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPlaylistId, setExpandedPlaylistId] = useState("");
  const [trackCache, setTrackCache] = useState({});
  const [loadingPlaylistId, setLoadingPlaylistId] = useState("");
  const [trackErrors, setTrackErrors] = useState({});

  const filteredPlaylists = useMemo(() => {
    if (!Array.isArray(playlists)) {
      return [];
    }
    const normalizedQuery = searchQuery.toLowerCase().trim();
    if (!normalizedQuery) {
      return playlists;
    }
    return playlists.filter((playlist) =>
      playlist?.name?.toLowerCase?.().includes(normalizedQuery)
    );
  }, [playlists, searchQuery]);

  const handleExpand = async (playlistId) => {
    if (!playlistId) {
      return;
    }

    if (expandedPlaylistId === playlistId) {
      setExpandedPlaylistId("");
      return;
    }

    if (!onFetchTracks) {
      setExpandedPlaylistId(playlistId);
      return;
    }

    if (Array.isArray(trackCache[playlistId])) {
      setExpandedPlaylistId(playlistId);
      return;
    }

    setLoadingPlaylistId(playlistId);
    try {
      const tracks = await onFetchTracks(playlistId);
      if (!Array.isArray(tracks)) {
        throw new Error("No tracks available for this playlist.");
      }
      setTrackCache((prev) => ({ ...prev, [playlistId]: tracks }));
      setTrackErrors((prev) => ({ ...prev, [playlistId]: "" }));
      setExpandedPlaylistId(playlistId);
    } catch (error) {
      setTrackErrors((prev) => ({ ...prev, [playlistId]: error?.message || "Failed to load tracks" }));
    } finally {
      setLoadingPlaylistId("");
    }
  };

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
            <div key={playlist.id} className="space-y-2">
              <SpotifyPlaylistItem
                id={playlist.id}
                name={playlist.name}
                image={playlist.image}
                trackCount={playlist.trackCount}
                type={playlist.type}
                icon={playlist.icon}
                provider={playlist.provider}
                onExpand={() => handleExpand(playlist.id)}
                isExpanded={expandedPlaylistId === playlist.id}
                loadingTracks={loadingPlaylistId === playlist.id}
              />
              {expandedPlaylistId === playlist.id && (
                <div className="ml-14 mr-4 bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-gray-300">
                  {trackErrors[playlist.id] ? (
                    <p className="text-red-300">{trackErrors[playlist.id]}</p>
                  ) : trackCache[playlist.id]?.length ? (
                    <ul className="space-y-2">
                      {trackCache[playlist.id].map((track) => (
                        <li key={track.id || `${playlist.id}-${track.title}`}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-100">{track.title}</p>
                            <p className="text-xs text-gray-400">
                              {[track.artist, track.album].filter(Boolean).join(" • ") || "Unknown artist"}
                            </p>
                          </div>
                          {track.duration ? (
                            <span className="text-xs text-gray-500">
                              {Math.floor(track.duration / 60000)}:{`${Math.floor((track.duration % 60000) / 1000)}`.padStart(2, "0")}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400">No tracks found for this playlist.</p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            {searchQuery ? "No playlists found" : "No playlists available"}
          </div>
        )}
      </div>
    </div>
  );
};

export { PlaylistSection };
