import { create } from "zustand";

/**
 * Zustand store for managing playlist selections and destination service choice.
 */
export const useSelectionStore = create((set, get) => ({
  selectedPlaylists: [],
  destinationService: null,
  sourceService: "spotify",
  lastTransferJob: null,
  activeJobStatus: null,

  setLastTransferJob: (job) => {
    set({ lastTransferJob: job || null });
  },

  setActiveJobStatus: (status) => {
    set({ activeJobStatus: status || null });
  },

  hasSelection: () => {
    return get().selectedPlaylists.length > 0;
  },

  addPlaylist: (playlist) => {
    const { selectedPlaylists } = get();
    if (!playlist?.id) {
      return;
    }
    if (!selectedPlaylists.find((item) => item.id === playlist.id)) {
      set({ selectedPlaylists: [...selectedPlaylists, playlist] });
    }
  },

  removePlaylist: (id) => {
    if (!id) {
      return;
    }
    set({ selectedPlaylists: get().selectedPlaylists.filter((playlist) => playlist.id !== id) });
  },

  togglePlaylist: (playlist) => {
    if (!playlist?.id) {
      return;
    }
    const { selectedPlaylists } = get();
    const exists = selectedPlaylists.find((item) => item.id === playlist.id);
    if (exists) {
      set({ selectedPlaylists: selectedPlaylists.filter((item) => item.id !== playlist.id) });
    } else {
      set({ selectedPlaylists: [...selectedPlaylists, playlist] });
    }
  },

  isSelected: (id) => {
    if (!id) {
      return false;
    }
    return get().selectedPlaylists.some((playlist) => playlist.id === id);
  },

  clearSelection: () => {
    set({ selectedPlaylists: [] });
  },

  setDestinationService: (service) => {
    set({ destinationService: service });
  },

  setSourceService: (service) => {
    set({ sourceService: service || "spotify" });
  },

  getSourceProvider: () => {
    const { sourceService } = get();
    if (!sourceService) {
      return "";
    }
    if (sourceService.includes("spotify")) {
      return "spotify";
    }
    if (sourceService.includes("youtube")) {
      return "youtube";
    }
    return sourceService;
  },

  clearTransferState: () => {
    set({ lastTransferJob: null, activeJobStatus: null });
  },
}));
