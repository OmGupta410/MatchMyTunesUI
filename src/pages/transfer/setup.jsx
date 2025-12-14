import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelectionStore } from "../../store/selection.js";
import { ServiceCard } from "../../components/service-card.jsx";
import {
  getAuthToken,
  isYouTubeConnected,
  setYouTubeConnected,
  handleYouTubeCallback,
  disconnectSpotify,
  disconnectYouTube,
  isSpotifyConnected,
  setSpotifyConnected,
} from "../../lib/spotify.js";
import { authApi, API_BASE_URL, transferApi } from "../../lib/api.js";

const providerLabels = {
  spotify: "Spotify",
  youtube: "YouTube",
};

const mapServiceToProvider = (serviceId) => {
  if (!serviceId) {
    return "";
  }
  if (serviceId.includes("spotify")) {
    return "spotify";
  }
  if (serviceId.includes("youtube")) {
    return "youtube";
  }
  return "";
};

const buildServices = (connections) => [
  {
    id: "spotify",
    name: "Spotify",
    provider: "spotify",
    connected: connections.spotify,
    icon: (
      <svg className="w-10 h-10" fill="#1DB954" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.299.181-.539.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
  },
  {
    id: "youtube",
    name: "YouTube",
    provider: "youtube",
    connected: connections.youtube,
    icon: (
      <svg className="w-10 h-10" fill="#FF0000" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: "youtube-music",
    name: "YouTube Music",
    provider: "youtube",
    connected: connections.youtube,
    icon: (
      <svg className="w-10 h-10" fill="#FF0000" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: "apple-music",
    name: "Apple Music",
    provider: "apple",
    connected: false,
    disabled: true,
    badge: "Soon",
    icon: (
      <svg className="w-10 h-10" fill="#FA243C" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.896 3.823c1.97 0 3.57 1.6 3.57 3.57s-1.6 3.57-3.57 3.57-3.57-1.6-3.57-3.57 1.6-3.57 3.57-3.57zM12 5.23c-1.133 0-2.05.917-2.05 2.05 0 1.131.917 2.05 2.05 2.05 1.131 0 2.05-.919 2.05-2.05 0-1.133-.919-2.05-2.05-2.05zm-1.35 8.48c-2.326 0-4.21-1.884-4.21-4.21h1.5c0 1.495 1.215 2.71 2.71 2.71s2.71-1.215 2.71-2.71h1.5c0 2.326-1.884 4.21-4.21 4.21zm.675 4.375c-1.137 0-2.059.921-2.059 2.057 0 1.138.922 2.059 2.059 2.059 1.136 0 2.056-.921 2.056-2.059 0-1.136-.92-2.057-2.056-2.057z" />
      </svg>
    ),
  },
  {
    id: "deezer",
    name: "Deezer",
    provider: "deezer",
    connected: false,
    disabled: true,
    badge: "Soon",
    icon: (
      <svg className="w-10 h-10" fill="#00C7F2" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4z" />
      </svg>
    ),
  },
];

const ConnectionCard = ({ provider, connected, onConnect, onDisconnect }) => {
  const label = providerLabels[provider];
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400">{label}</p>
          <p className="text-sm text-white mt-1">{connected ? "Connected" : "Not connected"}</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-500"}`} />
      </div>
      <div className="flex gap-3">
        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="flex-1 rounded-full border border-red-400/40 text-red-300 px-4 py-2 text-sm hover:border-red-300 hover:text-red-200 transition"
          >
            Disconnect {label}
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="flex-1 rounded-full border border-purple-400/40 text-purple-200 px-4 py-2 text-sm hover:border-purple-200 hover:text-purple-100 transition"
          >
            Connect {label}
          </button>
        )}
      </div>
    </div>
  );
};

const TransferSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    selectedPlaylists,
    destinationService: storedDestination,
    setDestinationService,
    sourceService,
    setLastTransferJob,
    setActiveJobStatus,
    clearTransferState,
  } = useSelectionStore();

  const [localDestination, setLocalDestination] = useState(storedDestination || "");
  const [connections, setConnections] = useState({
    spotify: isSpotifyConnected(),
    youtube: isYouTubeConnected(),
  });
  const [isStarting, setIsStarting] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateConnections = useCallback(() => {
    setConnections({
      spotify: isSpotifyConnected(),
      youtube: isYouTubeConnected(),
    });
  }, []);

  useEffect(() => {
    updateConnections();
  }, [updateConnections]);

  useEffect(() => {
    if (storedDestination) {
      setLocalDestination(storedDestination);
    }
  }, [storedDestination]);

  useEffect(() => {
    setDestinationService(localDestination || null);
  }, [localDestination, setDestinationService]);

  useEffect(() => {
    if (!selectedPlaylists.length) {
      toast.error("Select at least one playlist to continue.");
      navigate("/auth/spotify/callback");
    }
  }, [selectedPlaylists, navigate]);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state === "youtube") {
      handleYouTubeCallback(code)
        .then(() => {
          window.history.replaceState({}, "", window.location.pathname);
          setYouTubeConnected(true);
          updateConnections();
          toast.success("YouTube connected successfully");
        })
        .catch((error) => {
          toast.error(error?.message || "Failed to connect YouTube");
        });
    }
  }, [searchParams, updateConnections]);

  useEffect(() => {
    const listener = (event) => {
      const allowedOrigins = [API_BASE_URL, window.location.origin];
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }
      if (event.data?.type === "AUTH_SUCCESS") {
        const provider = (event.data?.provider || "").toLowerCase();
        if (provider === "youtube") {
          setYouTubeConnected(true);
          setShowYouTubeDialog(false);
        }
        if (provider === "spotify") {
          setSpotifyConnected(true);
        }
        updateConnections();
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [updateConnections]);

  useEffect(() => {
    if (connections.youtube && showYouTubeDialog) {
      setShowYouTubeDialog(false);
    }
  }, [connections.youtube, showYouTubeDialog]);

  const openAuthPopup = useCallback(
    (provider) => {
      const width = 520;
      const height = 640;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const url = provider === "spotify" ? authApi.spotifyLoginUrl() : authApi.youtubeLoginUrl();

      const popup = window.open(
        url,
        "MatchMyTunesAuth",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!popup) {
        toast.error("Enable popups to connect your account.");
        return;
      }

      const monitor = setInterval(() => {
        if (popup.closed) {
          clearInterval(monitor);
          updateConnections();
        }
      }, 800);

      setTimeout(() => {
        clearInterval(monitor);
        if (!popup.closed) {
          popup.close();
        }
      }, 300000);
    },
    [updateConnections]
  );

  const handleDisconnect = (provider) => {
    const confirmed = window.confirm(`Disconnect ${providerLabels[provider]}?`);
    if (!confirmed) {
      return;
    }

    if (provider === "spotify") {
      disconnectSpotify();
    } else {
      disconnectYouTube();
      setYouTubeConnected(false);
    }

    updateConnections();

    if (mapServiceToProvider(localDestination) === provider) {
      setLocalDestination("");
    }
  };

  const handleConnect = (provider) => {
    if (provider === "youtube") {
      setShowYouTubeDialog(true);
      return;
    }
    openAuthPopup(provider);
  };

  const services = useMemo(() => buildServices(connections), [connections]);

  const handleDestinationSelect = (service) => {
    if (service.disabled) {
      toast("Support for this service is coming soon.");
      return;
    }

    const provider = mapServiceToProvider(service.id);
    const currentSourceProvider = mapServiceToProvider(sourceService);

    if (!currentSourceProvider) {
      toast.error("Pick a source playlist before choosing a destination.");
      return;
    }

    if (provider && provider === currentSourceProvider) {
      toast.error("Pick a different destination provider to continue.");
      return;
    }

    setLocalDestination(service.id);

    if (provider === "youtube" && !connections.youtube) {
      setShowYouTubeDialog(true);
    }

    if (provider === "spotify" && !connections.spotify) {
      openAuthPopup("spotify");
    }
  };

  const sourceProvider = mapServiceToProvider(sourceService);
  const destinationProvider = mapServiceToProvider(localDestination);
  const comboSupported = Boolean(
    sourceProvider &&
    destinationProvider &&
    sourceProvider !== destinationProvider &&
    [sourceProvider, destinationProvider].every((provider) => ["spotify", "youtube"].includes(provider))
  );

  const destinationLabel = services.find((service) => service.id === localDestination)?.name;

  useEffect(() => {
    if (!sourceProvider) {
      toast.error("Select a source service first.");
      navigate("/");
    }
  }, [navigate, sourceProvider]);

  const handleStartTransfer = () => {
    if (!sourceProvider) {
      toast.error("Select a source before starting a transfer.");
      navigate("/");
      return;
    }

    if (!localDestination) {
      toast.error("Select a destination before continuing.");
      return;
    }

    if (!comboSupported) {
      toast.error("This transfer path is not supported yet.");
      return;
    }

    if (!selectedPlaylists.length) {
      toast.error("Select at least one playlist first.");
      return;
    }

    if (sourceProvider === "spotify" && !connections.spotify) {
      toast.error("Connect Spotify to continue.");
      openAuthPopup("spotify");
      return;
    }

    if (sourceProvider === "youtube" && !connections.youtube) {
      toast.error("Connect YouTube to continue.");
      setShowYouTubeDialog(true);
      return;
    }

    if (destinationProvider === "spotify" && !connections.spotify) {
      toast.error("Connect Spotify to complete this transfer.");
      openAuthPopup("spotify");
      return;
    }

    if (destinationProvider === "youtube" && !connections.youtube) {
      toast.error("Connect YouTube to complete this transfer.");
      setShowYouTubeDialog(true);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/");
      return;
    }

    setIsStarting(true);
    clearTransferState();
    setActiveJobStatus({ status: "starting" });
    setLastTransferJob(null);

    navigate("/transfer/progress");

    const launchTransfers = async () => {
      try {
        const normalizedDestination = destinationProvider;
        const normalizedSource = sourceProvider;
        const results = [];
        let firstJobId = "";

        for (const playlist of selectedPlaylists) {
          try {
            if (normalizedSource === "spotify" && playlist.id.startsWith("favorite-")) {
              results.push({ success: false, playlist });
              toast.error(`"${playlist.name}" cannot be transferred. Select actual playlists.`);
              continue;
            }

            const payload = {
              sourceProvider: normalizedSource,
              destinationProvider: normalizedDestination,
              sourcePlaylistId: playlist.id,
              newPlaylistName: playlist.name || `Playlist ${playlist.id}`,
            };

            const response = await transferApi.startTransfer(payload);
            results.push({ success: true, playlist, response });

            if (!firstJobId && response?.jobId) {
              firstJobId = response.jobId;
              setLastTransferJob(firstJobId);
              setActiveJobStatus({ jobId: firstJobId, status: "processing" });
            }
          } catch (error) {
            console.error("Transfer error", error);
            results.push({ success: false, playlist, error });
            setActiveJobStatus({ status: "error", error: error?.message || "Transfer failed" });
          }
        }

        const successful = results.filter((result) => result.success);
        const failed = results.filter((result) => !result.success);

        if (successful.length) {
          toast.success(
            `Started ${successful.length} transfer${successful.length > 1 ? "s" : ""} to ${destinationLabel}.`
          );
        }

        if (failed.length) {
          toast.error(
            `${failed.length} playlist${failed.length > 1 ? "s" : ""} could not start. Check details and try again.`
          );
        }

        if (!firstJobId) {
          setActiveJobStatus({ status: "error", error: "No transfer job returned." });
        }
      } catch (error) {
        console.error("Failed to start transfer", error);
        toast.error(error?.message || "Failed to start transfer");
        setActiveJobStatus({ status: "error", error: error?.message || "Failed to start transfer" });
      } finally {
        if (isMountedRef.current) {
          setIsStarting(false);
        }
      }
    };

    launchTransfers();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B2C] via-[#1c1f54] to-[#040720] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <h1 className="text-2xl font-semibold text-white">Review your transfer</h1>
          <div className="grid gap-4 sm:grid-cols-2 mt-6 text-sm text-gray-300">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest">Source</p>
              <p className="text-white mt-1 font-medium">{providerLabels[sourceProvider]}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedPlaylists.length} playlist{selectedPlaylists.length === 1 ? "" : "s"} selected</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest">Destination</p>
              <p className="text-white mt-1 font-medium">{destinationLabel || "Select a service"}</p>
              {!comboSupported && destinationProvider && (
                <p className="text-xs text-orange-300 mt-1">Spotify ↔ YouTube routes are supported right now.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ConnectionCard
            provider="spotify"
            connected={connections.spotify}
            onConnect={() => handleConnect("spotify")}
            onDisconnect={() => handleDisconnect("spotify")}
          />
          <ConnectionCard
            provider="youtube"
            connected={connections.youtube}
            onConnect={() => handleConnect("youtube")}
            onDisconnect={() => handleDisconnect("youtube")}
          />
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Select destination</h2>
            {destinationLabel && <span className="text-xs text-gray-400">{destinationLabel} selected</span>}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                name={service.name}
                icon={service.icon}
                connected={service.connected}
                selected={localDestination === service.id}
                disabled={service.disabled}
                badge={service.badge}
                onClick={() => handleDestinationSelect(service)}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Only Spotify ↔ YouTube routes are supported right now. Other services will be available soon.
          </p>
          <button
            type="button"
            onClick={handleStartTransfer}
            disabled={!comboSupported || !selectedPlaylists.length || isStarting}
            className={`mt-6 w-full rounded-full py-3 font-semibold transition-all ${
              !comboSupported || !selectedPlaylists.length || isStarting
                ? "bg-gray-600 text-gray-300 cursor-not-allowed opacity-70"
                : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/40"
            }`}
          >
            {isStarting ? "Starting..." : "Start transfer"}
          </button>
        </div>
      </div>

      {showYouTubeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0b1026] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold text-white">Connect YouTube</h3>
            <p className="text-sm text-gray-300">
              We will open a secure Google window so you can authorise MatchMyTunes. The window closes automatically once the connection succeeds.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => openAuthPopup("youtube")}
                className="flex-1 rounded-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm transition"
              >
                Connect account
              </button>
              <button
                type="button"
                onClick={() => setShowYouTubeDialog(false)}
                className="flex-1 rounded-full border border-white/20 text-gray-200 px-4 py-2 text-sm hover:border-white/40 transition"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500">Tip: disable popup blockers if the window does not appear.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferSetup;
