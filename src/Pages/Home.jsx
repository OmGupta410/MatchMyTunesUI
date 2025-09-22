import React from "react";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Transfer Your Playlists Seamlessly
        </h2>
        <p className="text-gray-300 mb-8 max-w-xl mx-auto">
          Move your favorite playlists from Spotify, YouTube Music, or Gaana to
          any platform in just a few clicks.
        </p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300">
          Start Transferring
        </button>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-6 text-center">
        <h3 className="text-3xl font-bold mb-10">Features</h3>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h4 className="font-semibold text-xl mb-2">Easy Transfer</h4>
            <p className="text-gray-300">
              Move playlists between platforms in just a few steps.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h4 className="font-semibold text-xl mb-2">Multiple Platforms</h4>
            <p className="text-gray-300">
              Supports Spotify, Gaana, YouTube Music, and more.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h4 className="font-semibold text-xl mb-2">Secure & Fast</h4>
            <p className="text-gray-300">
              Your account information is safe, and transfers are lightning
              fast.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-16 px-6 text-center bg-gray-900">
        <h3 className="text-3xl font-bold mb-10">How It Works</h3>
        <div className="max-w-4xl mx-auto text-left space-y-6">
          <p>
            1. Connect your source music platform account (Spotify, YouTube
            Music, etc.)
          </p>
          <p>2. Select the playlist you want to transfer.</p>
          <p>3. Connect your destination platform (Gaana, Spotify, etc.).</p>
          <p>4. Hit “Transfer” and enjoy your playlists on the new platform!</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
