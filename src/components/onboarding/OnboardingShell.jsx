import React from "react";

export default function OnboardingShell({
  onboardingPage,
  onSwitchPage,
  children,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 flex items-center justify-between gap-4">
          <a href="/app" className="flex items-center gap-3 hover:opacity-90 transition-opacity" aria-label="Go to homepage">
            <img
              src="/favicon.png"
              alt="PLNR logo"
              className="w-10 h-10 rounded-xl border border-zinc-200 bg-white object-cover shadow-sm"
            />
            <div>
              <h1 className="text-2xl font-black text-zinc-900">PLNR</h1>
              <p className="text-sm text-zinc-600">Plan, save, and share your trips</p>
            </div>
          </a>
          <div className="inline-flex rounded-xl overflow-hidden border border-zinc-300">
            <button
              type="button"
              onClick={() => onSwitchPage("trips")}
              className={`px-4 py-2 text-sm font-medium ${onboardingPage === "trips" ? "bg-zinc-900 text-white" : "bg-white text-zinc-700"}`}
            >
              Trips
            </button>
            <button
              type="button"
              onClick={() => onSwitchPage("create")}
              className={`px-4 py-2 text-sm font-medium border-l border-zinc-300 ${onboardingPage === "create" ? "bg-zinc-900 text-white" : "bg-white text-zinc-700"}`}
            >
              New Trip
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
