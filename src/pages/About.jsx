import React from "react";

const About = () => {
  const pillars = [
    {
      title: "Seamless switching",
      copy: "Hop between Spotify, Apple Music, YouTube Music, Deezer, and more without rebuilding playlists from scratch.",
    },
    {
      title: "Taste-forward matches",
      copy: "Our matching engine understands genres, moods, and listening patterns so your recommendations stay on point.",
    },
    {
      title: "Community first",
      copy: "Share mixes, collaborate on queue-worthy playlists, and discover new friends who vibe like you do.",
    },
  ];

  const timeline = [
    {
      label: "Step 1",
      title: "Connect your favorite service",
      detail:
        "Link Spotify today, add Apple Music tomorrow—MatchMyTunes speaks them all.",
    },
    {
      label: "Step 2",
      title: "Let our matcher do the magic",
      detail:
        "We read your top artists, genres, and hidden gems to find musical twins.",
    },
    {
      label: "Step 3",
      title: "Meet people with your energy",
      detail:
        "Chat, collaborate, and build playlists together while your libraries stay synced.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050b2c] text-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ===============================
            HERO TITLE + DESCRIPTION
        ================================ */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1 border border-gray-500 rounded-full text-gray-300 text-sm">
            About MatchMyTunes
          </span>

          <h1 className="text-4xl md:text-5xl font-bold mt-4 leading-tight">
            Built for people who treat playlists like photo albums
          </h1>

          <p className="text-gray-400 mt-4">
            MatchMyTunes started as a tiny tool to move one collection from
            Spotify to Apple Music. Today, it is a full experience for
            discovering friends by taste, syncing across platforms, and keeping
            every memory-filled playlist safe.
          </p>
        </div>

        {/* ===============================
            PILLARS — 3 CARDS
        ================================ */}
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="bg-white/5 border border-white/10 rounded-xl p-6 min-h-[220px] transition duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg"
            >
              <h3 className="text-lg font-semibold text-indigo-300 mb-2">
                {pillar.title}
              </h3>
              <p className="text-gray-400 text-sm">{pillar.copy}</p>
            </div>
          ))}
        </div>

        {/* ===============================
            TIMELINE SECTION (Glass Panel)
        ================================ */}
        <div className="mt-16 bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* LEFT TEXT */}
            <div>
              <h2 className="text-3xl font-bold mb-3">How it works</h2>
              <p className="text-gray-400 leading-relaxed">
                We pair advanced audio analysis with human-friendly design.
                Connect once, then explore matching listeners, collaborative
                playlists, and a unified library view—sleek, modern, and
                trustworthy.
              </p>
            </div>

            {/* RIGHT TIMELINE STEPS */}
            <div className="space-y-4">
              {timeline.map((step) => (
                <div
                  key={step.title}
                  className="border border-white/10 rounded-xl p-4 bg-white/5 hover:bg-white/10 transition duration-300"
                >
                  <span className="text-indigo-300 text-xs">{step.label}</span>
                  <h3 className="text-lg font-semibold mt-1">{step.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
