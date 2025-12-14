import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  disconnectSpotify,
  disconnectYouTube,
  isSpotifyConnected,
  isYouTubeConnected,
  setSpotifyConnected,
  setYouTubeConnected,
} from "../lib/spotify";
import { authApi, API_BASE_URL, transferApi } from "../lib/api";
import { useSelectionStore } from "../store/selection";

const SERVICE_OPTIONS = [
  {
    id: "spotify",
    label: "Spotify",
    provider: "spotify",
    iconClass: "fa-brands fa-spotify",
    supportsConnect: true,
  },
  {
    id: "youtube",
    label: "YouTube",
    provider: "youtube",
    iconClass: "fa-brands fa-youtube",
    supportsConnect: true,
  },
  {
    id: "youtube-music",
    label: "YouTube Music",
    provider: "youtube",
    iconClass: "fa-brands fa-youtube",
    supportsConnect: true,
  },
  {
    id: "apple-music",
    label: "Apple Music",
    provider: "apple",
    iconClass: "fa-brands fa-apple",
    supportsConnect: false,
  },
];

const SOURCE_OPTIONS = SERVICE_OPTIONS.filter((option) =>
  ["spotify", "youtube"].includes(option.id)
);

const PROVIDER_LABELS = {
  spotify: "Spotify",
  youtube: "YouTube",
};

const CONNECTED_PROVIDERS = ["spotify", "youtube"];

const initialCardState = {
  playlistCount: 0,
  trackCount: 0,
  coverUrl: "",
  updatedAt: "",
  jobId: "",
};

