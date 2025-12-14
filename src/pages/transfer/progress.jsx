import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { transferApi } from "../../lib/api.js";
import { useSelectionStore } from "../../store/selection.js";

const POLL_INTERVAL_MS = 3000;

const deriveCounts = (payload) => {
  if (!payload || typeof payload !== "object") {
    return {
      status: "pending",
      processed: 0,
      total: 0,
      failed: 0,
      successes: 0,
      completed: false,
      failures: [],
    };
  }

  const status = (payload.status || payload.state || "pending").toLowerCase();
  const summary = payload.summary || {};
  const progress = payload.progress || {};

  const totalTracks =
    Number.isFinite(progress.totalTracks)
      ? progress.totalTracks
      : Number.isFinite(summary.totalTracks)
      ? summary.totalTracks
      : Number.isFinite(payload.totalTracks)
      ? payload.totalTracks
      : Number.isFinite(payload.expectedTrackCount)
      ? payload.expectedTrackCount
      : 0;

  const processedTracks =
    Number.isFinite(progress.processedTracks)
      ? progress.processedTracks
      : Number.isFinite(summary.completedTracks)
      ? summary.completedTracks
      : Number.isFinite(payload.completedTracks)
      ? payload.completedTracks
      : Number.isFinite(payload.transferredTracks)
      ? payload.transferredTracks
      : 0;

  const failedTracks =
    Number.isFinite(summary.failedTracks)
      ? summary.failedTracks
      : Number.isFinite(payload.failedTracks)
      ? payload.failedTracks
      : Array.isArray(payload.failures)
      ? payload.failures.length
      : 0;

  const successes = processedTracks - failedTracks >= 0 ? processedTracks - failedTracks : 0;

  const failures = Array.isArray(payload.failures)
    ? payload.failures.map((failure) => ({
        id: failure.id || failure.trackId || failure.videoId || failure.uri || Math.random().toString(36),
        title: failure.title || failure.name || failure.trackTitle || "Unknown track",
        reason: failure.reason || failure.error || "Unknown error",
        artist: failure.artist || failure.channelTitle || failure.trackArtist || "",
      }))
    : [];

  return {
    status,
    processed: processedTracks,
    total: totalTracks,
    failed: failedTracks,
    successes,
    completed: ["completed", "complete", "done", "finished"].includes(status),
    failures,
  };
};

const TransferProgress = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    lastTransferJob,
    setLastTransferJob,
    activeJobStatus,
    setActiveJobStatus,
    clearTransferState,
  } = useSelectionStore();

  const [jobId, setJobId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusPayload, setStatusPayload] = useState(null);
  const pollingRef = useRef(null);

  const resolvedCounts = useMemo(() => deriveCounts(statusPayload), [statusPayload]);

  const fetchStatus = useCallback(
    async (id) => {
      if (!id) {
        return;
      }
      try {
        const response = await transferApi.getTransferStatus(id);
        if (!response || typeof response !== "object") {
          throw new Error("Unexpected status response");
        }
        setStatusPayload(response);
        setError("");
        const counts = deriveCounts(response);
        setActiveJobStatus({ jobId: id, status: counts.status, summary: counts });
        if (counts.completed || counts.status === "failed" || counts.status === "error") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch (err) {
        const message = err?.message || "Failed to fetch transfer status";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [setActiveJobStatus]
  );

  useEffect(() => {
    const paramJobId = searchParams.get("jobId");
    const effectiveJobId = paramJobId || lastTransferJob || "";

    if (!effectiveJobId) {
      if (activeJobStatus?.status === "starting") {
        setLoading(true);
        setError("");
        return;
      }
      toast.error("Transfer job not found. Start a new transfer.");
      navigate("/transfer/setup");
      return;
    }

    setJobId(effectiveJobId);
    setLastTransferJob(effectiveJobId);
    fetchStatus(effectiveJobId);

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    pollingRef.current = setInterval(() => {
      fetchStatus(effectiveJobId);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activeJobStatus?.status, fetchStatus, lastTransferJob, navigate, searchParams, setLastTransferJob]);

  const handleBackHome = () => {
    clearTransferState();
    navigate("/");
  };

  const handleRetry = () => {
    if (jobId) {
      setLoading(true);
      fetchStatus(jobId);
    }
  };
 
  const progressPercent = useMemo(() => {
    if (!resolvedCounts.total) {
      return 0;
    }
    const ratio = resolvedCounts.processed / resolvedCounts.total;
    if (!Number.isFinite(ratio)) {
      return 0;
    }
    return Math.min(100, Math.max(0, Math.round(ratio * 100)));
  }, [resolvedCounts.processed, resolvedCounts.total]);

  const statusLabel = useMemo(() => {
    const raw = resolvedCounts.status;
    if (!raw) {
      return "Pending";
    }
    switch (raw) {
      case "pending":
      case "queued":
        return "Queued";
      case "processing":
      case "running":
        return "Processing";
      case "completed":
      case "complete":
        return "Completed";
      case "failed":
      case "error":
        return "Failed";
      default:
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
  }, [resolvedCounts.status]);

  const hasFailures = resolvedCounts.failed > 0 && resolvedCounts.failures.length;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#050b2c] text-white py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-2 text-center">
          <span className="px-3 py-1 text-xs border border-white/10 rounded-full text-gray-300 uppercase tracking-widest">
            Transfer progress
          </span>
          <h1 className="text-3xl font-semibold">Tracking your playlist move</h1>
          <p className="text-gray-400 text-sm">
            Job <strong>{jobId || ""}</strong>
          </p>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">Current status</p>
              <p className="text-xl font-semibold text-white">{statusLabel}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="px-4 py-2 rounded-full border border-white/20 text-sm text-white hover:border-white/40 transition"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={handleBackHome}
                className="px-4 py-2 rounded-full bg-purple-500 hover:bg-purple-600 text-sm font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-300">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-xs uppercase text-gray-400">Total tracks</p>
                <p className="text-lg font-semibold">{resolvedCounts.total}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-xs uppercase text-gray-400">Transferred</p>
                <p className="text-lg font-semibold text-green-400">{resolvedCounts.successes}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-xs uppercase text-gray-400">Failed</p>
                <p className="text-lg font-semibold text-red-400">{resolvedCounts.failed}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-gray-400">Checking transfer status...</div>
          ) : error ? (
            <div className="text-sm text-red-300">{error}</div>
          ) : null}
        </section>

        {hasFailures ? (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold mb-4">Tracks that need attention</h2>
            <ul className="space-y-3">
              {resolvedCounts.failures.map((failure) => (
                <li key={failure.id} className="border border-red-400/30 bg-red-400/5 rounded-lg p-4">
                  <p className="text-sm font-semibold text-white">{failure.title}</p>
                  <p className="text-xs text-gray-300">{failure.artist || "Unknown artist"}</p>
                  <p className="text-xs text-red-300 mt-1">{failure.reason}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : resolvedCounts.completed ? (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl text-center space-y-2">
            <h2 className="text-xl font-semibold text-green-300">Transfer completed</h2>
            <p className="text-gray-300 text-sm">
              {resolvedCounts.successes} track{resolvedCounts.successes === 1 ? "" : "s"} moved successfully.
              {resolvedCounts.failed ? ` ${resolvedCounts.failed} track${resolvedCounts.failed === 1 ? "" : "s"} need review.` : ""}
            </p>
          </section>
        ) : null}

        {activeJobStatus?.status && !loading && !error ? (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-gray-400">
            <p>
              Last update: <span className="text-white">{new Date().toLocaleTimeString()}</span>
            </p>
            <p className="mt-1">
              Status cached locally. You can close this tab and return to track progress later.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default TransferProgress;
