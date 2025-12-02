const API_BASE = 'https://matchmytunes.onrender.com';

// Get JWT token from sessionStorage
export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
};

// Check if Spotify is connected
export const isSpotifyConnected = (): boolean => {
  return sessionStorage.getItem('spotify_connected') === 'true' || 
         localStorage.getItem('spotify_connected') === 'true';
};

// Set Spotify connection status
export const setSpotifyConnected = (connected: boolean) => {
  sessionStorage.setItem('spotify_connected', connected.toString());
  localStorage.setItem('spotify_connected', connected.toString());
};

// Check if YouTube is connected
export const isYouTubeConnected = (): boolean => {
  return sessionStorage.getItem('youtube_connected') === 'true' || 
         localStorage.getItem('youtube_connected') === 'true';
};

// Set YouTube connection status
export const setYouTubeConnected = (connected: boolean) => {
  sessionStorage.setItem('youtube_connected', connected.toString());
  localStorage.setItem('youtube_connected', connected.toString());
};

// Disconnect Spotify - clears all Spotify-related data
export const disconnectSpotify = () => {
  sessionStorage.removeItem('spotify_connected');
  localStorage.removeItem('spotify_connected');
  // Note: We keep the JWT token as it might be used for other services
  // If you want to clear everything, also remove 'jwt'
  setSpotifyConnected(false);
};

// Disconnect YouTube - clears all YouTube-related data
export const disconnectYouTube = () => {
  sessionStorage.removeItem('youtube_connected');
  localStorage.removeItem('youtube_connected');
  setYouTubeConnected(false);
};

// Disconnect all services
export const disconnectAll = () => {
  disconnectSpotify();
  disconnectYouTube();
  sessionStorage.removeItem('jwt');
  localStorage.removeItem('jwt');
  sessionStorage.removeItem('userId');
  localStorage.removeItem('userId');
};

// Fetch with authentication
const fetchWithAuth = async (url: string): Promise<any> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login first.');
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, clear it
      sessionStorage.removeItem('jwt');
      localStorage.removeItem('jwt');
      throw new Error('Session expired. Please login again.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
};

// Handle OAuth callback - exchange code for token
// Note: The backend callback endpoint should redirect to the frontend with the code
// This function handles the code if it's in the URL
export const handleSpotifyCallback = async (code: string): Promise<void> => {
  try {
    // The backend callback endpoint processes the code and should redirect back
    // If we have a code, we need to let the backend handle it
    // The backend should redirect to: http://localhost:5173/auth/spotify/callback?code=...
    // Or in production: https://yourdomain.com/auth/spotify/callback?code=...
    
    // For now, we'll assume the backend has already processed it and set a cookie/token
    // Or we can call the backend to verify the code
    const response = await fetch(`${API_BASE}/api/auth/spotify/callback?code=${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies if backend uses them
    });

    // If the backend redirects, we won't get here
    // If it returns JSON, handle it
    if (response.ok) {
      try {
        const data = await response.json();
        // Store JWT token if provided
        if (data.token) {
          sessionStorage.setItem('jwt', data.token);
          localStorage.setItem('jwt', data.token);
        }
      } catch {
        // Response might not be JSON (could be a redirect)
        // That's okay, the backend should have handled it
      }
    }
    
    // Mark Spotify as connected (backend should have processed the auth)
    setSpotifyConnected(true);
  } catch (error: any) {
    console.error('Spotify callback error:', error);
    // Don't throw - the backend might have already processed it
    // Just mark as connected if we have a token
    const token = getAuthToken();
    if (token) {
      setSpotifyConnected(true);
    } else {
      throw error;
    }
  }
};

// Handle YouTube OAuth callback
export const handleYouTubeCallback = async (code: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/youtube/callback?code=${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to complete YouTube authentication');
    }

    const data = await response.json();
    
    // Store JWT token if provided
    if (data.token) {
      sessionStorage.setItem('jwt', data.token);
      localStorage.setItem('jwt', data.token);
    }
    
    // Mark YouTube as connected
    setYouTubeConnected(true);
  } catch (error: any) {
    console.error('YouTube callback error:', error);
    throw error;
  }
};

// Fetch user profile from backend
export const fetchUserProfile = async (): Promise<any> => {
  // The backend should return user info when fetching playlists
  // For now, we'll get it from the playlists endpoint response
  const playlists = await fetchPlaylists();
  return playlists.user || { display_name: 'User', images: [] };
};

// Fetch all playlists from backend
export const fetchPlaylists = async (): Promise<any> => {
  const data = await fetchWithAuth(`${API_BASE}/api/playlists/spotify`);
  return data;
};

// Fetch favorite songs count (from playlists response or separate call)
export const fetchFavoriteSongs = async (): Promise<number> => {
  // This might need to be calculated from saved tracks
  // For now, return 0 or get from backend if available
  try {
    const data = await fetchWithAuth(`${API_BASE}/api/playlists/spotify`);
    // If backend provides favorite songs count, use it
    return data.favoriteSongsCount || 0;
  } catch {
    return 0;
  }
};

// Fetch favorite albums count
export const fetchFavoriteAlbums = async (): Promise<number> => {
  try {
    const data = await fetchWithAuth(`${API_BASE}/api/playlists/spotify`);
    return data.favoriteAlbumsCount || 0;
  } catch {
    return 0;
  }
};

// Fetch favorite artists count
export const fetchFavoriteArtists = async (): Promise<number> => {
  try {
    const data = await fetchWithAuth(`${API_BASE}/api/playlists/spotify`);
    return data.favoriteArtistsCount || 0;
  } catch {
    return 0;
  }
};

// Fetch playlist tracks
export const fetchPlaylistTracks = async (playlistId: string): Promise<any> => {
  return fetchWithAuth(`${API_BASE}/api/playlists/spotify/${playlistId}/tracks`);
};