const Home = () => {
  const navigate = useNavigate();
  const sourceService = useSelectionStore((state) => state.sourceService);
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const setDestinationService = useSelectionStore(
    (state) => state.setDestinationService
  );
  const setSourceService = useSelectionStore((state) => state.setSourceService);
  const [connections, setConnections] = useState({
    spotify: false,
    youtube: false,
  });
  const [isPolling, setIsPolling] = useState(true);
  const [lastTransfer, setLastTransfer] = useState(initialCardState);
  const [lastTransferLoading, setLastTransferLoading] = useState(false);
  const [lastTransferError, setLastTransferError] = useState("");
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const pollingRef = useRef(null);
  const lastTransferTimestamp = useMemo(() => {
    if (!lastTransfer.updatedAt) {
      return null;
    }
    const parsed = new Date(lastTransfer.updatedAt);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }, [lastTransfer.updatedAt]);

  const resolveProviderKey = useCallback((serviceId) => {
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
  }, []);

  const sourceProviderValue = resolveProviderKey(sourceService);

  const navigateToPlaylists = useCallback(() => {
    if (!sourceProviderValue) {
      toast.error("Select a source platform first.");
      return;
    }

    clearSelection();
    setPendingNavigation(false);
    const target = encodeURIComponent(sourceProviderValue);
    navigate(`/auth/spotify/callback?source=${target}`);
  }, [clearSelection, navigate, sourceProviderValue]);

  const canProceedToPlaylists =
    sourceProviderValue === "spotify"
      ? connections.spotify
      : sourceProviderValue === "youtube"
      ? connections.youtube
      : false;

  const connectedProvidersList = CONNECTED_PROVIDERS.filter(
    (provider) => connections[provider]
  );

  const updateConnections = useCallback(() => {
    setConnections({
      spotify: isSpotifyConnected(),
      youtube: isYouTubeConnected(),
    });
  }, []);

  const openAuthWindow = useCallback(
    (provider) => {
      const width = 500;
      const height = 620;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const url =
        provider === "spotify"
          ? authApi.spotifyLoginUrl()
          : authApi.youtubeLoginUrl();
      const popup = window.open(
        url,
        "MatchMyTunesAuth",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!popup) {
        toast.error("Enable popups to connect your account.");
        return;
      }

      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          updateConnections();
        }
      }, 800);

      setTimeout(() => {
        clearInterval(interval);
        if (!popup.closed) {
          popup.close();
        }
      }, 300000);
    },
    [updateConnections]
  );

  useEffect(() => {
    updateConnections();
  }, [updateConnections]);

  useEffect(() => {
    setDestinationService(null);
  }, [setDestinationService]);

  useEffect(() => {
    const listener = (event) => {
      const allowedOrigins = [API_BASE_URL, window.location.origin];
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      if (event.data?.type !== "AUTH_SUCCESS") {
        return;
      }

      updateConnections();
      const provider = (event.data?.provider || "").toLowerCase();

      if (provider === "spotify") {
        setSpotifyConnected(true);
      }
      if (provider === "youtube") {
        setYouTubeConnected(true);
      }

      if (!pendingNavigation) {
        return;
      }

      if (!provider || provider !== sourceProviderValue) {
        return;
      }

      const providerConnected =
        provider === "spotify"
          ? isSpotifyConnected()
          : provider === "youtube"
          ? isYouTubeConnected()
          : false;

      if (providerConnected) {
        navigateToPlaylists();
      }
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [navigateToPlaylists, pendingNavigation, sourceProviderValue, updateConnections]);

  const fetchLastTransfer = useCallback(async () => {
    setLastTransferLoading(true);
    setLastTransferError("");

    try {
      const data = await transferApi.getLastTransfer();
      if (!data || typeof data !== "object") {
        throw new Error("No transfer activity found yet.");
      }

      const playlistCount = Number.isFinite(data?.totalPlaylists)
        ? data.totalPlaylists
        : Number.isFinite(data?.summary?.totalPlaylists)
        ? data.summary.totalPlaylists
        : 0;

      const trackCount = Number.isFinite(data?.totalTracks)
        ? data.totalTracks
        : Number.isFinite(data?.summary?.totalTracks)
        ? data.summary.totalTracks
        : 0;

      const coverUrl =
        data?.thumbnail ||
        data?.coverImage ||
        data?.tracks?.[0]?.thumbnail ||
        "";
      const jobId = data?.jobId || data?.id || "";

      setLastTransfer({
        playlistCount,
        trackCount,
        coverUrl,
        updatedAt:
          data?.updatedAt || data?.completedAt || data?.createdAt || "",
        jobId,
      });
    } catch (error) {
      setLastTransfer(initialCardState);
      setLastTransferError(error?.message || "Unable to load last transfer.");
    } finally {
      setLastTransferLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLastTransfer();
  }, [fetchLastTransfer]);

  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (isPolling) {
      pollingRef.current = setInterval(() => {
        fetchLastTransfer();
      }, 10000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchLastTransfer, isPolling]);

  const handleDisconnect = (provider) => {
    const confirmed = window.confirm("Disconnect this account?");
    if (!confirmed) {
      return;
    }

    if (provider === "spotify") {
      disconnectSpotify();
      toast.success("Spotify disconnected");
    }

    if (provider === "youtube") {
      disconnectYouTube();
      toast.success("YouTube disconnected");
    }

    if (resolveProviderKey(sourceService) === provider) {
      setSourceService(null);
    }

    setDestinationService(null);
    clearSelection();
    setPendingNavigation(false);
    updateConnections();
  };

  const handleSourcePick = (serviceId) => {
    if (!serviceId) {
      return;
    }

    setSourceService(serviceId);
    setPendingNavigation(false);
    setDestinationService(null);
    clearSelection();

    const selectedOption = SOURCE_OPTIONS.find((option) => option.id === serviceId);
    if (
      selectedOption?.supportsConnect &&
      CONNECTED_PROVIDERS.includes(selectedOption.provider)
    ) {
      const isConnected =
        selectedOption.provider === "spotify"
          ? connections.spotify
          : connections.youtube;
      if (!isConnected) {
        openAuthWindow(selectedOption.provider);
      }
    }
  };

  const handleGoToPlaylists = () => {
    if (!sourceService) {
      toast.error("Select a source platform first.");
      return;
    }

    const provider = resolveProviderKey(sourceService);
    if (!provider) {
      toast.error("This source is not supported yet.");
      return;
    }

    if (provider === "spotify" && !connections.spotify) {
      toast.error("Connect your Spotify account to continue.");
      setPendingNavigation(true);
      openAuthWindow("spotify");
      return;
    }

    if (provider === "youtube" && !connections.youtube) {
      toast.error("Connect your YouTube account to continue.");
      setPendingNavigation(true);
      openAuthWindow("youtube");
      return;
    }

    navigateToPlaylists();
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-sm border px-3 py-1 rounded-full border-gray-500 text-gray-300 inline-block">
              Playlist transfer, done right
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 leading-tight">
              Keep your playlists in sync,
              <br /> wherever you listen.
            </h1>
            <p className="text-gray-400 mt-4 max-w-md">
              Transfer your playlists between Spotify, YouTube, Apple Music and
              more — without losing tracks or order.
            </p>
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={handleGoToPlaylists}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-full transition duration-300"
              >
                Open quick setup
              </button>
              <button
                type="button"
                onClick={() => navigate("/about")}
                className="border border-white/20 hover:border-white/50 text-gray-200 px-6 py-3 rounded-full transition duration-300"
              >
                Learn more
              </button>
            </div>
            <div className="flex gap-10 mt-10 text-gray-300">
              <div>
                <h3 className="text-2xl font-bold">12M+</h3>
                <p className="text-sm text-gray-400">Playlists processed</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold">85+</h3>
                <p className="text-sm text-gray-400">Supported services</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-200">Quick setup</h3>
              <button
                type="button"
                onClick={() =>
                  setIsPolling((prev) => {
                    const next = !prev;
                    if (next) {
                      fetchLastTransfer();
                    }
                    return next;
                  })
                }
                className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full border ${
                  isPolling
                    ? "border-green-400 text-green-300"
                    : "border-gray-500 text-gray-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPolling ? "bg-green-400" : "bg-gray-400"
                  }`}
                />
                Sync {isPolling ? "ON" : "OFF"}
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {connectedProvidersList.length ? (
                connectedProvidersList.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleDisconnect(provider)}
                    className="px-3 py-1.5 rounded-full text-xs border border-red-400 text-red-300 hover:bg-red-400/10 transition"
                  >
                    Disconnect {PROVIDER_LABELS[provider]}
                  </button>
                ))
              ) : (
                <span className="text-xs text-gray-500">
                  Connect a service to manage connections here.
                </span>
              )}
            </div>

            <div className="grid gap-4 mt-4">
              <div className="relative border border-white/10 rounded-lg p-4">
                <span className="absolute -top-3 left-4 bg-[#0b0f19] border border-white/10 text-[11px] uppercase tracking-widest px-2 py-0.5 text-gray-400 rounded-full">
                  Step 1 · Source
                </span>
                <p className="text-xs text-gray-400 mb-3">
                  Pick where your playlists currently live.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {SOURCE_OPTIONS.map((option) => {
                    const isSelected = sourceService === option.id;
                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() => handleSourcePick(option.id)}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 border transition ${
                          isSelected
                            ? "border-purple-400 bg-purple-500/10"
                            : "border-white/10 hover:border-purple-300/50"
                        } ${option.supportsConnect ? "" : "opacity-70"}`}
                      >
                        <i className={`${option.iconClass} text-2xl`}></i>
                        <span className="text-xs text-gray-200 text-center leading-tight">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative border border-white/10 rounded-lg p-4">
                <span className="absolute -top-3 left-4 bg-[#0b0f19] border border-white/10 text-[11px] uppercase tracking-widest px-2 py-0.5 text-gray-400 rounded-full">
                  Step 2 · Playlists
                </span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-200">
                      {sourceProviderValue
                        ? `Connect ${PROVIDER_LABELS[sourceProviderValue]}`
                        : "Pick a source above"}
                    </p>
                    {sourceProviderValue ? (
                      <span
                        className={`text-xs ${
                          canProceedToPlaylists ? "text-green-300" : "text-orange-300"
                        }`}
                      >
                        {canProceedToPlaylists ? "Ready" : "Needs connection"}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-400">
                    Authenticate and load playlists from your source platform.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoToPlaylists}
                    disabled={!sourceProviderValue}
                    className={`w-full px-4 py-2 rounded-full text-sm font-semibold transition ${
                      !sourceProviderValue
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-70"
                        : canProceedToPlaylists
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-purple-500/30 text-purple-200 border border-purple-400/40 hover:border-purple-200"
                    }`}
                  >
                    View playlists
                  </button>
                </div>
              </div>

              <div className="relative border border-dashed border-white/10 rounded-lg p-4">
                <span className="absolute -top-3 left-4 bg-[#0b0f19] border border-white/10 text-[11px] uppercase tracking-widest px-2 py-0.5 text-gray-400 rounded-full">
                  Step 3 · Destination
                </span>
                <p className="text-xs text-gray-400">
                  Destination options unlock after you pick a playlist. Choose where to transfer on the next screen.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                {lastTransfer.coverUrl ? (
                  <img
                    src={lastTransfer.coverUrl}
                    alt="Last transfer cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No art</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-200">Last share</p>
                {lastTransferLoading ? (
                  <p className="text-xs text-gray-500">Refreshing...</p>
                ) : lastTransferError ? (
                  <p className="text-xs text-red-300">{lastTransferError}</p>
                ) : lastTransfer.playlistCount || lastTransfer.trackCount ? (
                  <p className="text-xs text-gray-400">
                    {lastTransfer.playlistCount} playlists ·{" "}
                    {lastTransfer.trackCount} tracks
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    No transfers yet. Start one to see details here.
                  </p>
                )}
              </div>
              <div className="text-right">
                {lastTransferTimestamp &&
                !lastTransferLoading &&
                !lastTransferError ? (
                  <p className="text-[11px] text-gray-500">
                    Updated {lastTransferTimestamp.toLocaleString()}
                  </p>
                ) : null}
                {lastTransfer.jobId ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/transfer/progress?jobId=${encodeURIComponent(
                          lastTransfer.jobId
                        )}`
                      )
                    }
                    className="mt-2 text-xs text-purple-300 hover:text-purple-200 underline"
                  >
                    View progress
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoToPlaylists}
              disabled={!sourceProviderValue}
              className={`w-full font-semibold py-3 rounded-full transition duration-300 ${
                !sourceProviderValue
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-70"
                  : canProceedToPlaylists
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-purple-500 hover:bg-purple-600 text-white"
              }`}
            >
              Continue to playlists
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center">How it works</h2>
          <p className="text-gray-400 text-center mt-2 max-w-lg mx-auto">
            A simple 3-step process to keep your playlists synced everywhere.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {["Connect services", "Select playlists", "Transfer & sync"].map(
              (title, index) => (
                <div
                  key={title}
                  className="bg-white/5 p-6 rounded-xl border border-white/10 transition duration-300 hover:-translate-y-1 hover:bg-white/10"
                >
                  <p className="text-gray-400 text-sm">0{index + 1}</p>
                  <h3 className="text-xl font-semibold mt-2">{title}</h3>
                  <p className="text-gray-400 mt-2">
                    We guide you through connecting services, choosing music,
                    and syncing it where you need it.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

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
              {
                title: "Smart matching",
                body: "We validate every match to avoid duplicates and missing songs.",
              },
              {
                title: "Auto sync",
                body: "Run scheduled syncs so new tracks are always copied over.",
              },
              {
                title: "Backups",
                body: "Export playlists for safekeeping in a single click.",
              },
              {
                title: "Team sharing",
                body: "Share curated playlists with your friends or team instantly.",
              },
              {
                title: "Analytics",
                body: "Understand overlap between libraries before you transfer.",
              },
              {
                title: "Bulk actions",
                body: "Move entire libraries with clear status tracking and retries.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white/5 p-6 rounded-xl border border-white/10 transition duration-300 hover:-translate-y-1 hover:bg-white/10"
              >
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-400 mt-2">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
