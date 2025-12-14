import {
  authApi,
  playlistApi,
  getStoredToken,
  persistToken,
  removeStoredToken,
} from "./api.js";

const SPOTIFY_FLAG = "spotify_connected";
const YOUTUBE_FLAG = "youtube_connected";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const resolveStorage = (key) => {
  if (typeof window === "undefined") {
    return noopStorage;
  }
  try {
    return window[key] || noopStorage;
  } catch (error) {
    console.warn("Storage unavailable", error);
    return noopStorage;
  }
};

const ss = resolveStorage("sessionStorage");
const ls = resolveStorage("localStorage");

export const getAuthToken = () => getStoredToken();

export const isSpotifyConnected = () => {
  return ss.getItem(SPOTIFY_FLAG) === "true" || ls.getItem(SPOTIFY_FLAG) === "true";
};

export const setSpotifyConnected = (connected) => {
  const value = connected ? "true" : "false";
  ss.setItem(SPOTIFY_FLAG, value);
  ls.setItem(SPOTIFY_FLAG, value);
};

export const isYouTubeConnected = () => {
  return ss.getItem(YOUTUBE_FLAG) === "true" || ls.getItem(YOUTUBE_FLAG) === "true";
};

export const setYouTubeConnected = (connected) => {
  const value = connected ? "true" : "false";
  ss.setItem(YOUTUBE_FLAG, value);
  ls.setItem(YOUTUBE_FLAG, value);
};

export const disconnectSpotify = () => {
  ss.removeItem(SPOTIFY_FLAG);
  ls.removeItem(SPOTIFY_FLAG);
  setSpotifyConnected(false);
};

export const disconnectYouTube = () => {
  ss.removeItem(YOUTUBE_FLAG);
  ls.removeItem(YOUTUBE_FLAG);
  setYouTubeConnected(false);
};

export const disconnectAll = () => {
  disconnectSpotify();
  disconnectYouTube();
  removeStoredToken();
  ["userId"].forEach((key) => {
    ss.removeItem(key);
    ls.removeItem(key);
  });
};

export const handleSpotifyCallback = async (code) => {
  try {
    const data = await authApi.spotifyCallback(code);
    if (data?.token) {
      persistToken(data.token);
    }

    setSpotifyConnected(true);
  } catch (error) {
    console.error("Spotify callback error:", error);
    if (getAuthToken()) {
      setSpotifyConnected(true);
    } else {
      throw error;
    }
  }
};

export const handleYouTubeCallback = async (code) => {
  const data = await authApi.youtubeCallback(code);

  if (data.token) {
    persistToken(data.token);
  }

  setYouTubeConnected(true);
};

export const fetchUserProfile = async () => {
  const playlists = await fetchPlaylists();
  return playlists?.user || { display_name: "User", images: [] };
};

export const fetchPlaylists = async (provider = "spotify") => {
  if (provider === "spotify") {
    return playlistApi.getSpotifyPlaylists();
  }
  if (provider === "youtube") {
    return playlistApi.getYouTubePlaylists();
  }
  throw new Error(`Unsupported provider: ${provider}`);
};

export const fetchFavoriteSongs = async () => {
  try {
    const data = await playlistApi.getSpotifyPlaylists();
    return data?.favoriteSongsCount || 0;
  } catch (error) {
    console.warn("Favorite songs unavailable", error);
    return 0;
  }
};

export const fetchFavoriteAlbums = async () => {
  try {
    const data = await playlistApi.getSpotifyPlaylists();
    return data?.favoriteAlbumsCount || 0;
  } catch (error) {
    console.warn("Favorite albums unavailable", error);
    return 0;
  }
};

export const fetchFavoriteArtists = async () => {
  try {
    const data = await playlistApi.getSpotifyPlaylists();
    return data?.favoriteArtistsCount || 0;
  } catch (error) {
    console.warn("Favorite artists unavailable", error);
    return 0;
  }
};

export const fetchPlaylistTracks = async (playlistId, provider = "spotify") => {
  if (!playlistId) {
    throw new Error("Missing playlist identifier");
  }
  if (provider === "spotify") {
    return playlistApi.getSpotifyPlaylistTracks(playlistId);
  }
  if (provider === "youtube") {
    return playlistApi.getYouTubePlaylistTracks(playlistId);
  }
  throw new Error(`Unsupported provider: ${provider}`);
};
