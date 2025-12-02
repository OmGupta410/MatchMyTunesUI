import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  
  const handleSpotifyLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    // Open popup window for Spotify login
    const popup = window.open(
      "https://matchmytunes.onrender.com/api/auth/spotify/login",
      "MatchMyTunesLogin",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) {
      toast.error("Popup blocked. Please allow popups for this site.");
      return;
    }

    // Listen for messages from popup
    const messageHandler = (event) => {
      const allowedOrigins = [
        "https://matchmytunes.onrender.com",
        window.location.origin
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      if (event.data.type === "AUTH_SUCCESS") {
        const { token, userId, provider, code } = event.data;
        
        if (token) {
          sessionStorage.setItem("jwt", token);
          localStorage.setItem("jwt", token);
          sessionStorage.setItem("spotify_connected", "true");
          localStorage.setItem("spotify_connected", "true");
        }
        
        window.removeEventListener("message", messageHandler);
        popup?.close();
        navigate("/auth/spotify/callback" + (code ? `?code=${code}` : ''));
      }
    };

    window.addEventListener("message", messageHandler);

    // Poll popup URL to detect success
    const checkPopup = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener("message", messageHandler);
          // Check if auth was successful
          const token = sessionStorage.getItem("jwt") || localStorage.getItem("jwt");
          if (token) {
            sessionStorage.setItem("spotify_connected", "true");
            localStorage.setItem("spotify_connected", "true");
            navigate("/auth/spotify/callback");
          }
          return;
        }

        // Try to read popup URL
        try {
          const popupUrl = popup.location.href;
          
          // Check if URL contains success indicators
          if (popupUrl.includes('success') || 
              popupUrl.includes('callback') || 
              popupUrl.includes('code=') ||
              popupUrl.includes('token=')) {
            
            const urlParams = new URLSearchParams(popup.location.search);
            const code = urlParams.get('code');
            const token = urlParams.get('token');
            
            if (code || token) {
              clearInterval(checkPopup);
              window.removeEventListener("message", messageHandler);
              
              if (token) {
                sessionStorage.setItem("jwt", token);
                localStorage.setItem("jwt", token);
              }
              
              sessionStorage.setItem("spotify_connected", "true");
              localStorage.setItem("spotify_connected", "true");
              popup.close();
              navigate("/auth/spotify/callback" + (code ? `?code=${code}` : ''));
            } else if (popupUrl.includes('success') || popupUrl.includes('Authentication Successful')) {
              // Success page detected
              clearInterval(checkPopup);
              window.removeEventListener("message", messageHandler);
              setTimeout(() => {
                popup.close();
                navigate("/auth/spotify/callback");
              }, 1000);
            }
          }
        } catch (e) {
          // Cross-origin - continue polling
        }
      } catch (e) {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener("message", messageHandler);
        }
      }
    }, 500);

    // Cleanup after 5 minutes
    setTimeout(() => {
      clearInterval(checkPopup);
      window.removeEventListener("message", messageHandler);
      if (!popup.closed) {
        popup.close();
      }
    }, 300000);
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
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-gray-400 mt-2">
              Sign in to keep your playlists synced everywhere.
            </p>

            {/* SPOTIFY LOGIN */}
            <button
              onClick={handleSpotifyLogin}
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
              {/* EMAIL */}
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

              {/* PASSWORD */}
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

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 transition py-3 rounded-full font-semibold mt-4"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              {/* SIGNUP LINK */}
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
          <div className="bg-gradient-to-b from-purple-700/70 to-indigo-900/80 p-8 md:p-10">
            <h2 className="text-xl font-semibold mb-3">Why MatchMyTunes?</h2>

            <ul className="text-gray-200 space-y-3 text-sm">
              <li>
                • Transfer playlists between Spotify, Apple Music, YouTube
                Music, Deezer, TIDAL, and more.
              </li>
              <li>
                • Sync services automatically so new songs appear everywhere
                instantly.
              </li>
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
