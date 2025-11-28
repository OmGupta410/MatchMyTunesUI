import React, { useState } from "react";

const Home = () => {
  // =========================
  // STATE
  // =========================
  const [fromService, setFromService] = useState("Spotify");
  const [toService, setToService] = useState("YouTube Music");

  // SERVICES LIST
  const services = [
    { name: "Spotify", icon: "fa-brands fa-spotify" },
    { name: "Apple", icon: "fa-brands fa-apple" },
    { name: "YT Music", icon: "fa-brands fa-youtube" },
    { name: "YouTube", icon: "fa-brands fa-youtube" },
    { name: "Deezer", icon: "fa-brands fa-deezer" },
    { name: "TIDAL", icon: "fa-brands fa-tidal" },
    { name: "Amazon", icon: "fa-brands fa-amazon" },
    { name: "SoundCloud", icon: "fa-brands fa-soundcloud" },
  ];

  // WHEN A SERVICE IS CLICKED
  const handleSelect = (serviceName) => {
    // If FROM is empty → set FROM
    if (!fromService) {
      setFromService(serviceName);
      return;
    }

    // If FROM is selected but TO is empty → set TO
    if (!toService) {
      setToService(serviceName);
      return;
    }

    // If both are selected → reset TO, change FROM
    setFromService(serviceName);
    setToService("");
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      {/* =========================
          HERO SECTION
      ========================== */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          {/* LEFT */}
          <div>
            <div className="text-sm border px-3 py-1 rounded-full border-gray-500 text-gray-300 inline-block">
              Playlist transfer, done right
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mt-4 leading-tight">
              Keep your playlists in sync,
              <br /> wherever you listen.
            </h1>

            <p className="text-gray-400 mt-4 max-w-md">
              Transfer your playlists between Spotify, Apple Music, YouTube
              Music and more — without losing tracks or order.
            </p>

            {/* BUTTON */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <a
                href="/signup"
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-3 rounded-full text-center transition duration-300"
              >
                Start a transfer
              </a>
            </div>

            {/* STATS */}
            <div className="flex gap-10 mt-10">
              <div>
                <h3 className="text-2xl font-bold">12M+</h3>
                <p className="text-gray-400 text-sm">Playlists processed</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold">85+</h3>
                <p className="text-gray-400 text-sm">Supported services</p>
              </div>
            </div>
          </div>

          {/* =========================
              RIGHT SELECTABLE BOX
          ========================== */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-white/10">
            <h3 className="text-lg text-gray-300">Quick setup</h3>
            <h2 className="text-2xl font-semibold mt-1 mb-6">
              Transfer a playlist
            </h2>

            {/* FROM SERVICE */}
            <div className="mb-4">
              <p className="text-xs text-gray-400">FROM SERVICE</p>

              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 mt-1 flex justify-between items-center hover:bg-white/10 transition duration-300">
                <p>{fromService || "Select a service"}</p>
                <span className="text-gray-400 text-xs">Connected</span>
              </div>
            </div>

            {/* TO SERVICE */}
            <div className="mb-4">
              <p className="text-xs text-gray-400">TO SERVICE</p>

              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 mt-1 flex justify-between items-center hover:bg-white/10 transition duration-300">
                <p>{toService || "Select a service"}</p>
                <span className="text-gray-400 text-xs">
                  {toService ? "Connected" : "Connect"}
                </span>
              </div>
            </div>

            {/* SUPPORTED SERVICES (CLICKABLE) */}
            <p className="text-xs text-gray-400 mt-4">SUPPORTED SERVICES</p>

            <div className="grid grid-cols-4 gap-3 mt-2 text-xs">
              {services.map((service) => (
                <div
                  key={service.name}
                  onClick={() => handleSelect(service.name)}
                  className={`p-2 border rounded text-center cursor-pointer flex flex-col items-center gap-1 transition duration-300
                    ${
                      fromService === service.name || toService === service.name
                        ? "bg-white/10 border-white/30"
                        : "border-white/10 hover:bg-white/10"
                    }
                  `}
                >
                  <i className={`${service.icon} text-xl`}></i>
                  <span className="text-[11px]">{service.name}</span>
                </div>
              ))}
            </div>

            <button className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold mt-5 py-3 rounded-full transition duration-300">
              Launch transfer
            </button>
          </div>
        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================== */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center">How it works</h2>
          <p className="text-gray-400 text-center mt-2 max-w-lg mx-auto">
            A simple 3-step process to keep your playlists synced everywhere.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              {
                step: "01",
                title: "Connect your services",
                desc: "Log in with your music platforms. Minimum permissions only.",
              },
              {
                step: "02",
                title: "Select playlists",
                desc: "Choose single playlists or your entire library.",
              },
              {
                step: "03",
                title: "Transfer & sync",
                desc: "Start the transfer. We keep everything updated automatically.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white/5 p-6 rounded-xl border border-white/10 h-full transition duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg"
              >
                <p className="text-gray-400 text-sm">{item.step}</p>
                <h3 className="text-xl font-semibold mt-2">{item.title}</h3>
                <p className="text-gray-400 mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          FEATURES
      ========================== */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center">
            Built for serious listeners
          </h2>
          <p className="text-gray-400 text-center mt-2 max-w-lg mx-auto">
            Tools designed to give you full control of your music library.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              "One-click transfer",
              "Auto sync",
              "Smart matching",
              "Backup & export",
              "Link sharing",
              "Multi-format upload",
            ].map((feature) => (
              <div
                key={feature}
                className="bg-white/5 p-6 rounded-xl border border-white/10 h-full transition duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">{feature}</h3>
                <p className="text-gray-400 mt-2">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          POPULAR CONVERSIONS
      ========================== */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center">
            Popular conversions
          </h2>
          <p className="text-gray-400 text-center mt-2 mb-6 max-w-md mx-auto">
            These routes are used most by our users.
          </p>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            {[
              {
                from: "Spotify",
                to: "YouTube Music",
                fromIcon: "fa-brands fa-spotify",
                toIcon: "fa-brands fa-youtube",
              },
              {
                from: "Deezer",
                to: "Spotify",
                fromIcon: "fa-brands fa-deezer",
                toIcon: "fa-brands fa-spotify",
              },
              {
                from: "Spotify",
                to: "Apple Music",
                fromIcon: "fa-brands fa-spotify",
                toIcon: "fa-brands fa-apple",
              },
              {
                from: "Amazon Music",
                to: "TIDAL",
                fromIcon: "fa-brands fa-amazon",
                toIcon: "fa-brands fa-tidal",
              },
              {
                from: "TIDAL",
                to: "Deezer",
                fromIcon: "fa-brands fa-tidal",
                toIcon: "fa-brands fa-deezer",
              },
              {
                from: "YouTube Music",
                to: "Spotify",
                fromIcon: "fa-brands fa-youtube",
                toIcon: "fa-brands fa-spotify",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex justify-between py-4 border-b border-white/10 last:border-none hover:bg-white/10 px-3 rounded-lg transition duration-300"
              >
                <div className="flex items-center gap-3">
                  <i className={`${item.fromIcon} text-xl`}></i>
                  <span className="text-gray-300 font-medium">{item.from}</span>

                  <span className="text-gray-400">→</span>

                  <i className={`${item.toIcon} text-xl`}></i>
                  <span className="text-gray-300 font-medium">{item.to}</span>
                </div>

                <button className="border border-gray-500 px-4 py-1 rounded-full text-sm hover:bg-white/20 transition duration-300">
                  Convert
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          SUPPORT
      ========================== */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-xl p-10 text-center transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h2 className="text-3xl font-bold">Real people, not bots</h2>
          <p className="text-gray-400 mt-3 max-w-md mx-auto">
            Need help? Our support team responds fast.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <button className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-full font-semibold transition duration-300">
              FAQ
            </button>
            <button className="border border-gray-500 px-6 py-3 rounded-full hover:border-gray-300 hover:bg-white/10 transition duration-300">
              Contact support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
