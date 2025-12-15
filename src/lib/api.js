import axios from "axios";

export const API_BASE_URL = "https://matchmytunes.onrender.com";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const resolveStorage = (name) => {
  if (typeof window === "undefined") {
    return noopStorage;
  }

  try {
    return window[name] || noopStorage;
  } catch (error) {
    console.warn(`Storage ${name} unavailable`, error);
    return noopStorage;
  }
};

const sessionStore = resolveStorage("sessionStorage");
const localStore = resolveStorage("localStorage");

export const getStoredToken = () => {
  return sessionStore.getItem("jwt") || localStore.getItem("jwt");
};

export const persistToken = (token) => {
  if (!token) {
    return;
  }
  sessionStore.setItem("jwt", token);
  localStore.setItem("jwt", token);
};

export const removeStoredToken = () => {
  sessionStore.removeItem("jwt");
  localStore.removeItem("jwt");
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

const buildApiError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const message =
    data?.message ||
    data?.error ||
    error?.message ||
    "Something went wrong while contacting the server.";

  if (status === 401) {
    removeStoredToken();
  }

  const apiError = new Error(message);
  apiError.status = status;
  apiError.data = data;
  apiError.isApiError = true;
  return apiError;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(buildApiError(error))
);

const unwrap = async (promise) => {
  const response = await promise;
  return response?.data;
};

export const authApi = {
  login: (credentials) => unwrap(apiClient.post("/api/account/login", credentials)),
  register: (payload) => unwrap(apiClient.post("/api/account/register", payload)),
  spotifyLoginUrl: () => `${API_BASE_URL}/api/auth/spotify/login`,
  youtubeLoginUrl: () => `${API_BASE_URL}/api/auth/youtube/login`,
  spotifyCallback: (code) => unwrap(apiClient.get("/api/auth/spotify/callback", { params: { code } })),
  youtubeCallback: (code) => unwrap(apiClient.get("/api/auth/youtube/callback", { params: { code } })),
};

export const playlistApi = {
  getSpotifyPlaylists: () => unwrap(apiClient.get("/api/playlists/spotify")),
  getYouTubePlaylists: () => unwrap(apiClient.get("/api/playlists/youtube")),
  getSpotifyPlaylistTracks: (playlistId) =>
    unwrap(apiClient.get(`/api/playlists/spotify/${playlistId}/tracks`)),
  getYouTubePlaylistTracks: (playlistId) =>
    unwrap(apiClient.get(`/api/playlists/youtube/${playlistId}/tracks`)),
};

export const transferApi = {
  startTransfer: (payload) => unwrap(apiClient.post("/api/transfer", payload)),
  getLastTransfer: () => unwrap(apiClient.get("/api/transfer/last")),
  getTransferStatus: (jobId) => unwrap(apiClient.get(`/api/transfer/${jobId}/status`)),
};

export { apiClient };
