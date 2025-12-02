import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectionStore } from '../../store/selection';
import { ServiceCard } from '../../components/service-card';
import { getAuthToken, isYouTubeConnected, setYouTubeConnected, handleYouTubeCallback, disconnectSpotify, disconnectYouTube, isSpotifyConnected } from '../../lib/spotify';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
}

const TransferSetup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedPlaylists, destinationService, setDestinationService } = useSelectionStore();
  const [fromService, setFromService] = useState<string>('spotify');
  const [toService, setToService] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  // Check if destination was pre-selected from home screen
  useEffect(() => {
    const savedToService = sessionStorage.getItem('selected_destination');
    if (savedToService && !toService) {
      setToService(savedToService);
      setDestinationService(savedToService);
    }
  }, []);

  useEffect(() => {
    if (selectedPlaylists.length === 0) {
      toast.error('No playlists selected. Redirecting...');
      navigate('/auth/spotify/callback');
    }
  }, [selectedPlaylists, navigate]);

  useEffect(() => {
    if (toService) {
      setDestinationService(toService);
    }
  }, [toService, setDestinationService]);

  // Handle YouTube OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state === 'youtube') {
      handleYouTubeCallback(code).then(() => {
        window.history.replaceState({}, '', window.location.pathname);
        toast.success('YouTube connected successfully!');
      }).catch((error) => {
        toast.error('Failed to connect YouTube: ' + error.message);
      });
    }
  }, [searchParams]);

  const services: Service[] = [
    {
      id: 'spotify',
      name: 'Spotify',
      connected: isSpotifyConnected(),
      icon: (
        <svg className="w-10 h-10" fill="#1DB954" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.299.181-.539.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      ),
    },
    {
      id: 'youtube-music',
      name: 'YouTube Music',
      connected: isYouTubeConnected(),
      icon: (
        <svg className="w-10 h-10" fill="#FF0000" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      id: 'apple-music',
      name: 'Apple Music',
      connected: false,
      icon: (
        <svg className="w-10 h-10" fill="#FA243C" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.896 3.823c1.97 0 3.57 1.6 3.57 3.57s-1.6 3.57-3.57 3.57-3.57-1.6-3.57-3.57 1.6-3.57 3.57-3.57zM12 5.23c-1.133 0-2.05.917-2.05 2.05 0 1.131.917 2.05 2.05 2.05 1.131 0 2.05-.919 2.05-2.05 0-1.133-.919-2.05-2.05-2.05zm-1.35 8.48c-2.326 0-4.21-1.884-4.21-4.21h1.5c0 1.495 1.215 2.71 2.71 2.71s2.71-1.215 2.71-2.71h1.5c0 2.326-1.884 4.21-4.21 4.21zm.675 4.375c-1.137 0-2.059.921-2.059 2.057 0 1.138.922 2.059 2.059 2.059 1.136 0 2.056-.921 2.056-2.059 0-1.136-.92-2.057-2.056-2.057z" />
        </svg>
      ),
    },
    {
      id: 'youtube',
      name: 'YouTube',
      connected: isYouTubeConnected(),
      icon: (
        <svg className="w-10 h-10" fill="#FF0000" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      id: 'amazon-music',
      name: 'Amazon Music',
      connected: false,
      icon: (
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded flex items-center justify-center text-white font-bold text-sm">
          AM
        </div>
      ),
    },
    {
      id: 'deezer',
      name: 'Deezer',
      connected: false,
      icon: (
        <svg className="w-10 h-10" fill="#00C7F2" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4z" />
        </svg>
      ),
    },
    {
      id: 'soundcloud',
      name: 'SoundCloud',
      connected: false,
      icon: (
        <svg className="w-10 h-10" fill="#FF5500" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4z" />
        </svg>
      ),
    },
    {
      id: 'tidal',
      name: 'TIDAL',
      connected: false,
      icon: (
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded flex items-center justify-center text-white font-bold">
          T
        </div>
      ),
    },
  ];

  const handleServiceSelect = (serviceId: string) => {
    if (serviceId === 'spotify') {
      setFromService('spotify');
    } else {
      // Check if service needs authentication
      if ((serviceId === 'youtube' || serviceId === 'youtube-music') && !isYouTubeConnected()) {
        // Redirect to YouTube login
        window.location.href = 'https://matchmytunes.onrender.com/api/auth/youtube/login';
        return;
      }
      setToService(serviceId);
    }
  };

  const handleDisconnectSpotify = () => {
    if (window.confirm('Are you sure you want to disconnect your Spotify account? You will need to reconnect to continue.')) {
      disconnectSpotify();
      toast.success('Spotify disconnected successfully');
      navigate('/');
    }
  };

  const handleDisconnectYouTube = () => {
    if (window.confirm('Are you sure you want to disconnect your YouTube account?')) {
      disconnectYouTube();
      toast.success('YouTube disconnected successfully');
      // Refresh the page to update connection status
      window.location.reload();
    }
  };

  const handleReconnectSpotify = () => {
    // Redirect to Spotify login
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      'https://matchmytunes.onrender.com/api/auth/spotify/login',
      'MatchMyTunesLogin',
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  const handleReconnectYouTube = () => {
    // Redirect to YouTube login
    window.location.href = 'https://matchmytunes.onrender.com/api/auth/youtube/login';
  };

  const handleLaunchTransfer = async () => {
    if (!toService) {
      toast.error('Please select a destination service');
      return;
    }

    if (selectedPlaylists.length === 0) {
      toast.error('No playlists selected');
      return;
    }

    // Check if YouTube is connected when transferring to YouTube/YouTube Music
    if ((toService === 'youtube' || toService === 'youtube-music') && !isYouTubeConnected()) {
      toast.error('Please connect your YouTube account first');
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
      const results: Array<{ success: boolean; playlistName: string; error?: string; data?: any }> = [];
      
      // Transfer each playlist individually with better error handling
      for (const playlist of selectedPlaylists) {
        try {
          const destinationProvider = toService === 'youtube-music' ? 'youtube' : toService;
          
          // Skip favorite items - they need special handling
          if (playlist.id.startsWith('favorite-')) {
            console.warn('Skipping favorite item:', playlist.id);
            results.push({
              success: false,
              playlistName: playlist.name,
              error: 'Favorite items (songs/albums/artists) cannot be transferred as playlists. Please select actual playlists.',
            });
            toast.error(`"${playlist.name}" cannot be transferred - select actual playlists only`, { duration: 4000 });
            continue;
          }

          // Ensure we have a valid playlist ID and name
          if (!playlist.id || playlist.id === 'favorite-songs' || playlist.id === 'favorite-albums' || playlist.id === 'favorite-artists') {
            results.push({
              success: false,
              playlistName: playlist.name,
              error: 'Invalid playlist ID',
            });
            continue;
          }

          const transferPayload = {
            sourceProvider: 'spotify',
            sourcePlaylistId: playlist.id,
            destinationProvider: destinationProvider,
            newPlaylistName: playlist.name || `Playlist ${playlist.id}`,
          };

          console.log('Transferring playlist:', transferPayload);

          const response = await fetch('https://matchmytunes.onrender.com/api/transfer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(transferPayload),
          });

          const responseData = await response.json().catch(() => ({}));
          
          console.log('Transfer response:', {
            status: response.status,
            ok: response.ok,
            data: responseData,
          });

          if (!response.ok) {
            const errorMessage = responseData.message || responseData.error || `HTTP ${response.status}: Failed to transfer ${playlist.name}`;
            console.error('Transfer failed for playlist:', playlist.name, errorMessage);
            results.push({
              success: false,
              playlistName: playlist.name,
              error: errorMessage,
            });
            toast.error(`Failed to transfer "${playlist.name}": ${errorMessage}`, { duration: 5000 });
          } else {
            console.log('Successfully transferred:', playlist.name, responseData);
            results.push({
              success: true,
              playlistName: playlist.name,
              data: responseData,
            });
            toast.success(`Transferred "${playlist.name}"`, { duration: 3000 });
          }
        } catch (error: any) {
          console.error('Error transferring playlist:', playlist.name, error);
          results.push({
            success: false,
            playlistName: playlist.name,
            error: error.message || 'Unknown error',
          });
          toast.error(`Error transferring "${playlist.name}": ${error.message}`, { duration: 5000 });
        }
      }

      // Summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (successful > 0) {
        toast.success(
          `Successfully transferred ${successful} playlist(s)!${failed > 0 ? ` ${failed} failed.` : ''} Check your ${toService === 'youtube-music' ? 'YouTube Music' : 'YouTube'} library.`,
          { duration: 7000 }
        );
        
        // Show info about where to find playlists
        setTimeout(() => {
          const message = toService === 'youtube-music' 
            ? 'Playlists should appear in your YouTube Music library. If you don\'t see them, try refreshing the app or check your YouTube account.'
            : 'Playlists should appear in your YouTube account. Check the "Library" section in YouTube or YouTube Music.';
          toast.info(message, { duration: 8000 });
        }, 2000);
      }

      if (failed > 0) {
        console.error('Failed transfers:', results.filter(r => !r.success));
        toast.error(
          `${failed} playlist(s) failed to transfer. Check console for details.`,
          { duration: 7000 }
        );
      }

      // Show detailed results in console
      console.log('Transfer Summary:', {
        total: selectedPlaylists.length,
        successful,
        failed,
        results,
      });
      
      // Clear selection and redirect after a delay
      if (successful > 0) {
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(error.message || 'Failed to initiate transfer', { duration: 5000 });
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B2C] via-[#1c1f54] to-[#040720] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Quick Setup — Transfer a Playlist</h1>
          <p className="text-gray-400">
            Select your destination service to transfer {selectedPlaylists.length} selected playlist{selectedPlaylists.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Service Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* FROM Service */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">FROM SERVICE</label>
              {isSpotifyConnected() && (
                <button
                  onClick={handleDisconnectSpotify}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  title="Disconnect Spotify"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Disconnect
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={fromService}
                onChange={(e) => setFromService(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled
              >
                <option value="spotify">Spotify</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSpotifyConnected() ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className={`text-xs ${isSpotifyConnected() ? 'text-green-400' : 'text-gray-400'}`}>
                  {isSpotifyConnected() ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              {!isSpotifyConnected() && (
                <button
                  onClick={handleReconnectSpotify}
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>

          {/* TO Service */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">TO SERVICE</label>
              {toService && (toService === 'youtube' || toService === 'youtube-music') && isYouTubeConnected() && (
                <button
                  onClick={handleDisconnectYouTube}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  title="Disconnect YouTube"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Disconnect
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={toService || ''}
                onChange={(e) => setToService(e.target.value || null)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select destination...</option>
                {services
                  .filter((s) => s.id !== 'spotify')
                  .map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {toService ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${services.find(s => s.id === toService)?.connected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span className={`text-xs ${services.find(s => s.id === toService)?.connected ? 'text-green-400' : 'text-gray-400'}`}>
                      {services.find(s => s.id === toService)?.connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  {!services.find(s => s.id === toService)?.connected && (toService === 'youtube' || toService === 'youtube-music') && (
                    <button
                      onClick={handleReconnectYouTube}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
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

        {/* Services Grid */}
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

        {/* Launch Transfer Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleLaunchTransfer}
            disabled={!toService || transferring}
            className={`
              px-12 py-4 rounded-full font-semibold text-white text-lg transition-all
              ${toService && !transferring
                ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/50'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
              }
            `}
          >
            {transferring ? 'Transferring...' : 'Launch transfer'}
          </button>
          
          {/* Info about YouTube connection */}
          {(toService === 'youtube' || toService === 'youtube-music') && !isYouTubeConnected() && (
            <p className="text-sm text-yellow-400 text-center max-w-md">
              ⚠️ You need to connect your YouTube account first. Click on YouTube Music or YouTube in the services grid above to connect.
            </p>
          )}
          
          {/* Info about where playlists will appear */}
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
