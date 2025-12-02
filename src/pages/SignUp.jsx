import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await register(displayName, email, password);
    if (result.success) {
      toast.success("Registration successful! Please log in.");
      navigate("/login");
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#040720] flex items-center py-10 px-4">
      <div className="max-w-4xl mx-auto w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">

        <div className="grid md:grid-cols-2">

          {/* ================= LEFT SIDE FORM ================= */}
          <div className="p-8 md:p-10">
            <h1 className="text-3xl font-bold">Create your account</h1>

            <p className="text-gray-400 mt-2">
              Build once, listen everywhere. Your playlists deserve a home that moves with you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">

              {/* Display Name */}
              <div>
                <label className="text-sm text-gray-300">Display Name</label>
                <input
                  type="text"
                  required
                  className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              {/* Email */}
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

              {/* Password */}
              <div>
                <label className="text-sm text-gray-300">Password</label>

                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white pr-16 focus:outline-none focus:border-indigo-400"
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

                <p className="text-gray-500 text-xs mt-1">
                  Password must be at least 8 characters and include numbers + symbols.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 transition py-3 rounded-full font-semibold mt-4"
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>

              {/* Login redirect */}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full text-gray-300 text-sm hover:text-white mt-2"
              >
                Already have an account? Login
              </button>
            </form>
          </div>

          {/* ================= RIGHT SIDE INFO PANEL ================= */}
          <div className="bg-gradient-to-b from-green-500/40 to-indigo-700/50 p-8 md:p-10">
            <h2 className="text-xl font-semibold mb-3">What you get</h2>

            <ul className="text-gray-200 space-y-3 text-sm">
              <li>• Unlimited transfers between 85+ services like Spotify, Apple Music, YouTube & Deezer.</li>
              <li>• Smart syncing that remembers ordering, artwork, and hidden gems.</li>
              <li>• Backups + shareable links to protect every playlist you create.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SignUp;
