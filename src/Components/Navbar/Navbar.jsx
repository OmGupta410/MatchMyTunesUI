import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="navbar bg-gray-900 text-white shadow-md p-4 flex justify-between items-center">
      <div className="text-2xl font-bold">
        <Link to="/">Match My Tunes</Link>
      </div>

      {/* Navigation Links */}
      <nav className="space-x-6">
        <Link to="/" className="hover:text-gray-400">
          Home
        </Link>
        <Link to="/discover" className="hover:text-gray-400">
          Discover
        </Link>
        <Link to="/playlists" className="hover:text-gray-400">
          Playlists
        </Link>
        <Link to="/profile" className="hover:text-gray-400">
          Profile
        </Link>
      </nav>

      {/* Login/Logout Button */}
      <div>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md">
          Login
        </button>
      </div>
    </div>
  );
}

export default Navbar;
