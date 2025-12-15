import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from '../../lib/spotify';
import toast from 'react-hot-toast';

const COMPLETED_STATUSES = new Set(['completed', 'success', 'finished', 'done']);
const FAILED_STATUSES = new Set(['failed', 'error', 'cancelled', 'canceled', 'aborted']);

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
  const [jobStatuses, setJobStatuses] = useState({});
  const jobPollersRef = useRef({});
  const syntheticProgressIntervalsRef = useRef({});
  const componentUnmountedRef = useRef(false);

  const updateJobStatus = useCallback((playlistId, partial) => {
    if (!playlistId) {
      return;
    }

    if (componentUnmountedRef.current) {
      return;
    }

    setJobStatuses((previousState) => {
      const existing = previousState[playlistId] || {};
      const merged = { ...existing, ...partial };

      if (partial.status && typeof partial.status === 'string') {
        merged.status = partial.status.toLowerCase();
        merged.statusLabel = partial.status;
      } else if (!partial.status && existing.status && merged.status !== existing.status) {
        merged.status = existing.status;
      }

      if (partial.statusLabel && typeof partial.statusLabel === 'string' && !partial.status) {
        merged.statusLabel = partial.statusLabel;
      } else if (!merged.statusLabel && existing.statusLabel) {
        merged.statusLabel = existing.statusLabel;
      }

      if (typeof partial.syntheticProgress === 'boolean') {
        merged.syntheticProgress = partial.syntheticProgress;
      } else if (typeof merged.syntheticProgress !== 'boolean' && typeof existing.syntheticProgress === 'boolean') {
        merged.syntheticProgress = existing.syntheticProgress;
      }

      return {
        ...previousState,
        [playlistId]: merged,
      };
    });
  }, []);

  const clearJobPoller = useCallback((jobId) => {
    if (!jobId) {
      return;
    }

    const poller = jobPollersRef.current[jobId];
    if (poller) {
      clearInterval(poller);
      delete jobPollersRef.current[jobId];
    }
  }, []);

  const stopSyntheticProgress = useCallback((playlistId) => {
    if (!playlistId) {
      return;
    }

    const intervalId = syntheticProgressIntervalsRef.current[playlistId];
    if (intervalId) {
      clearInterval(intervalId);
      delete syntheticProgressIntervalsRef.current[playlistId];
    }
  }, []);

  const ensureSyntheticProgress = useCallback((playlistId) => {
    if (!playlistId) {
      return;
    }

    if (syntheticProgressIntervalsRef.current[playlistId]) {
      return;
    }

    syntheticProgressIntervalsRef.current[playlistId] = setInterval(() => {
      if (componentUnmountedRef.current) {
        stopSyntheticProgress(playlistId);
        return;
      }

      setJobStatuses((previous) => {
        const job = previous[playlistId];
        if (!job) {
          stopSyntheticProgress(playlistId);
          return previous;
        }

        const normalizedStatus = typeof job.status === 'string' ? job.status.toLowerCase() : job.status;
        if (
          (normalizedStatus && (COMPLETED_STATUSES.has(normalizedStatus) || FAILED_STATUSES.has(normalizedStatus))) ||
          (typeof job.progress === 'number' && job.progress >= 90)
        ) {
          stopSyntheticProgress(playlistId);
          return previous;
        }

        const currentProgress = typeof job.progress === 'number' ? job.progress : 0;
        const nextStep = Math.min(90, Math.max(10, Math.ceil((currentProgress || 0) / 10) * 10));
        const computedNext = nextStep <= currentProgress ? Math.min(90, currentProgress + 10) : nextStep;

        const updatedJob = {
          ...job,
          progress: computedNext,
          message: job.message || 'Transferring...',
          status: job.status || 'processing',
          statusLabel: job.statusLabel || 'processing',
          syntheticProgress: true,
        };

        return {
          ...previous,
          [playlistId]: updatedJob,
        };
      });
    }, 1000);
  }, [stopSyntheticProgress]);

  useEffect(() => {
    componentUnmountedRef.current = false;

    return () => {
      componentUnmountedRef.current = true;
      Object.values(jobPollersRef.current).forEach((intervalId) => {
        clearInterval(intervalId);
      });
      jobPollersRef.current = {};

      Object.values(syntheticProgressIntervalsRef.current).forEach((intervalId) => {
        clearInterval(intervalId);
      });
      syntheticProgressIntervalsRef.current = {};
    };
  }, []);

  const transferProgress = useMemo(() => {
    const jobs = Object.values(jobStatuses);

    if (jobs.length === 0) {
      return {
        overallPercent: 0,
        completed: 0,
        failed: 0,
        total: 0,
        activeJob: null,
      };
    }

    let progressAccumulator = 0;
    let completed = 0;
    let failed = 0;
    let activeJob = null;

    for (const job of jobs) {
      const normalizedStatus = typeof job.status === 'string' ? job.status.toLowerCase() : job.status;

      if (normalizedStatus && COMPLETED_STATUSES.has(normalizedStatus)) {
        completed += 1;
      }

      if (normalizedStatus && FAILED_STATUSES.has(normalizedStatus)) {
        failed += 1;
      }

      const jobProgress = typeof job.progress === 'number'
        ? Math.min(100, Math.max(0, job.progress))
        : normalizedStatus && COMPLETED_STATUSES.has(normalizedStatus)
          ? 100
          : 0;

      progressAccumulator += jobProgress;

      if (!activeJob) {
        if (!normalizedStatus) {
          activeJob = job;
        } else if (!COMPLETED_STATUSES.has(normalizedStatus) && !FAILED_STATUSES.has(normalizedStatus)) {
          activeJob = job;
        }
      }
    }

    const averageProgress = Math.round(progressAccumulator / jobs.length);

    return {
      overallPercent: Math.min(100, Math.max(0, averageProgress)),
      completed,
      failed,
      total: jobs.length,
      activeJob,
    };
  }, [jobStatuses]);

  useEffect(() => {
    Object.entries(jobStatuses).forEach(([playlistId, job]) => {
      const normalizedStatus = typeof job.status === 'string' ? job.status.toLowerCase() : job.status;
      const jobFinished = normalizedStatus && (COMPLETED_STATUSES.has(normalizedStatus) || FAILED_STATUSES.has(normalizedStatus));
      const hasApiProgress =
        !job.syntheticProgress &&
        (
          (typeof job.totalTracks === 'number' && job.totalTracks > 0) ||
          (typeof job.processedTracks === 'number' && job.processedTracks > 0) ||
          (typeof job.progress === 'number' && job.progress > 0)
        );

      if (jobFinished || !transferring) {
        stopSyntheticProgress(playlistId);
        return;
      }

      if (hasApiProgress) {
        stopSyntheticProgress(playlistId);
        return;
      }

      ensureSyntheticProgress(playlistId);
    });

    if (!transferring) {
      Object.keys(jobStatuses).forEach((playlistId) => {
        stopSyntheticProgress(playlistId);
      });
    }
  }, [ensureSyntheticProgress, jobStatuses, stopSyntheticProgress, transferring]);

  const parseProgressFromStatus = useCallback((statusPayload) => {
    if (!statusPayload || typeof statusPayload !== 'object') {
      return {
        progressPercent: 0,
        processedTracks: 0,
        totalTracks: 0,
        message: '',
      };
    }

    const totalCandidates = [
      statusPayload.totalTracks,
      statusPayload.total_tracks,
      statusPayload.total,
      statusPayload.tracksTotal,
      statusPayload.trackTotal,
      statusPayload.targetCount,
    ];

    const processedCandidates = [
      statusPayload.processedTracks,
      statusPayload.processed_tracks,
      statusPayload.processed,
      statusPayload.completed,
      statusPayload.completedTracks,
      statusPayload.tracksProcessed,
      statusPayload.current,
    ];

    const totalTracks = totalCandidates.find((value) => typeof value === 'number' && !Number.isNaN(value)) || 0;
    const processedTracks = processedCandidates.find((value) => typeof value === 'number' && !Number.isNaN(value)) || 0;

    let progressPercent = 0;
    if (typeof statusPayload.progress === 'number') {
      const rawProgress = statusPayload.progress <= 1 ? statusPayload.progress * 100 : statusPayload.progress;
      progressPercent = Math.round(Math.min(100, Math.max(0, rawProgress)));
    } else if (totalTracks > 0) {
      progressPercent = Math.round(Math.min(1, processedTracks / totalTracks) * 100);
    }

    const message = typeof statusPayload.message === 'string'
      ? statusPayload.message
      : typeof statusPayload.stage === 'string'
        ? statusPayload.stage
        : '';

    return {
      progressPercent,
      processedTracks,
      totalTracks,
      message,
    };
  }, []);

  const pollTransferJob = useCallback(
    (jobId, playlist, token) => {
      if (!jobId || !token) {
        return Promise.resolve(null);
      }

      return new Promise((resolve, reject) => {
        const playlistId = playlist?.id;
        const playlistName = playlist?.name || 'Playlist';
        let consecutiveFailures = 0;

        const poll = async () => {
          try {
            const statusResponse = await fetch(
              `https://matchmytunes.onrender.com/api/transfer/${jobId}/status`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!statusResponse.ok) {
              throw new Error(`HTTP ${statusResponse.status}`);
            }

            const statusData = await statusResponse.json().catch(() => ({}));
            const normalizedStatus =
              typeof statusData.status === 'string' ? statusData.status.toLowerCase() : undefined;

            const { progressPercent, processedTracks, totalTracks, message } =
              parseProgressFromStatus(statusData);

            consecutiveFailures = 0;

            updateJobStatus(playlistId, {
              jobId,
              playlistName,
              status: normalizedStatus || statusData.status || 'processing',
              statusLabel: statusData.status || 'processing',
              progress: progressPercent,
              processedTracks,
              totalTracks,
              message,
              lastUpdatedAt: Date.now(),
              syntheticProgress: false,
            });

            const isComplete =
              (normalizedStatus && COMPLETED_STATUSES.has(normalizedStatus)) ||
              statusData.isComplete === true ||
              statusData.finished === true;

            const isFailed =
              (normalizedStatus && FAILED_STATUSES.has(normalizedStatus)) ||
              statusData.failed === true ||
              statusData.error === true;

            if (isComplete) {
              clearJobPoller(jobId);
              updateJobStatus(playlistId, {
                jobId,
                playlistName,
                status: 'completed',
                statusLabel: statusData.status || 'completed',
                progress: 100,
                processedTracks: totalTracks || processedTracks,
                totalTracks: totalTracks || processedTracks,
                message: message || 'Transfer completed',
                syntheticProgress: false,
              });
              resolve(statusData);
              return;
            }

            if (isFailed) {
              clearJobPoller(jobId);
              updateJobStatus(playlistId, {
                jobId,
                playlistName,
                status: 'failed',
                statusLabel: statusData.status || 'failed',
                progress: progressPercent,
                processedTracks,
                totalTracks,
                message:
                  (statusData && statusData.message) || message || 'Transfer failed',
                syntheticProgress: false,
              });
              reject(statusData);
              return;
            }
          } catch (error) {
            if (consecutiveFailures < 2) {
              consecutiveFailures += 1;
              return;
            }

            updateJobStatus(playlistId, {
              jobId,
              playlistName,
              status: 'failed',
              statusLabel: 'failed',
              progress: 0,
              message:
                error instanceof Error
                  ? error.message
                  : 'Transfer status polling failed',
              syntheticProgress: false,
            });

            clearJobPoller(jobId);
            reject(error);
          }
        };

        poll();
        clearJobPoller(jobId);
        jobPollersRef.current[jobId] = setInterval(poll, 2000);
      });
    },
    [clearJobPoller, parseProgressFromStatus, updateJobStatus]
  );

  const activeJobMessage = useMemo(() => {
    const job = transferProgress.activeJob;

    if (!job) {
      return '';
    }

    const name = job.playlistName || 'Playlist';
    const processedTracks =
      typeof job.processedTracks === 'number' && !Number.isNaN(job.processedTracks)
        ? job.processedTracks
        : null;
    const totalTracks =
      typeof job.totalTracks === 'number' && !Number.isNaN(job.totalTracks)
        ? job.totalTracks
        : null;

    if (totalTracks && totalTracks > 0 && processedTracks !== null) {
      return `Processing "${name}" — ${processedTracks}/${totalTracks} tracks`;
    }

    if (processedTracks !== null && processedTracks > 0) {
      return `Processing "${name}" — ${processedTracks} tracks processed`;
    }

    if (job.message) {
      return `Processing "${name}" — ${job.message}`;
    }

    return `Processing "${name}"`;
  }, [transferProgress]);

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

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state === 'youtube') {
      handleYouTubeCallback(code)
        .then(() => {
          window.history.replaceState({}, '', window.location.pathname);
          toast.success('YouTube connected successfully!');
        })
        .catch((error) => {
          const message = error && error.message ? error.message : 'Unknown error';
          toast.error(`Failed to connect YouTube: ${message}`);
        });
    }
  }, [searchParams]);

  const services = useMemo(
    () => [
      {
        id: 'spotify',
        name: 'Spotify',
        connected: isSpotifyConnected(),
        icon: (
          <svg className="w-10 h-10" fill="#1DB954" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.299.181-.539.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        ),
      },
      {
        id: 'youtube-music',
        name: 'YouTube Music',
        connected: isYouTubeConnected(),
        icon: (
          <svg className="w-10 h-10" fill="#FF0000" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        ),
      },
      {
        id: 'apple-music',
        name: 'Apple Music',
        connected: false,
        icon: (
          <svg className="w-10 h-10" fill="#FA243C" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.896 3.823c1.97 0 3.57 1.6 3.57 3.57s-1.6 3.57-3.57 3.57-3.57-1.6-3.57-3.57 1.6-3.57 3.57-3.57zM12 5.23c-1.133 0-2.05.917-2.05 2.05 0 1.131.917 2.05 2.05 2.05 1.131 0 2.05-.919 2.05-2.05 0-1.133-.919-2.05-2.05-2.05zm-1.35 8.48c-2.326 0-4.21-1.884-4.21-4.21h1.5c0 1.495 1.215 2.71 2.71 2.71s2.71-1.215 2.71-2.71h1.5c0 2.326-1.884 4.21-4.21 4.21zm.675 4.375c-1.137 0-2.059.921-2.059 2.057 0 1.138.922 2.059 2.059 2.059 1.136 0 2.056-.921 2.056-2.059 0-1.136-.92-2.057-2.056-2.057z" />
          </svg>
        ),
      },
      {
        id: 'youtube',
        name: 'YouTube',
        connected: isYouTubeConnected(),
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
      {
        id: 'deezer',
        name: 'Deezer',
        connected: false,
        icon: (
          <svg className="w-10 h-10" fill="#00C7F2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4z" />
          </svg>
        ),
      },
      {
        id: 'soundcloud',
        name: 'SoundCloud',
        connected: false,
        icon: (
          <svg className="w-10 h-10" fill="#FF5500" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4z" />
          </svg>
        ),
      },
      {
        id: 'tidal',
        name: 'TIDAL',
        connected: false,
        icon: (
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded flex items-center justify-center text-white font-bold" aria-hidden="true">
            T
          </div>
        ),
      },
    ],
    []
  );

  const handleServiceSelect = (serviceId) => {
    if (!serviceId) {
      return;
    }

    if (serviceId === 'spotify') {
      setFromService('spotify');
      return;
    }

    if ((serviceId === 'youtube' || serviceId === 'youtube-music') && !isYouTubeConnected()) {
      window.location.href = 'https://matchmytunes.onrender.com/api/auth/youtube/login';
      return;
    }

    setToService(serviceId);
  };

  const handleDisconnectSpotify = () => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect your Spotify account? You will need to reconnect to continue.'
    );

    if (!confirmed) {
      return;
    }

    disconnectSpotify();
    toast.success('Spotify disconnected successfully');
    navigate('/');
  };

  const handleDisconnectYouTube = () => {
    const confirmed = window.confirm('Are you sure you want to disconnect your YouTube account?');
    if (!confirmed) {
      return;
    }

    disconnectYouTube();
    toast.success('YouTube disconnected successfully');
    window.location.reload();
  };

  const handleReconnectSpotify = () => {
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
    window.location.href = 'https://matchmytunes.onrender.com/api/auth/youtube/login';
  };

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
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error('Please login first');
      navigate('/');
      return;
    }

    setJobStatuses({});
    setTransferring(true);

    try {
      const results = [];

      for (const playlist of playlistsSelection) {
        const playlistId = playlist?.id;
        const playlistName =
          playlist?.name || (playlistId ? `Playlist ${playlistId}` : 'Unknown playlist');

        try {
          if (!playlist || !playlistId) {
            results.push({
              success: false,
              playlistName: playlistName,
              error: 'Invalid playlist ID',
            });
            continue;
          }

          if (playlistId.startsWith('favorite-')) {
            console.warn('Skipping favorite item:', playlistId);
            updateJobStatus(playlistId, {
              playlistName,
              status: 'failed',
              statusLabel: 'failed',
              progress: 0,
              message:
                'Favorite items cannot be transferred as playlists. Please select actual playlists.',
              syntheticProgress: false,
            });

            results.push({
              success: false,
              playlistName,
              error: 'Favorite items cannot be transferred as playlists. Please select actual playlists.',
            });

            toast.error(
              `"${playlist.name || 'Favorite item'}" cannot be transferred - select actual playlists only`,
              { duration: 4000 }
            );
            continue;
          }

          updateJobStatus(playlistId, {
            jobId: null,
            playlistName,
            status: 'starting',
            statusLabel: 'starting',
            progress: 0,
            processedTracks: 0,
            totalTracks: 0,
            message: 'Starting transfer...',
            syntheticProgress: false,
          });

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
          const jobId =
            responseData?.jobId ||
            responseData?.job_id ||
            responseData?.id ||
            (responseData?.job && (responseData.job.id || responseData.job.jobId));

          if (!response.ok) {
            const errorMessage =
              (responseData && (responseData.message || responseData.error)) ||
              `HTTP ${response.status}: Failed to transfer ${playlistName}`;

            updateJobStatus(playlistId, {
              jobId,
              playlistName,
              status: 'failed',
              statusLabel: 'failed',
              progress: 0,
              message: errorMessage,
              syntheticProgress: false,
            });

            console.error('Transfer failed for playlist:', playlistName, errorMessage);
            results.push({
              success: false,
              playlistName,
              error: errorMessage,
            });

            toast.error(`Failed to transfer "${playlistName}": ${errorMessage}`, {
              duration: 5000,
            });
            continue;
          }

          if (jobId) {
            updateJobStatus(playlistId, {
              jobId,
              playlistName,
              status: 'queued',
              statusLabel: responseData.status || 'queued',
              progress: 0,
              message: 'Waiting for transfer to start...',
              syntheticProgress: false,
            });

            try {
              const jobResult = await pollTransferJob(jobId, playlist, token);
              const resultPayload =
                jobResult && Object.keys(jobResult).length > 0 ? jobResult : responseData;

              results.push({
                success: true,
                playlistName,
                data: resultPayload,
              });

              toast.success(`Transferred "${playlistName}"`, { duration: 3000 });
            } catch (pollError) {
              const pollErrorMessage =
                (pollError && pollError.message) ||
                (pollError && pollError.error) ||
                'Transfer failed while processing';

              updateJobStatus(playlistId, {
                jobId,
                playlistName,
                status: 'failed',
                statusLabel: 'failed',
                progress: 0,
                message: pollErrorMessage,
                syntheticProgress: false,
              });

              console.error('Transfer job failed:', playlistName, pollError);
              results.push({
                success: false,
                playlistName,
                error: pollErrorMessage,
              });

              toast.error(`Failed to transfer "${playlistName}": ${pollErrorMessage}`, {
                duration: 5000,
              });
            } finally {
              clearJobPoller(jobId);
            }
          } else {
            updateJobStatus(playlistId, {
              jobId: null,
              playlistName,
              status: 'completed',
              statusLabel: responseData.status || 'completed',
              progress: 100,
              processedTracks: responseData?.totalTracks || 0,
              totalTracks: responseData?.totalTracks || 0,
              message: responseData?.message || 'Transfer completed',
              syntheticProgress: false,
            });

            results.push({
              success: true,
              playlistName,
              data: responseData,
            });

            toast.success(`Transferred "${playlistName}"`, { duration: 3000 });
          }
        } catch (error) {
          const message = error && error.message ? error.message : 'Unknown error';

          if (playlistId) {
            updateJobStatus(playlistId, {
              jobId: null,
              playlistName,
              status: 'failed',
              statusLabel: 'failed',
              progress: 0,
              message,
              syntheticProgress: false,
            });
          }

          console.error('Error transferring playlist:', playlist?.name, error);
          results.push({
            success: false,
            playlistName,
            error: message,
          });

          toast.error(`Error transferring "${playlistName}": ${message}`, {
            duration: 5000,
          });
        }
      }

      const successful = results.filter((result) => result.success).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(
          `Successfully transferred ${successful} playlist(s)!${
            failed > 0 ? ` ${failed} failed.` : ''
          } Check your ${toService === 'youtube-music' ? 'YouTube Music' : 'YouTube'} library.`,
          { duration: 7000 }
        );

        setTimeout(() => {
          const message =
            toService === 'youtube-music'
              ? "Playlists should appear in your YouTube Music library. If you don't see them, try refreshing the app or check your YouTube account."
              : 'Playlists should appear in your YouTube account. Check the "Library" section in YouTube or YouTube Music.';
          toast.info(message, { duration: 8000 });
        }, 2000);
      }

      if (failed > 0) {
        console.error('Failed transfers:', results.filter((result) => !result.success));
        toast.error(`${failed} playlist(s) failed to transfer. Check console for details.`, {
          duration: 7000,
        });
      }

      console.log('Transfer Summary:', {
        total: playlistsSelection.length,
        successful,
        failed,
        results,
      });

      if (successful > 0) {
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      const message = error && error.message ? error.message : 'Failed to initiate transfer';
      toast.error(message, { duration: 5000 });
    } finally {
      Object.keys(jobPollersRef.current).forEach((jobId) => {
        clearJobPoller(jobId);
      });
      Object.keys(syntheticProgressIntervalsRef.current).forEach((playlistId) => {
        stopSyntheticProgress(playlistId);
      });
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
            {transferring ? 'Transferring...' : 'Launch transfer'}
          </button>

          {transferring && transferProgress.total > 0 && (
            <div className="w-full max-w-md">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-green-500 transition-all duration-500 ease-out"
                  style={{ width: `${transferProgress.overallPercent}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-gray-300 text-center">
                Completed {transferProgress.completed} of {transferProgress.total} playlist
                {transferProgress.total !== 1 ? 's' : ''} ({transferProgress.overallPercent}%)
              </p>
              {activeJobMessage && (
                <p className="mt-1 text-xs text-gray-400 text-center">{activeJobMessage}</p>
              )}
            </div>
          )}

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
