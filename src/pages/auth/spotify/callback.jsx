import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelectionStore } from "../../../store/selection.js";
import {
  handleSpotifyCallback,
  handleYouTubeCallback,
  fetchPlaylists,
  fetchFavoriteSongs,
  fetchFavoriteAlbums,
  fetchFavoriteArtists,
  fetchPlaylistTracks,
  isSpotifyConnected,
  isYouTubeConnected,
  setSpotifyConnected,
  setYouTubeConnected,
  getAuthToken,
  disconnectSpotify,
  disconnectYouTube,
} from "../../../lib/spotify.js";
import { PlaylistSection } from "../../../components/playlist-section.jsx";

const providerLabels = {
  spotify: "Spotify",
  youtube: "YouTube",
};

const fallbackProfiles = {
  spotify: { name: "Spotify User", avatar: "" },
  youtube: { name: "YouTube User", avatar: "" },
};

const extractArray = (data) => {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.items)) {
    return data.items;
  }
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  if (Array.isArray(data?.playlists)) {
    return data.playlists;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  return [];
};

const normalizePlaylists = (rawData, provider) => {
  const list = extractArray(rawData);
  return list
    .map((playlist) => {
      const raw = playlist?.playlist || playlist || {};
      const snippet = raw.snippet || playlist?.snippet || {};
      const contentDetails = raw.contentDetails || playlist?.contentDetails || {};
      const id =
        raw.id ||
        snippet.resourceId?.playlistId ||
        snippet.playlistId ||
        raw.playlistId ||
        raw.externalId ||
        raw.youtubePlaylistId ||
        raw._id;
      const name = raw.name || raw.title || raw.playlistName || snippet.title;
      if (!id || !name) {
        return null;
      }
      const thumbnails =
        (Array.isArray(raw.images) && raw.images) ||
        (Array.isArray(raw.thumbnails) && raw.thumbnails) ||
        (snippet.thumbnails && Object.values(snippet.thumbnails)) ||
        [];
      const firstImage =
        thumbnails[0]?.url ||
        thumbnails[0]?.urlDefault ||
        raw.thumbnail ||
        raw.image ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.default?.url;
      const totalTracks =
        raw?.tracks?.total ??
        raw?.trackCount ??
        raw?.tracksCount ??
        raw?.itemCount ??
        raw?.videoCount ??
        contentDetails.itemCount ??
        snippet.playlistItemCount ??
        0;

      return {
        id,
        name,
        image: firstImage || "",
        trackCount: Number.isFinite(totalTracks) ? totalTracks : 0,
        provider,
      };
    })
    .filter(Boolean);
};

const normalizeProfile = (rawData, provider) => {
  if (provider === "spotify") {
    const profile = rawData?.user || {};
    return {
      name: profile.display_name || profile.displayName || fallbackProfiles.spotify.name,
      avatar: profile.images?.[0]?.url || profile.avatarUrl || "",
    };
  }

  const profile = rawData?.profile || rawData?.channel || rawData?.user || {};
  return {
    name: profile.title || profile.name || profile.displayName || fallbackProfiles.youtube.name,
    avatar: profile.thumbnail || profile.avatarUrl || profile.thumbnails?.[0]?.url || "",
  };
};

const formatArtists = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }
  return value || "";
};

const normalizeTracks = (rawData, provider, playlistId) => {
  const rawList = extractArray(rawData?.tracks) || extractArray(rawData);
  return rawList
    .map((item, index) => {
      const trackPayload = item?.track || item || {};

      if (provider === "spotify") {
        const artists = Array.isArray(trackPayload?.artists)
          ? trackPayload.artists.map((artist) => artist?.name).filter(Boolean)
          : [];
        return {
          id: trackPayload.id || item.id || `${playlistId}-track-${index}`,
          title: trackPayload.name || trackPayload.title || "Untitled",
          artist: formatArtists(artists),
          album: trackPayload.album?.name || trackPayload.albumName || "",
          duration: trackPayload.duration_ms || trackPayload.durationMs || null,
        };
      }

      const snippet = trackPayload.snippet || {};
      const artists = formatArtists(
        trackPayload.artist ||
          trackPayload.channelTitle ||
          trackPayload.artists?.map((artist) => artist?.name) ||
          snippet.videoOwnerChannelTitle ||
          snippet.channelTitle
      );
      return {
        id:
          trackPayload.id ||
          trackPayload.videoId ||
          snippet.resourceId?.videoId ||
          `${playlistId}-track-${index}`,
        title: trackPayload.title || trackPayload.name || trackPayload.videoTitle || snippet.title || "Untitled",
        artist: artists,
        album: trackPayload.album || trackPayload.playlistTitle || snippet.album || "",
        duration: trackPayload.durationMs || trackPayload.duration_ms || trackPayload.lengthSeconds || null,
      };
    })
    .filter((track) => track?.title);
};

const SpotifyCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sourceService, setSourceService, selectedPlaylists } = useSelectionStore();
  const rawSourceParam = (searchParams.get("source") || "").toLowerCase();
  const normalizedSourceFromParam = rawSourceParam.includes("youtube")
    ? "youtube"
    : rawSourceParam.includes("spotify")
    ? "spotify"
    : "";
  const effectiveSourceService = sourceService || normalizedSourceFromParam;
  const sourceProvider = effectiveSourceService?.includes("youtube")
    ? "youtube"
    : effectiveSourceService?.includes("spotify")
    ? "spotify"
    : "";
  const providerLabel = providerLabels[sourceProvider] || "Spotify";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(
    fallbackProfiles[sourceProvider] || fallbackProfiles.spotify
  );
  const [playlists, setPlaylists] = useState([]);
  const [favoriteCounts, setFavoriteCounts] = useState({ songs: 0, albums: 0, artists: 0 });

  useEffect(() => {
    if (normalizedSourceFromParam && normalizedSourceFromParam !== sourceService) {
      setSourceService(normalizedSourceFromParam);
    }
  }, [normalizedSourceFromParam, setSourceService, sourceService]);

  useEffect(() => {
    if (!sourceProvider) {
      toast.error("Select a source service first.");
      navigate("/");
    }
  }, [navigate, sourceProvider]);

  useEffect(() => {
    setProfile(fallbackProfiles[sourceProvider] || fallbackProfiles.spotify);
  }, [sourceProvider]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (!sourceProvider) {
          return;
        }

        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (code) {
          if (sourceProvider === "youtube" || state === "youtube") {
            await handleYouTubeCallback(code);
            setYouTubeConnected(true);
          } else {
            await handleSpotifyCallback(code);
            setSpotifyConnected(true);
          }
          window.history.replaceState({}, "", window.location.pathname);
        }

        const token = getAuthToken();

        if (sourceProvider === "spotify") {
          if (!isSpotifyConnected() && !token) {
            toast.error("Connect Spotify to continue.");
            navigate("/");
            return;
          }
          if (token && !isSpotifyConnected()) {
            setSpotifyConnected(true);
          }
        } else {
          if (!isYouTubeConnected() && !token) {
            toast.error("Connect YouTube to continue.");
            setSourceService(null);
            navigate("/");
            return;
          }
          if (token && !isYouTubeConnected()) {
            setYouTubeConnected(true);
          }
        }

        const data = await fetchPlaylists(sourceProvider);
        const normalizedPlaylists = normalizePlaylists(data, sourceProvider);
        setPlaylists(normalizedPlaylists);
        setProfile(normalizeProfile(data, sourceProvider));

        if (sourceProvider === "spotify") {
          try {
            const [songsCount, albumsCount, artistsCount] = await Promise.all([
              fetchFavoriteSongs(),
              fetchFavoriteAlbums(),
              fetchFavoriteArtists(),
            ]);
            setFavoriteCounts({ songs: songsCount, albums: albumsCount, artists: artistsCount });
          } catch (error) {
            console.warn("Could not fetch Spotify favorites", error);
          }
        } else {
          setFavoriteCounts({ songs: 0, albums: 0, artists: 0 });
        }
      } catch (error) {
        console.error(`Failed to load ${providerLabel} data`, error);
        toast.error(error?.message || `Failed to load ${providerLabel} data`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, searchParams, sourceProvider, providerLabel, setSourceService]);

  const playlistItems = useMemo(() => {
    return playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      image: playlist.image,
      trackCount: playlist.trackCount,
      provider: playlist.provider,
    }));
  }, [playlists]);

  const fetchTracksForPlaylist = useCallback(
    async (playlistId) => {
      const response = await fetchPlaylistTracks(playlistId, sourceProvider);
      return normalizeTracks(response, sourceProvider, playlistId);
    },
    [sourceProvider]
  );

  const handleContinue = () => {
    if (!selectedPlaylists.length) {
      toast.error("Select at least one playlist to continue.");
      return;
    }
    navigate("/transfer/setup");
  };

  const handleDisconnect = () => {
    const confirmed = window.confirm(`Disconnect ${providerLabel}? You will need to reconnect to continue.`);
    if (!confirmed) {
      return;
    }

    if (sourceProvider === "spotify") {
      disconnectSpotify();
      setSourceService(null);
    } else {
      disconnectYouTube();
      setSourceService(null);
    }
    toast.success(`${providerLabel} disconnected.`);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050B2C] via-[#1c1f54] to-[#040720]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your {providerLabel} library...</p>
        </div>
      </div>
    );
  }

  const initials = profile.name?.charAt(0)?.toUpperCase?.() || providerLabel?.charAt(0) || "U";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B2C] via-[#1c1f54] to-[#040720] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">Your {providerLabel} Playlists</h1>
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Disconnect
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                {initials}
              </div>
            )}
            <span className="text-white font-medium">{profile.name}</span>
            <div className="ml-auto px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 text-sm">
              {providerLabel} connected
            </div>
          </div>
        </div>

        <div className="sticky top-6 z-30 flex justify-end mb-6">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedPlaylists.length}
            className={`px-6 py-3 rounded-full font-semibold transition-all shadow ${
              selectedPlaylists.length
                ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/40"
                : "bg-gray-600 text-gray-300 cursor-not-allowed opacity-70"
            }`}
          >
            Continue ({selectedPlaylists.length} selected)
          </button>
        </div>

        <div className={`grid gap-6 ${sourceProvider === "spotify" ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}>
          {sourceProvider === "spotify" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.299.181-.539.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-white">Your Spotify favorites</h2>
                </div>

                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center justify-between">
                    <span>Liked songs</span>
                    <span>{favoriteCounts.songs}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Saved albums</span>
                    <span>{favoriteCounts.albums}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Followed artists</span>
                    <span>{favoriteCounts.artists}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className={`${sourceProvider === "spotify" ? "lg:col-span-2" : "lg:col-span-1"}`}>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
              <PlaylistSection
                title={`Playlists (${playlistItems.length})`}
                playlists={playlistItems}
                onFetchTracks={fetchTracksForPlaylist}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyCallback;
