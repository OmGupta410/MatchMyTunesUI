import React from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://matchmytunes.onrender.com";

const Plans = () => {
  const navigate = useNavigate();

  // PAYMENT / SYNC LOGIC
  const upgradepremium = async () => {
    // Check both storage locations just in case
    const token = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
    
    if (!token) {
        alert("Please log in first.");
        navigate('/login');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/payment/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                planId: 1, // Assuming ID 1 is Premium based on your code
                successUrl: window.location.origin + "/transfer/setup?status=premium_success", 
                cancelUrl: window.location.origin + "/plans"
            })
        });

        const data = await response.json();
        
        if (data.sessionUrl) {
            window.location.href = data.sessionUrl;
        } else {
            alert("Could not initiate payment session.");
        }
    } catch (error) {
        console.error("Payment error:", error);
        alert("Something went wrong initiating the upgrade.");
    }
  };

  const tiers = [
    {
      name: "Free",
      price: "0",
      description: "For casual listeners moving a few playlists every month.",
      features: [
        "Up to 3 playlist transfers per month",
        "Sync between Spotify and YouTube",
        "Manual backups",
        "Email support within 48 hours",
      ],
      cta: "Get started",
      highlighted: false,
    },
    {
      name: "Premium",
      price: "14",
      description: "For collectors and DJs who need reliable, automated syncing.",
      features: [
        "Unlimited transfers and backups",
        "Scheduled auto-sync every day",
        "Priority matching and retries",
        "Team sharing links",
        "Priority support under 4 hours",
      ],
      cta: "Upgrade now",
      highlighted: true,
    },
  ];

  const comparison = [
    { label: "Playlist transfers", free: "3 / month", premium: "Unlimited" },
    { label: "Supported services", free: "Spotify, YouTube", premium: "All current + beta" },
    { label: "Auto backups", free: "Manual export", premium: "Scheduled weekly" },
    { label: "Matching retries", free: "Basic", premium: "Smart retries" },
    { label: "Support", free: "Email", premium: "Priority" },
  ];

  const handleTierClick = (tierName) => {
      if (tierName === "Premium") {
          upgradepremium();
      } else {
          // For Free tier, just go to the transfer setup
          navigate('/transfer/setup');
      }
  };

  return (
    <div className="min-h-screen bg-[#050b2c] text-white py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-14">
        <header className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3 py-1 text-sm border border-white/20 rounded-full text-indigo-200">
            Flexible pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Plans for every kind of collector
          </h1>
          <p className="text-gray-300 text-base">
            MatchMyTunes keeps libraries aligned across services. Pick the plan that matches how often you move music.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`relative border border-white/10 rounded-2xl p-8 backdrop-blur-xl bg-white/5 flex flex-col gap-6 ${
                tier.highlighted ? "shadow-[0_0_45px_rgba(139,92,246,0.35)]" : ""
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-6 bg-purple-600 text-white text-[11px] uppercase tracking-widest px-3 py-1 rounded-full">
                  Most popular
                </span>
              )}
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">{tier.name}</h2>
                <p className="text-gray-300 text-sm">{tier.description}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">${tier.price}</span>
                <span className="text-sm text-gray-400">per month</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-200">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-green-400 mt-[2px]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleTierClick(tier.name)}
                className={`inline-flex justify-center items-center rounded-full px-5 py-2 text-sm font-semibold transition ${
                  tier.highlighted
                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                    : "border border-white/30 text-white hover:border-white/60"
                }`}
              >
                {tier.cta}
              </button>
            </article>
          ))}
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold mb-6">Compare features</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-200">
              <thead className="text-xs uppercase text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-3 pr-6">Feature</th>
                  <th className="py-3 pr-6">Free</th>
                  <th className="py-3">Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-b border-white/5 last:border-none">
                    <th scope="row" className="py-4 pr-6 font-medium text-white">
                      {row.label}
                    </th>
                    <td className="py-4 pr-6 text-gray-300">{row.free}</td>
                    <td className="py-4 text-gray-300">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="text-center space-y-3">
          <h3 className="text-xl font-semibold">Need a team plan?</h3>
          <p className="text-gray-400 text-sm">
            Contact us for custom quotas, dedicated onboarding, and enterprise security reviews.
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white hover:bg-white/20 transition"
          >
            Talk to sales
          </button>
        </section>
      </div>
    </div>
  );
};

export default Plans;