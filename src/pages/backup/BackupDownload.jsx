import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { backupApi } from '../../lib/api';
import toast from 'react-hot-toast';

const BackupDownload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { provider, mode, playlistId, playlistName } = location.state || {};
  const [downloading, setDownloading] = useState(false);

  if (!provider) {
      navigate('/backup');
      return null;
  }

  const handleDownload = async () => {
    setDownloading(true);
    try {
        let blob;
        let filename;

        if (mode === 'all') {
            blob = await backupApi.downloadAll(provider);
            filename = `${provider}_backup_all_${new Date().toISOString().slice(0,10)}.csv`;
        } else {
            blob = await backupApi.downloadSingle(provider, playlistId);
            const safeName = playlistName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            filename = `${provider}_backup_${safeName}.csv`;
        }

        // Trigger file download in browser
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        
        toast.success("Download started!");
    } catch (error) {
        console.error("Backup failed", error);
        const msg = error?.response?.status === 404 ? "Playlist not found or empty." : "Failed to generate backup.";
        toast.error(msg);
    } finally {
        setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B2C] p-6 text-white flex items-center justify-center">
      <div className="max-w-lg w-full bg-white/5 border border-white/10 rounded-2xl p-10 text-center backdrop-blur-xl">
        
        <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Ready to Backup</h1>
        <p className="text-gray-400 mb-8">
            You are about to download a CSV backup of <br/>
            <span className="text-white font-semibold">{playlistName}</span> from <span className="capitalize">{provider}</span>.
        </p>

        <button 
            onClick={handleDownload}
            disabled={downloading}
            className={`w-full py-4 rounded-full font-bold text-lg mb-4 transition-all ${
                downloading 
                ? 'bg-gray-600 cursor-wait' 
                : 'bg-green-500 hover:bg-green-600 text-black hover:shadow-lg hover:shadow-green-500/30'
            }`}
        >
            {downloading ? 'Preparing File...' : 'Download File'}
        </button>

        <button 
            onClick={() => navigate('/backup')}
            className="text-sm text-gray-400 hover:text-white transition"
        >
            Select different playlist
        </button>
      </div>
    </div>
  );
};

export default BackupDownload;