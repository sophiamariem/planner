import React from "react";

export default function TripViewHeader({
  tripTitle,
  isSharedCloudTrip,
  canCollaborateOnSharedTrip,
  copiedFromOwnerId,
  onGoHome,
  view,
  onChangeView,
  filter,
  onChangeFilter,
  onShare,
  canSaveSharedCopy,
  onSaveSharedCopy,
  cloudSaving,
  canEditCurrentTrip,
  onEditTrip,
  onReset,
  user,
  onSignIn,
  onSignOut,
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-zinc-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
              aria-label="Go to homepage"
              title="Go to homepage"
            >
              <img src="/favicon.png" alt="PLNR" className="w-6 h-6 rounded-md border border-zinc-200 bg-white object-cover" />
              <span className="text-xs font-semibold tracking-wide text-blue-700">PLNR</span>
            </button>
            {isSharedCloudTrip && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  canCollaborateOnSharedTrip
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {canCollaborateOnSharedTrip ? "Shared (collaborative)" : "Shared (read-only)"}
              </span>
            )}
            {!isSharedCloudTrip && copiedFromOwnerId && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200">
                Copied from shared trip
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">{tripTitle}</h1>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            onClick={onGoHome}
            aria-label="Go home"
            title="Go home"
            className="w-12 h-12 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 flex items-center justify-center shadow-sm"
          >
            <img src="/favicon.png" alt="Home" className="w-12 h-12 rounded-xl object-cover" />
          </button>
          <div className="inline-flex rounded-2xl overflow-hidden border border-zinc-300">
            <button type="button" onClick={() => onChangeView("cards")} className={`px-3 py-2 text-sm ${view === "cards" ? "bg-zinc-900 text-white" : "bg-white"}`}>Cards</button>
            <button type="button" onClick={() => onChangeView("calendar")} className={`px-3 py-2 text-sm border-l border-zinc-300 ${view === "calendar" ? "bg-zinc-900 text-white" : "bg-white"}`}>Calendar</button>
          </div>
          <input value={filter} onChange={e => onChangeFilter(e.target.value)} placeholder="Filter days, places, notes" className="px-3 py-2 rounded-2xl border border-zinc-300 bg-white text-sm outline-none focus:ring-2 focus:ring-pink-400" />
          <button type="button" onClick={onShare} className="px-3 py-2 rounded-2xl bg-blue-600 text-white text-sm hover:bg-blue-700">Share</button>
          {canSaveSharedCopy && (
            <button
              type="button"
              onClick={onSaveSharedCopy}
              disabled={cloudSaving}
              className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-white disabled:opacity-50"
            >
              {cloudSaving ? "Saving..." : "Save to My Trips"}
            </button>
          )}
          {canEditCurrentTrip && (
            <button type="button" onClick={onEditTrip} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-white">Edit</button>
          )}
          <details className="relative">
            <summary className="list-none cursor-pointer px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50">More</summary>
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white shadow-lg p-2 flex flex-col gap-1 z-20">
              <button type="button" onClick={() => window.print()} className="text-left px-3 py-2 rounded-lg text-sm hover:bg-zinc-50">Print</button>
              {canEditCurrentTrip && (
                <button type="button" onClick={onReset} className="text-left px-3 py-2 rounded-lg text-sm hover:bg-red-50 text-red-600">Reset</button>
              )}
              {!user ? (
                <button type="button" onClick={onSignIn} className="text-left px-3 py-2 rounded-lg text-sm hover:bg-zinc-50">Sign In</button>
              ) : (
                <button type="button" onClick={onSignOut} className="text-left px-3 py-2 rounded-lg text-sm hover:bg-zinc-50">Sign Out</button>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
