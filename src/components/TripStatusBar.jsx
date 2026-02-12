import React from "react";

export default function TripStatusBar({ cloudTripId, cloudSlug, user, isSupabaseConfigured }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-700 flex flex-wrap items-center gap-2">
      <span className="font-medium text-zinc-900">Status:</span>
      {cloudTripId ? (
        <>
          <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">Saved online</span>
        </>
      ) : (
        <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800">Draft on this device</span>
      )}
      {!user && isSupabaseConfigured && (
        <span className="text-zinc-500">Sign in to sync and reopen on any device.</span>
      )}
    </div>
  );
}
