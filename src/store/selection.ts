import { create } from 'zustand';

interface PlaylistSelection {
  id: string;
  name: string;
  image?: string;
  trackCount: number;
  type: 'playlist' | 'favorite-songs' | 'favorite-albums' | 'favorite-artists';
}

interface SelectionStore {
  selectedPlaylists: PlaylistSelection[];
  addPlaylist: (playlist: PlaylistSelection) => void;
  removePlaylist: (id: string) => void;
  togglePlaylist: (playlist: PlaylistSelection) => void;
  isSelected: (id: string) => boolean;
  clearSelection: () => void;
  destinationService: string | null;
  setDestinationService: (service: string | null) => void;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selectedPlaylists: [],
  destinationService: null,
  
  addPlaylist: (playlist) => {
    const { selectedPlaylists } = get();
    if (!selectedPlaylists.find(p => p.id === playlist.id)) {
      set({ selectedPlaylists: [...selectedPlaylists, playlist] });
    }
  },
  
  removePlaylist: (id) => {
    set({ selectedPlaylists: get().selectedPlaylists.filter(p => p.id !== id) });
  },
  
  togglePlaylist: (playlist) => {
    const { selectedPlaylists } = get();
    const exists = selectedPlaylists.find(p => p.id === playlist.id);
    if (exists) {
      set({ selectedPlaylists: selectedPlaylists.filter(p => p.id !== playlist.id) });
    } else {
      set({ selectedPlaylists: [...selectedPlaylists, playlist] });
    }
  },
  
  isSelected: (id) => {
    return get().selectedPlaylists.some(p => p.id === id);
  },
  
  clearSelection: () => {
    set({ selectedPlaylists: [] });
  },
  
  setDestinationService: (service) => {
    set({ destinationService: service });
  },
}));

