import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playlistApi, getStoredToken } from '../../lib/api';
import toast from 'react-hot-toast';

const BackupSelect = () => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState('spotify');
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [selectAll, setSelectAll] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  useEffect(() => {
    if (!getStoredToken()) {
        toast.error("Please login to backup your playlists");
        navigate('/login');
        return;
    }
    fetchPlaylists();
  }, [provider]);

  const fetchPlaylists = async () => {
    setLoading(true);
    setPlaylists([]); // Clear previous list while loading
    try {
      let data;
      console.log(`Fetching ${provider} playlists...`); // Debug log

      if (provider === 'spotify') {
        data = await playlistApi.getSpotifyPlaylists();
      } else {
        data = await playlistApi.getYouTubePlaylists();
      }
      
      console.log("API Response:", data); // Check console to see exact API structure

      // Robust Data Normalization
      // Handles: [ ... ], { items: [...] }, { playlists: [...] }, or { data: [...] }
      let list = [];
      if (Array.isArray(data)) {
          list = data;
      } else if (Array.isArray(data?.items)) {
          list = data.items;
      } else if (Array.isArray(data?.playlists)) {
          list = data.playlists;
      } else if (Array.isArray(data?.data)) {
          list = data.data;
      }

      const normalized = list.map(p => ({
          id: p.id || p.playlistId || p.youtubeId,
          name: p.name || p.title || p.snippet?.title || 'Untitled',
          trackCount: p.tracks?.total || p.trackCount || p.contentDetails?.itemCount || 0,
          image: p.images?.[0]?.url || p.thumbnail || p.snippet?.thumbnails?.default?.url || null
      })).filter(p => p.id);

      setPlaylists(normalized);
      
    } catch (error) {
      console.error("Backup Fetch Error:", error);
      // Show specific error from backend if available
      const msg = error?.response?.data?.message || error?.message || `Failed to fetch ${provider}`;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectAll && !selectedPlaylistId) {
        toast.error("Please select a playlist or 'Back up all'");
        return;
    }

    const state = {
        provider,
        mode: selectAll ? 'all' : 'single',
        playlistId: selectAll ? null : selectedPlaylistId,
        playlistName: selectAll ? 'All Playlists' : playlists.find(p => p.id === selectedPlaylistId)?.name
    };

    navigate('/backup/download', { state });
  };

  return (
    <div className="min-h-screen bg-[#050B2C] p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-bold">Backup Your Library</h1>
            <p className="text-gray-400">Secure your playlists as a CSV file.</p>
        </header>

        {/* Provider Selector */}
        <div className="flex gap-4 mb-8">
            {['spotify', 'youtube'].map((p) => (
                <button
                    key={p}
                    onClick={() => { setProvider(p); setSelectAll(false); setSelectedPlaylistId(null); }}
                    className={`px-6 py-3 rounded-xl border flex items-center gap-3 transition-all ${
                        provider === p 
                        ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/20' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <span className="capitalize font-semibold">{p}</span>
                </button>
            ))}
        </div>

        {/* Global Option */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 flex items-center gap-4 hover:bg-white/10 transition cursor-pointer" onClick={() => setSelectAll(!selectAll)}>
            <input 
                type="checkbox" 
                checked={selectAll}
                onChange={() => setSelectAll(!selectAll)}
                className="w-5 h-5 rounded border-gray-500 text-purple-500 focus:ring-purple-500 cursor-pointer"
            />
            <div>
                <h3 className="font-semibold text-lg">Back up all playlists</h3>
                <p className="text-sm text-gray-400">Download everything in one go.</p>
            </div>
        </div>

        {/* Playlist List */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-black/20">
                <h3 className="font-semibold">Select a single playlist</h3>
            </div>
            
            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading playlists...</div>
            ) : playlists.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No playlists found.</div>
            ) : (
                <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
                    {playlists.map(playlist => (
                        <label 
                            key={playlist.id} 
                            className={`flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition ${
                                selectAll ? 'opacity-50 pointer-events-none' : ''
                            } ${selectedPlaylistId === playlist.id ? 'bg-white/10' : ''}`}
                        >
                            <input 
                                type="radio" 
                                name="backup-playlist"
                                disabled={selectAll}
                                checked={selectedPlaylistId === playlist.id}
                                onChange={() => setSelectedPlaylistId(playlist.id)}
                                className="w-4 h-4 text-purple-500 border-gray-500 focus:ring-purple-500"
                            />
                            
                            <div className="w-12 h-12 rounded bg-gray-700 overflow-hidden flex-shrink-0">
                                {playlist.image ? (
                                    <img src={playlist.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">?</div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="font-medium text-white">{playlist.name}</div>
                                <div className="text-xs text-gray-400">{playlist.trackCount} tracks</div>
                            </div>
                        </label>
                    ))}
                </div>
            )}
        </div>

        {/* Footer Action */}
        <div className="mt-8 flex justify-end">
            <button 
                onClick={handleNext}
                disabled={loading || (!selectAll && !selectedPlaylistId)}
                className={`px-8 py-3 rounded-full font-bold transition ${
                    loading || (!selectAll && !selectedPlaylistId)
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-black shadow-lg shadow-green-500/20'
                }`}
            >
                Continue to Download
            </button>
        </div>
      </div>
    </div>
  );
};

export default BackupSelect;