import React from "react";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-6 py-16">
      <h2 className="text-4xl font-bold mb-6">About Us</h2>
      <p className="text-gray-300 mb-6 max-w-3xl text-center">
        <strong>Match My Tunes</strong> is a music playlist transfer platform
        that helps users move their favorite playlists across different music
        streaming services such as Spotify, YouTube Music, and Gaana.
      </p>
      <p className="text-gray-300 mb-6 max-w-3xl text-center">
        Our mission is to make music management effortless. Whether you switch
        platforms or want to keep all your favorite songs in one place, we
        simplify the process and ensure your playlists are ready wherever you
        go.
      </p>
      <p className="text-gray-300 max-w-3xl text-center">
        Our team is passionate about music and technology, dedicated to creating
        tools that make your listening experience seamless and enjoyable.
      </p>
    </div>
  );
};

export default AboutUs;
