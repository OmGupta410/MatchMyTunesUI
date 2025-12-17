import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { authApi, persistToken, API_BASE_URL } from "../lib/api.js";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Clean up message listener on unmount
  useEffect(() => {
      const messageHandler = (event) => {
          const allowedOrigins = [
              API_BASE_URL,
              window.location.origin,
              "http://localhost:5173"
          ];
          
          if (!allowedOrigins.includes(event.origin) && event.origin !== "null") return;

          if (event.data.type === "AUTH_SUCCESS") {
              const { token, userId, code } = event.data;
              if (token) {
                  persistToken(token);
                  sessionStorage.setItem("spotify_connected", "true");
                  if (userId) sessionStorage.setItem("userId", userId);
                  toast.success("Spotify connected successfully!");
                  navigate("/auth/spotify/callback" + (code ? `?code=${code}` : ''));
              }
          }
      };
      
      window.addEventListener("message", messageHandler);
      return () => window.removeEventListener("message", messageHandler);
  }, [navigate]);

  const handleSpotifyLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authApi.spotifyLoginUrl(),
      "MatchMyTunesLogin",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) {
      toast.error("Popup blocked. Please allow popups for this site.");
      return;
    }

    const checkPopup = setInterval(() => {
        if (popup.closed) {
            clearInterval(checkPopup);
        }
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      toast.success("Login successful!");
      navigate("/");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#040720] flex items-center py-10 px-4">
      <div className="max-w-4xl mx-auto w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-2">
          {/* LEFT SIDE - FORM */}
          <div className="p-8 md:p-10">
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>
            <p className="text-gray-400 mt-2">
              Sign in to keep your playlists synced everywhere.
            </p>

            {/* SPOTIFY LOGIN */}
            <button
              onClick={handleSpotifyLogin}
              type="button"
              className="w-full bg-[#1DB954] text-black font-semibold py-3 rounded-full mt-6 hover:bg-[#17a84c] transition"
            >
              Login with Spotify
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <span className="flex-1 h-px bg-gray-600" />
              <span className="px-3 text-gray-400 text-sm">or</span>
              <span className="flex-1 h-px bg-gray-600" />
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-300">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-300 text-sm"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 transition py-3 rounded-full font-semibold mt-4 text-white"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="w-full text-gray-300 text-sm hover:text-white mt-2"
              >
                Don't have an account? Sign Up
              </button>
            </form>
          </div>

          {/* RIGHT SIDE - INFO PANEL */}
          <div className="bg-gradient-to-b from-purple-700/70 to-indigo-900/80 p-8 md:p-10 text-white">
            <h2 className="text-xl font-semibold mb-3">Why MatchMyTunes?</h2>
            <ul className="text-gray-200 space-y-3 text-sm">
              <li>• Transfer playlists between Spotify, Apple Music, YouTube Music, Deezer, TIDAL, and more.</li>
              <li>• Sync services automatically so new songs appear everywhere instantly.</li>
              <li>• Share mixes with friends using different platforms.</li>
              <li>• Keep your library backed up and safe forever.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;