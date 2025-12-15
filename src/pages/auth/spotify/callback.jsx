import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelectionStore } from '../../../store/selection';
import {
  handleSpotifyCallback,
  fetchPlaylists,
  fetchFavoriteSongs,
  fetchFavoriteAlbums,
  fetchFavoriteArtists,
  isSpotifyConnected,
  isYouTubeConnected,
  setSpotifyConnected,
  getAuthToken,
  disconnectSpotify,
} from '../../../lib/spotify';
import { SpotifyPlaylistItem } from '../../../components/spotify-playlist-item';
import { PlaylistSection } from '../../../components/playlist-section';
import toast from 'react-hot-toast';

const SpotifyCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedPlaylists, sourceService, setSourceService } = useSelectionStore();
  const normalizeSource = (value) => {
    if (!value) {
      return 'spotify';
    }

    const normalized = String(value).trim().toLowerCase();
    return normalized === 'youtube' || normalized === 'youtube-music' ? 'youtube' : 'spotify';
  };

  const getStoredSource = () => {
    try {
      return sessionStorage.getItem('selected_source');
    } catch (error) {
      return null;
    }
  };

  const initialSource = normalizeSource(
    searchParams.get('source') ||
      searchParams.get('provider') ||
      sourceService ||
      getStoredSource() ||
      'spotify'
  );

  const [activeSource, setActiveSource] = useState(initialSource);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [favoriteSongsCount, setFavoriteSongsCount] = useState(0);
  const [favoriteAlbumsCount, setFavoriteAlbumsCount] = useState(0);
  const [favoriteArtistsCount, setFavoriteArtistsCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const querySource = searchParams.get('source') || searchParams.get('provider');
    if (!querySource) {
      return;
    }

    const normalized = String(querySource).trim().toLowerCase() === 'youtube' ? 'youtube' : 'spotify';
    if (normalized !== activeSource) {
      setActiveSource(normalized);
    }
  }, [searchParams, activeSource]);

  useEffect(() => {
    setSourceService(activeSource);
    sessionStorage.setItem('selected_source', activeSource);
  }, [activeSource, setSourceService]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (activeSource === 'spotify') {
          const code = searchParams.get('code');

          if (code) {
            try {
              await handleSpotifyCallback(code);
              window.history.replaceState({}, '', window.location.pathname);
            } catch (error) {
              console.warn('Callback handling error:', error);
            }
          }

          const token = getAuthToken();
          if (!isSpotifyConnected() && !token) {
            toast.error('Please login with Spotify first');
            navigate('/');
            return;
          }

          if (token && !isSpotifyConnected()) {
            setSpotifyConnected(true);
          }
        } else if (activeSource === 'youtube') {
          if (!isYouTubeConnected()) {
            toast.error('Please connect your YouTube account first');
            navigate('/');
            return;
          }
        }

        // Playlists previously failed to load because we always called the Spotify endpoint.
        // Fetching with the selected source keeps the API call aligned with the authenticated platform.
        const playlistsData = await fetchPlaylists(activeSource);

        if (!isMounted) {
          return;
        }

        const collection = Array.isArray(playlistsData)
          ? playlistsData
          : Array.isArray(playlistsData?.playlists)
          ? playlistsData.playlists
          : Array.isArray(playlistsData?.items)
          ? playlistsData.items
          : Array.isArray(playlistsData?.data)
          ? playlistsData.data
          : [];

        const normalizedPlaylists = collection
          .map((playlist) => {
            if (!playlist) {
              return null;
            }

            const rawId =
              playlist.id ??
              playlist.playlistId ??
              playlist.youtubeId ??
              playlist.externalId ??
              null;

            if (rawId == null) {
              return null;
            }

            const id = String(rawId).trim();
            if (!id) {
              return null;
            }

            const nameCandidate =
              (typeof playlist.name === 'string' && playlist.name.trim()) ||
              (typeof playlist.title === 'string' && playlist.title.trim()) ||
              null;

            const imageUrl =
              (Array.isArray(playlist.images) && playlist.images[0] && playlist.images[0].url) ||
              (Array.isArray(playlist.thumbnails) &&
                playlist.thumbnails[0] &&
                (playlist.thumbnails[0].url || playlist.thumbnails[0].src)) ||
              (typeof playlist.thumbnail === 'string' ? playlist.thumbnail : null) ||
              (typeof playlist.image === 'string' ? playlist.image : null) ||
              null;

            const trackTotals = [
              playlist?.tracks?.total,
              playlist?.trackCount,
              playlist?.tracksCount,
              playlist?.itemCount,
              playlist?.videoCount,
            ].map((value) => {
              if (typeof value === 'number') {
                return Number.isFinite(value) ? value : null;
              }

              const parsed = Number(value);
              return Number.isFinite(parsed) ? parsed : null;
            });

            const totalTracks = trackTotals.find((value) => value !== null) ?? 0;

            return {
              id,
              name: nameCandidate || 'Untitled playlist',
              image: imageUrl || undefined,
              trackCount: Number.isFinite(totalTracks) ? totalTracks : 0,
              type: typeof playlist.type === 'string' ? playlist.type : 'playlist',
            };
          })
          .filter(Boolean);

        setPlaylists(normalizedPlaylists);

        const resolvedUser =
          (playlistsData && (playlistsData.user || playlistsData.profile || playlistsData.channel)) ||
          null;

        if (resolvedUser) {
          setUser(resolvedUser);
        } else {
          setUser(
            activeSource === 'youtube'
              ? { display_name: 'YouTube User', thumbnails: [] }
              : { display_name: 'Spotify User', images: [] }
          );
        }

        if (activeSource === 'spotify') {
          try {
            const [songsCount, albumsCount, artistsCount] = await Promise.all([
              fetchFavoriteSongs(),
              fetchFavoriteAlbums(),
              fetchFavoriteArtists(),
            ]);

            if (isMounted) {
              setFavoriteSongsCount(Number.isFinite(songsCount) ? songsCount : 0);
              setFavoriteAlbumsCount(Number.isFinite(albumsCount) ? albumsCount : 0);
              setFavoriteArtistsCount(Number.isFinite(artistsCount) ? artistsCount : 0);
            }
          } catch (error) {
            console.warn('Could not fetch favorite counts:', error);
          }

          setSpotifyConnected(true);
        } else if (isMounted) {
          setFavoriteSongsCount(0);
          setFavoriteAlbumsCount(0);
          setFavoriteArtistsCount(0);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error('Error loading playlists:', error);
        const message = error && error.message ? error.message : 'Failed to load playlists';
        setError(message);
        toast.error(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeSource, navigate, searchParams]);

  const handleDisconnect = () => {
    if (activeSource !== 'spotify') {
      toast.error('Disconnect is currently available for Spotify accounts from this screen.');
      return;
    }

    const shouldDisconnect = window.confirm(
      'Are you sure you want to disconnect your Spotify account? You will need to reconnect to continue.'
    );

    if (!shouldDisconnect) {
      return;
    }

    disconnectSpotify();
    toast.success('Spotify disconnected successfully');
    navigate('/');
  };

  const handleContinue = () => {
    const selectedCount = Array.isArray(selectedPlaylists) ? selectedPlaylists.length : 0;
    if (selectedCount === 0) {
      toast.error('Please select at least one playlist to continue');
      return;
    }

    const savedDestination = sessionStorage.getItem('selected_destination');
    if (savedDestination) {
      sessionStorage.removeItem('selected_destination');
    }

    navigate('/transfer/setup');
  };

  const sourceDisplayName = activeSource === 'youtube' ? 'YouTube' : 'Spotify';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050B2C] via-[#1c1f54] to-[#040720]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your {sourceDisplayName} data...</p>
        </div>
      </div>
    );
  }

  const displayName =
    (typeof user?.display_name === 'string' && user.display_name.trim()) ||
    (typeof user?.name === 'string' && user.name.trim()) ||
    `${sourceDisplayName} User`;

  const profileImage =
    (Array.isArray(user?.images) && user.images[0] && user.images[0].url) ||
    (Array.isArray(user?.thumbnails) && user.thumbnails[0] && user.thumbnails[0].url) ||
    (typeof user?.image === 'string' ? user.image : null) ||
    (typeof user?.picture === 'string' ? user.picture : null) ||
    (typeof user?.photoUrl === 'string' ? user.photoUrl : null) ||
    null;
  const selectedCount = Array.isArray(selectedPlaylists) ? selectedPlaylists.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B2C] via-[#1c1f54] to-[#040720] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">From Your {sourceDisplayName} Account</h1>
            {activeSource === 'spotify' && (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-colors flex items-center gap-2"
                type="button"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Disconnect
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {user && (
            <div className="flex items-center gap-3 mt-4">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={displayName}
                  className="w-10 h-10 rounded-full"
                  loading="lazy"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-white font-medium">{displayName}</span>
              <div className="ml-auto px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center gap-2">
                <span className="text-purple-300 text-sm">{displayName}</span>
                <svg
                  className="w-4 h-4 text-purple-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {activeSource === 'spotify' ? (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.299.181-.539.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-white">My Spotify Music Library</h2>
                </div>

                <div className="space-y-2">
                  <SpotifyPlaylistItem
                    id="favorite-songs"
                    name="Favorite Songs"
                    trackCount={favoriteSongsCount}
                    type="favorite-songs"
                    icon={
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    }
                  />

                  <SpotifyPlaylistItem
                    id="favorite-albums"
                    name="Favorite Albums"
                    trackCount={favoriteAlbumsCount}
                    type="favorite-albums"
                    icon={
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    }
                  />

                  <SpotifyPlaylistItem
                    id="favorite-artists"
                    name="Favorite Artists"
                    trackCount={favoriteArtistsCount}
                    type="favorite-artists"
                    icon={
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 text-sm text-gray-300">
                Browse your YouTube playlists below to pick the ones you want to transfer.
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
              <PlaylistSection
                title={`${sourceDisplayName} Playlists (${playlists.length})`}
                playlists={playlists}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={selectedCount === 0}
            className={`
              px-8 py-3 rounded-full font-semibold text-white transition-all
              ${selectedCount > 0
                ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/50'
                : 'bg-gray-600 cursor-not-allowed opacity-50'}
            `}
            type="button"
          >
            Continue ({selectedCount} selected)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpotifyCallback;
