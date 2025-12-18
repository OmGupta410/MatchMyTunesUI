import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSelectionStore } from '../store/selection';
import { authApi, getStoredToken, persistToken } from '../lib/api';

const Home = () => {
  const navigate = useNavigate();
  const { setSourceService } = useSelectionStore();

  // =========================
  // STATE
  // =========================
  const [selectedSource, setSelectedSource] = useState('');
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);


   // Last Transfer Data
  const [lastTransfer, setLastTransfer] = useState(null);
  const [loadingLastTransfer, setLoadingLastTransfer] = useState(false);

  // Constants
  const API_BASE_URL = "https://matchmytunes.onrender.com";


  // Helper to check connection status from storage
  const checkConnections = useCallback(() => {
    setSpotifyConnected(sessionStorage.getItem("spotify_connected") === "true" || localStorage.getItem("spotify_connected") === "true");
    setYoutubeConnected(sessionStorage.getItem("youtube_connected") === "true" || localStorage.getItem("youtube_connected") === "true");
  }, []);

  useEffect(() => {
    checkConnections();
  }, [checkConnections]);

  const persistSourceSelection = useCallback((serviceId) => {
    const normalized = serviceId === 'youtube' ? 'youtube' : 'spotify';
    setSelectedSource(normalized);
    setSourceService(normalized);
    try {
      sessionStorage.setItem('selected_source', normalized);
    } catch (error) { /* Ignore */ }
  }, [setSourceService]);

  const navigateToPlaylists = useCallback((serviceId, extraParams) => {
    const normalized = serviceId === 'youtube' ? 'youtube' : 'spotify';
    persistSourceSelection(normalized);

    const params = new URLSearchParams({ source: normalized });
    if (extraParams && typeof extraParams === 'object') {
      Object.entries(extraParams).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });
    }

    // Determine correct callback route based on provider
    const route = normalized === 'youtube' ? '/transfer/setup' : '/auth/spotify/callback';
    navigate(`${route}?${params.toString()}`);
  }, [navigate, persistSourceSelection]);

  // =========================
  // AUTHENTICATION LOGIC
  // =========================
  const handleLogin = (provider) => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const isSpotify = provider === "Spotify";
    const url = isSpotify ? authApi.spotifyLoginUrl() : authApi.youtubeLoginUrl();

    const popup = window.open(
      url,
      "MatchMyTunesLogin",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) {
      toast.error("Popup blocked. Please allow popups for this site.");
      return;
    }

    const checkPopup = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkPopup);
          // Check storage for success
          if (getStoredToken()) {
            checkConnections();
            if (isSpotify && sessionStorage.getItem("spotify_connected")) {
               persistSourceSelection('spotify');
               navigateToPlaylists('spotify');
            } else if (!isSpotify && sessionStorage.getItem("youtube_connected")) {
               persistSourceSelection('youtube');
               navigateToPlaylists('youtube');
            }
          }
          return;
        }

        // Try reading URL (Same origin only)
        try {
          const popupUrl = popup.location.href;
          if (popupUrl.includes('success') || popupUrl.includes('code=') || popupUrl.includes('token=')) {
            const urlParams = new URLSearchParams(popup.location.search);
            const code = urlParams.get('code');
            const token = urlParams.get('token');

            if (token) {
              persistToken(token);
              clearInterval(checkPopup);
              
              if (isSpotify) {
                sessionStorage.setItem("spotify_connected", "true");
                setSpotifyConnected(true);
                popup.close();
                navigateToPlaylists('spotify', code ? { code } : undefined);
              } else {
                sessionStorage.setItem("youtube_connected", "true");
                setYoutubeConnected(true);
                popup.close();
                navigateToPlaylists('youtube');
              }
            }
          }
        } catch (e) {
          // Cross-origin error expected
        }
      } catch (e) {
        if (popup.closed) clearInterval(checkPopup);
      }
    }, 500);

    // Timeout 5 mins
    setTimeout(() => {
      clearInterval(checkPopup);
      if (!popup.closed) popup.close();
    }, 300000);
  };

   // Listen for login success and fetch data
  useEffect(() => {
    // Check if we already have a token on mount and fetch history
    const token = localStorage.getItem("jwt");
    if (token) {
        fetchLastTransfer();
        // Optimistically set connected if token exists (logic can be improved with a /me endpoint later)
        setSpotifyConnected(true); 
        setYoutubeConnected(true);
    }

    const messageHandler = (event) => {
      if (event.data.type === "AUTH_SUCCESS") {
        const { token, userId, provider } = event.data;
        
        console.log(`Login successful with ${provider}!`);
        
        localStorage.setItem("jwt", token);
        localStorage.setItem("userId", userId);

        if (provider === "Spotify") setSpotifyConnected(true);
        if (provider === "YouTube") setYoutubeConnected(true);

        // Fetch last transfer now that we are logged in
        fetchLastTransfer();
      }
    };

    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, []);

  // PAYMENT / SYNC LOGIC
  // =========================
  const handleSyncToggle = async () => {
    const token = localStorage.getItem("jwt");
    if (!token) return alert("Please log in first.");

    // Visual feedback could be added here (e.g. loading spinner on toggle)
    try {
        const response = await fetch(`${API_BASE_URL}/api/payment/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                planId: 1, // Assuming ID 2 is Premium
                successUrl: window.location.origin + "/success", // Or wherever you want to redirect
                cancelUrl: window.location.origin // Redirect back home on cancel
            })
        });

        const data = await response.json();
        
        if (data.sessionUrl) {
            window.location.href = data.sessionUrl;
        } else {
            alert("Could not initiate payment session.");
        }
    } catch (error) {
        console.error("Payment error:", error);
        alert("Something went wrong initiating the sync.");
    }
  };

  // SUB-COMPONENT: LAST TRANSFER BAR
  // =========================
  const LastTransferBar = ({ data }) => {
      if (!data) return null;

      return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mt-6 flex items-center gap-4 animate-fade-in">
            {/* Playlist Image */}
            <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-black/50">
                {data.playlistImageUrl ? (
                    <img src={data.playlistImageUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Img</div>
                )}
            </div>

            {/* Details */}
            <div className="flex-grow min-w-0">
                <h4 className="font-semibold text-sm text-white truncate">{data.playlistName || "Unknown Playlist"}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span>{data.totalTracks} Tracks</span>
                    <span>•</span>
                    <span className={`uppercase ${data.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'}`}>{data.status}</span>
                    <span>•</span>
                    <span>{data.sourceProvider} &rarr; {data.destinationProvider}</span>
                </div>
            </div>

            {/* Sync Toggle (Paywall Trigger) */}
            <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Auto-Sync</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" onChange={handleSyncToggle} />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>
        </div>
      );
  };

  // Function to fetch last transfer details
  const fetchLastTransfer = async () => {
      const token = localStorage.getItem("jwt");
      if (!token) return;

      try {
          setLoadingLastTransfer(true);
          const response = await fetch(`${API_BASE_URL}/api/transfer/last`, {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          if (response.status === 200) {
              const data = await response.json();
              setLastTransfer(data);
          } else if (response.status === 204) {
              setLastTransfer(null); // No history
          }
      } catch (error) {
          console.error("Error fetching last transfer:", error);
      } finally {
          setLoadingLastTransfer(false);
      }
  };

  const handleDisconnect = (e, serviceId) => {
    e.stopPropagation();
    e.preventDefault();

    if (serviceId === 'spotify') {
        sessionStorage.removeItem('spotify_connected');
        localStorage.removeItem('spotify_connected');
        setSpotifyConnected(false);
        toast.success("Spotify disconnected");
    } else if (serviceId === 'youtube') {
        sessionStorage.removeItem('youtube_connected');
        localStorage.removeItem('youtube_connected');
        setYoutubeConnected(false);
        toast.success("YouTube disconnected");
    }
  };

  // Listen for postMessage from popup
  useEffect(() => {
    const messageHandler = (event) => {
      // Allow messages from your backend or current origin
      const allowedOrigins = ["https://matchmytunes.onrender.com", window.location.origin];
      if (!allowedOrigins.includes(event.origin)) return;

      if (event.data.type === "AUTH_SUCCESS") {
        const { token, userId, provider, code } = event.data;
        
        if (token) persistToken(token);
        if (userId) sessionStorage.setItem("userId", userId);

        const normalizedProvider = (provider || '').toLowerCase();

        if (normalizedProvider === "spotify") {
          sessionStorage.setItem("spotify_connected", "true");
          setSpotifyConnected(true);
          persistSourceSelection('spotify');
          navigateToPlaylists('spotify', code ? { code } : undefined);
        } else if (normalizedProvider === "youtube") {
          sessionStorage.setItem("youtube_connected", "true");
          setYoutubeConnected(true);
          setYoutubeConnected(true);
          persistSourceSelection('youtube');
          navigateToPlaylists('youtube');
        }
      }
    };

    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, [navigateToPlaylists, persistSourceSelection]);

  // Initial Source Logic
  useEffect(() => {
    const stored = sessionStorage.getItem('selected_source');
    if (stored && stored !== selectedSource) persistSourceSelection(stored);
    else if (!selectedSource && spotifyConnected) persistSourceSelection('spotify');
  }, [persistSourceSelection, selectedSource, spotifyConnected]);

  const sourceOptions = [
    { id: 'spotify', label: 'Spotify', iconClass: 'fa-brands fa-spotify', isActive: true, connected: spotifyConnected },
    { id: 'youtube', label: 'YouTube', iconClass: 'fa-brands fa-youtube', isActive: true, connected: youtubeConnected },
    { id: 'apple-music', label: 'Apple Music', iconClass: 'fa-brands fa-apple', isActive: false },
    { id: 'deezer', label: 'Deezer', iconClass: 'fa-brands fa-deezer', isActive: false },
    { id: 'tidal', label: 'TIDAL', iconClass: 'fa-brands fa-tidal', isActive: false },
    { id: 'soundcloud', label: 'SoundCloud', iconClass: 'fa-brands fa-soundcloud', isActive: false },
  ];

  const selectedSourceOption = sourceOptions.find((option) => option.id === selectedSource) || null;

  const handleSourceSelect = (option) => {
    if (!option.isActive) return;
    const normalized = option.id === 'youtube' ? 'youtube' : 'spotify';
    persistSourceSelection(normalized);

    const isConnected = normalized === 'spotify' ? spotifyConnected : youtubeConnected;
    if (isConnected) {
      navigateToPlaylists(normalized);
    } else {
      handleLogin(option.label);
    }
  };

  const handleLaunch = () => {
    const effective = selectedSource || (spotifyConnected ? 'spotify' : '');
    if (!effective) return toast.error('Select a source platform');
    
    if (effective === 'spotify' && !spotifyConnected) return handleLogin('Spotify');
    if (effective === 'youtube' && !youtubeConnected) return handleLogin('YouTube');
    
    navigateToPlaylists(effective);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      {/* HERO SECTION */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          {/* Left Content */}
          <div>
            <div className="text-sm border px-3 py-1 rounded-full border-gray-500 text-gray-300 inline-block">
              Playlist transfer, done right
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 leading-tight">
              Keep your playlists in sync,<br /> wherever you listen.
            </h1>
            <p className="text-gray-400 mt-4 max-w-md">
              Transfer your playlists between Spotify, Apple Music, YouTube Music and more — without losing tracks or order.
            </p>
            {/* REPLACE BUTTON WITH LAST TRANSFER BAR IF DATA EXISTS */}
            {lastTransfer ? (
                <LastTransferBar data={lastTransfer} />
            ) : (
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                    onClick={handleLaunch}
                    className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-3 rounded-full text-center transition duration-300"
                >
                    Start a transfer
                </button>
                </div>
            )}
            <div className="flex gap-10 mt-10">
              <div><h3 className="text-2xl font-bold">1.2k+</h3><p className="text-gray-400 text-sm">Playlists processed</p></div>
              <div><h3 className="text-2xl font-bold">3+</h3><p className="text-gray-400 text-sm">Supported services</p></div>
            </div>
          </div>

          {/* Right Selector Box */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-white/10">
            <h3 className="text-lg text-gray-300">Quick setup</h3>
            <h2 className="text-2xl font-semibold mt-1 mb-6">Choose your source</h2>
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-2">SOURCE PLATFORM</p>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {selectedSourceOption ? selectedSourceOption.label : 'Select a platform'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedSourceOption 
                      ? (selectedSourceOption.connected ? 'Authenticated and ready' : 'Authenticate to continue')
                      : 'Pick a source to get started'}
                  </p>
                </div>
                {selectedSourceOption && selectedSourceOption.isActive && (
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium ${selectedSourceOption.connected ? 'text-green-400' : 'text-yellow-300'}`}>
                        {selectedSourceOption.connected ? 'Connected' : 'Not connected'}
                    </span>
                    {selectedSourceOption.connected && (
                        <button 
                            onClick={(e) => handleDisconnect(e, selectedSourceOption.id)}
                            className="text-[10px] text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-0.5 rounded hover:bg-red-500/10 transition"
                        >
                            Disconnect
                        </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400">SUPPORTED SOURCES</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs">
              {sourceOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSourceSelect(option)}
                  disabled={!option.isActive}
                  className={`p-3 border rounded-lg text-center flex flex-col items-center gap-2 transition duration-300 ${
                    !option.isActive ? 'border-white/5 bg-white/5 cursor-not-allowed opacity-60' :
                    selectedSource === option.id ? 'bg-white/10 border-white/30' : 'border-white/10 hover:bg-white/10'
                  }`}
                >
                  <i className={`${option.iconClass} text-xl`}></i>
                  <span className="text-[11px] font-semibold">{option.label}</span>
                  {option.isActive ? (
                    <span className={`text-[10px] ${option.connected ? 'text-green-400' : 'text-gray-400'}`}>
                      {option.connected ? 'Connected' : 'Authenticate'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">Coming soon</span>
                  )}
                </button>
              ))}
            </div>

            <button onClick={handleLaunch} className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold mt-6 py-3 rounded-full transition duration-300">
              Continue to playlists
            </button>
            
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              Authenticate your source platform. Destination selection happens after you review playlists.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center">How it works</h2>
          <p className="text-gray-400 text-center mt-2 max-w-lg mx-auto">
            A simple 3-step process to keep your playlists synced everywhere.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              {
                step: "01",
                title: "Connect your services",
                desc: "Log in with your music platforms. Minimum permissions only.",
              },
              {
                step: "02",
                title: "Select playlists",
                desc: "Choose single playlists or your entire library.",
              },
              {
                step: "03",
                title: "Transfer & sync",
                desc: "Start the transfer. We keep everything updated automatically.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white/5 p-6 rounded-xl border border-white/10 h-full transition duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg"
              >
                <p className="text-gray-400 text-sm">{item.step}</p>
                <h3 className="text-xl font-semibold mt-2">{item.title}</h3>
                <p className="text-gray-400 mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center">
            Built for serious listeners
          </h2>
          <p className="text-gray-400 text-center mt-2 max-w-lg mx-auto">
            Tools designed to give you full control of your music library.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              "One-click transfer",
              "Auto sync",
              "Smart matching",
              "Backup & export",
              "Link sharing",
              "Multi-format upload",
            ].map((feature) => (
              <div
                key={feature}
                className="bg-white/5 p-6 rounded-xl border border-white/10 h-full transition duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">{feature}</h3>
                <p className="text-gray-400 mt-2">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR CONVERSIONS */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center">
            Popular conversions 
          </h2>
          <p className="text-gray-400 text-center mt-2 mb-6 max-w-md mx-auto">
            These routes are used most by our users.
          </p>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            {[
              {
                from: "Spotify",
                to: "YouTube Music",
                fromIcon: "fa-brands fa-spotify",
                toIcon: "fa-brands fa-youtube",
              },
              {
                from: "YouTube Music",
                to: "Spotify",
                fromIcon: "fa-brands fa-youtube",
                toIcon: "fa-brands fa-spotify",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex justify-between py-4 border-b border-white/10 last:border-none hover:bg-white/10 px-3 rounded-lg transition duration-300"
              >
                <div className="flex items-center gap-3">
                  <i className={`${item.fromIcon} text-xl`}></i>
                  <span className="text-gray-300 font-medium">{item.from}</span>

                  <span className="text-gray-400">→</span>

                  <i className={`${item.toIcon} text-xl`}></i>
                  <span className="text-gray-300 font-medium">{item.to}</span>
                </div>

                <button className="border border-gray-500 px-4 py-1 rounded-full text-sm hover:bg-white/20 transition duration-300">
                  Convert
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-xl p-10 text-center transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h2 className="text-3xl font-bold">Real people, not bots</h2>
          <p className="text-gray-400 mt-3 max-w-md mx-auto">
            Need help? Our support team responds fast.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <button className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-full font-semibold transition duration-300">
              FAQ
            </button>
            <button className="border border-gray-500 px-6 py-3 rounded-full hover:border-gray-300 hover:bg-white/10 transition duration-300">
              Contact support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;