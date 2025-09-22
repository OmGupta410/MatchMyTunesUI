import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="flex justify-between items-center px-8 py-4 bg-gray-900 shadow-md text-white">
      <h1 className="text-2xl font-bold">🎶 Match My Tunes</h1>
      <nav className="space-x-6 hidden md:flex">
        <Link to="/" className="hover:text-blue-400">
          Home
        </Link>
        <Link to="/about" className="hover:text-blue-400">
          About
        </Link>
        <Link to="/contact" className="hover:text-blue-400">
          Contact
        </Link>
      </nav>
      <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md">
        <Link to="/login">Login</Link>
      </button>
    </header>
  );
}

export default Navbar;
