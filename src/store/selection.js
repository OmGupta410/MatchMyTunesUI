import { create } from 'zustand';

const sanitizePlaylist = (playlist) => {
  if (!playlist || typeof playlist.id !== 'string') {
    return null;
  }

  return {
    id: playlist.id,
    name: typeof playlist.name === 'string' ? playlist.name : 'Untitled playlist',
    image: playlist.image || undefined,
    trackCount: Number.isFinite(playlist.trackCount) ? playlist.trackCount : 0,
    type: typeof playlist.type === 'string' ? playlist.type : 'playlist',
  };
};

export const useSelectionStore = create((set, get) => ({
  selectedPlaylists: [],
  destinationService: null,
  sourceService: null,

  addPlaylist: (playlist) => {
    const safePlaylist = sanitizePlaylist(playlist);
    if (!safePlaylist) {
      return;
    }

    const { selectedPlaylists } = get();
    const alreadySelected = selectedPlaylists.some((item) => item.id === safePlaylist.id);
    if (alreadySelected) {
      return;
    }

    set({ selectedPlaylists: [...selectedPlaylists, safePlaylist] });
  },

  removePlaylist: (id) => {
    if (!id) {
      return;
    }

    set({ selectedPlaylists: get().selectedPlaylists.filter((item) => item.id !== id) });
  },

  togglePlaylist: (playlist) => {
    const safePlaylist = sanitizePlaylist(playlist);
    if (!safePlaylist) {
      return;
    }

    const { selectedPlaylists } = get();
    const exists = selectedPlaylists.some((item) => item.id === safePlaylist.id);

    if (exists) {
      set({ selectedPlaylists: selectedPlaylists.filter((item) => item.id !== safePlaylist.id) });
    } else {
      set({ selectedPlaylists: [...selectedPlaylists, safePlaylist] });
    }
  },

  isSelected: (id) => {
    if (!id) {
      return false;
    }

    return get().selectedPlaylists.some((item) => item.id === id);
  },

  clearSelection: () => {
    set({ selectedPlaylists: [] });
  },

  setDestinationService: (service) => {
    set({ destinationService: service || null });
  },

  setSourceService: (service) => {
    set({ sourceService: service || null });
  },
}));
