import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelectionStore } from '../../store/selection';
import { ServiceCard } from '../../components/service-card';
import {
  getAuthToken,
  isYouTubeConnected,
  handleYouTubeCallback,
  disconnectSpotify,
  disconnectYouTube,
  isSpotifyConnected,
  setYouTubeConnected
} from '../../lib/spotify';
import toast from 'react-hot-toast';

const TransferSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    selectedPlaylists,
    destinationService,
    setDestinationService,
  } = useSelectionStore();

  const playlistsSelection = useMemo(
    () => (Array.isArray(selectedPlaylists) ? selectedPlaylists : []),
    [selectedPlaylists]
  );

  const [fromService, setFromService] = useState('spotify');
  const [toService, setToService] = useState(destinationService || null);
  const [transferring, setTransferring] = useState(false);
  
  // Local state to force re-render on connection status change
  const [youtubeConnectedState, setYoutubeConnectedState] = useState(isYouTubeConnected()); 
  const [spotifyConnectedState, setSpotifyConnectedState] = useState(isSpotifyConnected());

  // =========================
  // AUTHENTICATION LOGIC (POPUP)
  // =========================
  const handleLogin = (provider) => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const apiBaseUrl = "https://matchmytunes.onrender.com"; 
    const url = `${apiBaseUrl}/api/auth/${provider.toLowerCase()}/login`;

    window.open(
      url,
      "MatchMyTunesLogin",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  // Listen for the success message from the popup
  useEffect(() => {
    const messageHandler = (event) => {
      if (event.data.type === "AUTH_SUCCESS") {
        const { token, userId, provider } = event.data;
        
        console.log(`Login successful with ${provider}!`);
        
        if (token) localStorage.setItem("jwt", token);
        if (userId) localStorage.setItem("userId", userId);

        if (provider === "Spotify") {
             setSpotifyConnectedState(true);
             toast.success('Spotify connected successfully!');
        }
        if (provider === "YouTube") {
             if (typeof setYouTubeConnected === 'function') setYouTubeConnected(true); 
             setYoutubeConnectedState(true);
             toast.success('YouTube connected successfully!');
             
             // If user was trying to select YouTube, set it now
             if (!toService || toService === 'youtube' || toService === 'youtube-music') {
                 setToService('youtube'); 
             }
        }
      }
    };

    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, [toService]);

  useEffect(() => {
    const savedToService = sessionStorage.getItem('selected_destination');
    if (savedToService && !toService) {
      setToService(savedToService);
      setDestinationService(savedToService);
    }
  }, [setDestinationService, toService]);

  useEffect(() => {
    if (playlistsSelection.length === 0) {
      toast.error('No playlists selected. Redirecting...');
      navigate('/auth/spotify/callback');
    }
  }, [navigate, playlistsSelection]);

  useEffect(() => {
    if (toService) {
      setDestinationService(toService);
    }
  }, [setDestinationService, toService]);

  const services = useMemo(
    () => [
      {
        id: 'spotify',
        name: 'Spotify',
        connected: spotifyConnectedState,
        icon: (
          <svg className="w-10 h-10" fill="#1DB954" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.299.181-.539.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        ),
      },
      {
        id: 'youtube-music',
        name: 'YouTube Music',
        connected: youtubeConnectedState,
        icon: (
          <svg className="w-10 h-10" fill="#FF0000" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        ),
      },
      {
        id: 'youtube',
        name: 'YouTube',
        connected: youtubeConnectedState,
        icon: (
          <svg className="w-10 h-10" fill="#FF0000" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        ),
      },
      {
        id: 'amazon-music',
        name: 'Amazon Music',
        connected: false,
        icon: (
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">
            AM
          </div>
        ),
      },
    ],
    [spotifyConnectedState, youtubeConnectedState]
  );

  const handleServiceSelect = (serviceId) => {
    if (!serviceId) {
      return;
    }

    if (serviceId === 'spotify') {
      if (!isSpotifyConnected()) {
           handleLogin("Spotify");
           return;
      }
      setFromService('spotify');
      return;
    }

    if ((serviceId === 'youtube' || serviceId === 'youtube-music')) {
        if(!isYouTubeConnected()) {
           handleLogin("YouTube");
           return;
        }
    }

    setToService(serviceId);
  };

  const handleDisconnectSpotify = () => {
    if (window.confirm('Are you sure you want to disconnect your Spotify account?')) {
      disconnectSpotify();
      setSpotifyConnectedState(false);
      toast.success('Spotify disconnected successfully');
      navigate('/');
    }
  };

  const handleDisconnectYouTube = () => {
    if (window.confirm('Are you sure you want to disconnect your YouTube account?')) {
      disconnectYouTube();
      setYoutubeConnectedState(false);
      toast.success('YouTube disconnected successfully');
    }
  };

  const handleReconnectSpotify = () => handleLogin("Spotify");
  const handleReconnectYouTube = () => handleLogin("YouTube");

  const handleLaunchTransfer = async () => {
    if (!toService) {
      toast.error('Please select a destination service');
      return;
    }

    if (playlistsSelection.length === 0) {
      toast.error('No playlists selected');
      return;
    }

    if ((toService === 'youtube' || toService === 'youtube-music') && !isYouTubeConnected()) {
      toast.error('Please connect your YouTube account first');
      handleLogin("YouTube");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error('Please login first');
      navigate('/');
      return;
    }

    setTransferring(true);

    try {
      // Loop through selected playlists and start the transfer
      // For this implementation, we handle the first one and redirect
      for (const playlist of playlistsSelection) {
        const playlistId = playlist?.id;
        
        if (playlistId.startsWith('favorite-')) {
            toast.error(`"${playlist.name}" cannot be transferred yet.`);
            continue;
        }

        const destinationProvider = toService === 'youtube-music' ? 'youtube' : toService;

        const transferPayload = {
            sourceProvider: 'spotify',
            sourcePlaylistId: playlistId,
            destinationProvider,
            newPlaylistName: playlist.name || `Playlist ${playlistId}`,
        };

        const response = await fetch('https://matchmytunes.onrender.com/api/transfer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(transferPayload),
        });

        const responseData = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            const errorMessage = responseData.message || responseData.error || 'Transfer failed';
            toast.error(errorMessage);
            console.error('Transfer start failed:', errorMessage);
            continue; 
        }

        const jobId = responseData?.jobId || responseData?.job_id;

        if (jobId) {
            toast.success('Transfer started successfully!');
            // Redirect to the progress page with the new Job ID
            navigate(`/transfer/progress?jobId=${jobId}`);
            return; // Exit function after successful redirect
        } else {
            toast.error('Failed to get Job ID from server.');
        }
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Failed to initiate transfer');
    } finally {
      setTransferring(false);
    }
  };

  const selectedCount = playlistsSelection.length;
  const currentToService = toService || '';
  const selectedServiceState = services.find((service) => service.id === toService);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B2C] via-[#1c1f54] to-[#040720] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Quick Setup — Transfer a Playlist</h1>
          <p className="text-gray-400">
            Select your destination service to transfer {selectedCount} selected playlist{selectedCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300" htmlFor="from-service-select">
                FROM SERVICE
              </label>
              {isSpotifyConnected() && (
                <button
                  onClick={handleDisconnectSpotify}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  title="Disconnect Spotify"
                  type="button"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Disconnect
                </button>
              )}
            </div>
            <div className="relative">
              <select
                id="from-service-select"
                value={fromService}
                onChange={(event) => setFromService(event.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled
              >
                <option value="spotify">Spotify</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSpotifyConnected() ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className={`text-xs ${isSpotifyConnected() ? 'text-green-400' : 'text-gray-400'}`}>
                  {isSpotifyConnected() ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              {!isSpotifyConnected() && (
                <button
                  onClick={handleReconnectSpotify}
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                  type="button"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300" htmlFor="to-service-select">
                TO SERVICE
              </label>
              {toService && (toService === 'youtube' || toService === 'youtube-music') && isYouTubeConnected() && (
                <button
                  onClick={handleDisconnectYouTube}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  title="Disconnect YouTube"
                  type="button"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Disconnect
                </button>
              )}
            </div>
            <div className="relative">
              <select
                id="to-service-select"
                value={currentToService}
                onChange={(event) => setToService(event.target.value || null)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select destination...</option>
                {services
                  .filter((service) => service.id !== 'spotify')
                  .map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {selectedServiceState ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedServiceState.connected ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className={`text-xs ${selectedServiceState.connected ? 'text-green-400' : 'text-gray-400'}`}>
                      {selectedServiceState.connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  {!selectedServiceState.connected && (toService === 'youtube' || toService === 'youtube-music') && (
                    <button
                      onClick={handleReconnectYouTube}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
                      type="button"
                    >
                      Connect
                    </button>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-500">Select a service</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Supported Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                name={service.name}
                icon={service.icon}
                connected={service.connected}
                selected={toService === service.id || (fromService === service.id && service.id === 'spotify')}
                onClick={() => handleServiceSelect(service.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleLaunchTransfer}
            disabled={!toService || transferring}
            className={`
              px-12 py-4 rounded-full font-semibold text-white text-lg transition-all
              ${toService && !transferring
                ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/50'
                : 'bg-gray-600 cursor-not-allowed opacity-50'}
            `}
            type="button"
          >
            {transferring ? 'Initiating Transfer...' : 'Launch transfer'}
          </button>

          {(toService === 'youtube' || toService === 'youtube-music') && !isYouTubeConnected() && (
            <p className="text-sm text-yellow-400 text-center max-w-md">
              ⚠️ You need to connect your YouTube account first. Click on YouTube Music or YouTube in the services grid above to connect.
            </p>
          )}

          {(toService === 'youtube' || toService === 'youtube-music') && isYouTubeConnected() && (
            <p className="text-sm text-gray-400 text-center max-w-md">
              💡 After transfer, playlists will appear in your {toService === 'youtube-music' ? 'YouTube Music' : 'YouTube'} library.
              You may need to refresh the app to see them.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferSetup;