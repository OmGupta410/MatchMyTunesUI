import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { transferApi } from '../../lib/api';
import toast from 'react-hot-toast';

const TransferProgress = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("jobId");
  
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);

  // Poll the status API
  const fetchStatus = async () => {
    try {
      const data = await transferApi.getTransferStatus(jobId);
      setStatusData(data);
      
      // Stop polling if the job is finished
      const status = data?.status?.toLowerCase();
      if (status === "completed" || status === "failed" || status === "finished") {
         if (pollingRef.current) {
             clearInterval(pollingRef.current);
             pollingRef.current = null;
         }
      }
    } catch (error) {
      console.error("Status fetch error", error);
      // We generally keep polling unless it's a 404 or auth error
      if (error.status === 404) {
          toast.error("Transfer job not found");
          clearInterval(pollingRef.current);
          navigate('/transfer/setup');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) {
        toast.error("No Job ID found");
        navigate('/');
        return;
    }

    // Initial fetch
    fetchStatus();
    // Start polling
    pollingRef.current = setInterval(fetchStatus, 2000); 

    return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobId, navigate]);

  const handleDownloadCsv = async () => {
    try {
        const blob = await transferApi.downloadFailedCsv(jobId);
        // Create a temporary link to trigger download
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `failed_tracks_${jobId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        toast.success("Download started");
    } catch (error) {
        console.error("Download failed", error);
        toast.error("Failed to download CSV");
    }
  };

  if (loading && !statusData) {
      return (
          <div className="min-h-screen bg-[#050B2C] flex items-center justify-center text-white">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400">Loading transfer details...</p>
              </div>
          </div>
      );
  }

  // Safe defaults based on your API structure
  const total = statusData?.totalTracks || 0;
  const processed = statusData?.processedTracks || 0;
  const successCount = statusData?.successfulTracks || 0;
  const failedCount = statusData?.failedTracks || 0;
  const failures = statusData?.failures || [];
  
  // Calculate percentage
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
  const isCompleted = statusData?.status?.toLowerCase() === "completed";
  const isFailed = statusData?.status?.toLowerCase() === "failed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B2C] via-[#1c1f54] to-[#040720] text-white p-6">
      <div className="max-w-4xl mx-auto mt-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-bold">Transfer Progress</h1>
                <p className="text-gray-400 mt-1">Job ID: #{jobId}</p>
            </div>
            <div className={`px-4 py-1 rounded-full text-sm font-bold border ${
                isCompleted 
                ? 'border-green-500 text-green-400 bg-green-500/10' 
                : isFailed
                ? 'border-red-500 text-red-400 bg-red-500/10'
                : 'border-blue-500 text-blue-400 bg-blue-500/10'
            }`}>
                {statusData?.status || 'Pending'}
            </div>
        </div>

        {/* PROGRESS CARD */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-8 backdrop-blur-sm">
            <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="text-purple-300">
                    {isCompleted ? "Transfer Complete" : "Transferring..."}
                </span>
                <span>{percentage}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                <div 
                    className={`h-full transition-all duration-500 ease-out ${
                        isFailed ? 'bg-red-500' : 'bg-gradient-to-r from-purple-600 to-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-8 text-center">
                <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="text-2xl font-bold">{total}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Tracks</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-400">{successCount}</div>
                    <div className="text-xs text-green-300/70 uppercase tracking-wider mt-1">Success</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-400">{failedCount}</div>
                    <div className="text-xs text-red-300/70 uppercase tracking-wider mt-1">Failed</div>
                </div>
            </div>
        </div>

        {/* FAILED TRACKS LIST (Only if failures exist) */}
        {failures.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm mb-8">
                <div className="p-6 border-b border-white/10 flex flex-wrap gap-4 justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-red-300 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Failed Tracks ({failedCount})
                    </h3>
                    
                    {/* CSV Download Button */}
                    {(isCompleted || isFailed) && (
                        <button 
                            onClick={handleDownloadCsv}
                            className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition border border-white/10"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download CSV
                        </button>
                    )}
                </div>
                
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-black/30 text-gray-200 uppercase text-xs sticky top-0 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-3 font-medium">Track Name</th>
                                <th className="px-6 py-3 font-medium">Artist</th>
                                <th className="px-6 py-3 font-medium">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {failures.map((fail, index) => (
                                <tr key={index} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-3 font-medium text-white">
                                        {fail.name || <span className="italic text-gray-600">Unknown</span>}
                                    </td>
                                    <td className="px-6 py-3">
                                        {fail.artist || "-"}
                                    </td>
                                    <td className="px-6 py-3 text-red-300/80 text-xs">
                                        {fail.reason}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* FOOTER ACTIONS */}
        {(isCompleted || isFailed) && (
            <div className="flex justify-center gap-4 pb-10">
                <button 
                    onClick={() => navigate('/')}
                    className="px-8 py-3 rounded-full bg-gray-700 hover:bg-gray-600 font-semibold transition border border-white/10"
                >
                    Back Home
                </button>
                <button 
                    onClick={() => navigate('/transfer/setup')}
                    className="px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold transition shadow-lg shadow-purple-500/20"
                >
                    Transfer Another
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TransferProgress;