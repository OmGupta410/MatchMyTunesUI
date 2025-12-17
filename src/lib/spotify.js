const API_BASE = 'https://matchmytunes.onrender.com';

const toBooleanString = (value) => (value ? 'true' : 'false');

const normalizeProvider = (provider) => {
  if (!provider) {
    return 'spotify';
  }

  const normalized = String(provider).trim().toLowerCase();

  if (normalized === 'youtube' || normalized === 'youtube-music') {
    return 'youtube';
  }

  return 'spotify';
};

export const getAuthToken = () => {
  return sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
};

export const isSpotifyConnected = () => {
  return (
    sessionStorage.getItem('spotify_connected') === 'true' ||
    localStorage.getItem('spotify_connected') === 'true'
  );
};

export const setSpotifyConnected = (connected) => {
  const value = toBooleanString(Boolean(connected));
  sessionStorage.setItem('spotify_connected', value);
  localStorage.setItem('spotify_connected', value);
};

export const isYouTubeConnected = () => {
  return (
    sessionStorage.getItem('youtube_connected') === 'true' ||
    localStorage.getItem('youtube_connected') === 'true'
  );
};

export const setYouTubeConnected = (connected) => {
  const value = toBooleanString(Boolean(connected));
  sessionStorage.setItem('youtube_connected', value);
  localStorage.setItem('youtube_connected', value);
};

export const disconnectSpotify = () => {
  sessionStorage.removeItem('spotify_connected');
  localStorage.removeItem('spotify_connected');
  setSpotifyConnected(false);
};

export const disconnectYouTube = () => {
  sessionStorage.removeItem('youtube_connected');
  localStorage.removeItem('youtube_connected');
  setYouTubeConnected(false);
};

export const disconnectAll = () => {
  disconnectSpotify();
  disconnectYouTube();
  sessionStorage.removeItem('jwt');
  localStorage.removeItem('jwt');
  sessionStorage.removeItem('userId');
  localStorage.removeItem('userId');
};

const fetchWithAuth = async (url) => {
  if (!url || typeof url !== 'string') {
    throw new Error('A valid URL is required.');
  }

  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login first.');
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem('jwt');
      localStorage.removeItem('jwt');
      throw new Error('Session expired. Please login again.');
    }

    const errorData = await response.json().catch(() => ({}));
    const message = typeof errorData.message === 'string' ? errorData.message : null;
    throw new Error(message || `API error: ${response.status}`);
  }

  return response.json();
};

export const handleSpotifyCallback = async (code) => {
  if (!code) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/spotify/callback?code=${encodeURIComponent(code)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (response.ok) {
      try {
        const data = await response.json();
        if (data && typeof data.token === 'string') {
          sessionStorage.setItem('jwt', data.token);
          localStorage.setItem('jwt', data.token);
        }
      } catch (error) {
        console.warn('Spotify callback JSON parse skipped:', error);
      }
    }

    setSpotifyConnected(true);
  } catch (error) {
    console.error('Spotify callback error:', error);
    const token = getAuthToken();
    if (token) {
      setSpotifyConnected(true);
    } else {
      throw error;
    }
  }
};

export const handleYouTubeCallback = async (code) => {
  if (!code) {
    throw new Error('Missing YouTube authorization code.');
  }

  const response = await fetch(`${API_BASE}/api/auth/youtube/callback?code=${encodeURIComponent(code)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to complete YouTube authentication');
  }

  const data = await response.json().catch(() => ({}));

  if (data && typeof data.token === 'string') {
    sessionStorage.setItem('jwt', data.token);
    localStorage.setItem('jwt', data.token);
  }

  setYouTubeConnected(true);
};

export const fetchUserProfile = async () => {
  const playlists = await fetchPlaylists('spotify');
  if (playlists && typeof playlists === 'object' && playlists.user) {
    return playlists.user;
  }
  return { display_name: 'User', images: [] };
};

export const fetchPlaylists = async (provider = 'spotify') => {
  const normalizedProvider = normalizeProvider(provider);
  return fetchWithAuth(`${API_BASE}/api/playlists/${normalizedProvider}`);
};

export const fetchFavoriteSongs = async () => {
  try {
    const data = await fetchWithAuth(`${API_BASE}/api/playlists/spotify`);
    return Number.isFinite(data.favoriteSongsCount) ? data.favoriteSongsCount : 0;
  } catch (error) {
    console.warn('Favorite songs count fallback:', error);
    return 0;
  }
};

export const fetchFavoriteAlbums = async () => {
  try {
    const data = await fetchWithAuth(`${API_BASE}/api/playlists/spotify`);
    return Number.isFinite(data.favoriteAlbumsCount) ? data.favoriteAlbumsCount : 0;
  } catch (error) {
    console.warn('Favorite albums count fallback:', error);
    return 0;
  }
};

export const fetchFavoriteArtists = async () => {
  try {
    const data = await fetchWithAuth(`${API_BASE}/api/playlists/spotify`);
    return Number.isFinite(data.favoriteArtistsCount) ? data.favoriteArtistsCount : 0;
  } catch (error) {
    console.warn('Favorite artists count fallback:', error);
    return 0;
  }
};

export const fetchPlaylistTracks = async (playlistId) => {
  if (!playlistId) {
    throw new Error('A playlist ID is required to fetch tracks.');
  }

  return fetchWithAuth(`${API_BASE}/api/playlists/spotify/${playlistId}/tracks`);
};