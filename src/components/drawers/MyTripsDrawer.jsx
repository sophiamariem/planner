import React from "react";

export default function MyTripsDrawer({
  open,
  onClose,
  myTripsLoading,
  myTrips,
  savedUpcomingTrips,
  savedPastTrips,
  showPastSavedTrips,
  onTogglePast,
  onOpenTrip,
  onDeleteTrip,
  extractCoverImage,
  formatVisibilityLabel,
  cloudVisibility,
  onChangeVisibility,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">My Saved Trips</h2>
        <p className="text-zinc-600 mb-4 text-sm">Open one of your saved trips.</p>

        {myTripsLoading ? (
          <p className="text-sm text-zinc-600">Loading trips...</p>
        ) : myTrips.length === 0 ? (
          <p className="text-sm text-zinc-600">No saved trips yet. Save your current trip first.</p>
        ) : (
          <div className="max-h-[70vh] overflow-auto space-y-5">
            <section>
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">Upcoming ({savedUpcomingTrips.length})</h3>
              {savedUpcomingTrips.length === 0 ? (
                <p className="text-xs text-zinc-500">No upcoming trips.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {savedUpcomingTrips.map((trip) => {
                    const cover = extractCoverImage(trip);
                    return (
                      <div key={trip.id} className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => onOpenTrip(trip.id)}
                          className="w-full text-left hover:bg-zinc-50"
                        >
                          <div className="h-28 bg-zinc-100">
                            {cover && (
                              <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />
                            )}
                          </div>
                          <div className="p-3">
                            <p className="font-medium text-zinc-900">{trip.title}</p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {trip.slug || "no-slug"} • {formatVisibilityLabel(trip.visibility)}
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              Updated {new Date(trip.updated_at || trip.created_at).toLocaleString()}
                            </p>
                          </div>
                        </button>
                        <div className="px-3 pb-3">
                          <button
                            type="button"
                            onClick={() => onDeleteTrip(trip.id)}
                            className="w-full px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50"
                          >
                            Delete Trip
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <button
                type="button"
                onClick={onTogglePast}
                className="w-full mb-2 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between"
              >
                <span>Past ({savedPastTrips.length})</span>
                <span>{showPastSavedTrips ? "Hide" : "Show"}</span>
              </button>
              {showPastSavedTrips ? (
                savedPastTrips.length === 0 ? (
                  <p className="text-xs text-zinc-500">No past trips.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {savedPastTrips.map((trip) => {
                      const cover = extractCoverImage(trip);
                      return (
                        <div key={trip.id} className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => onOpenTrip(trip.id)}
                            className="w-full text-left hover:bg-zinc-50"
                          >
                            <div className="h-28 bg-zinc-100">
                              {cover && (
                                <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />
                              )}
                            </div>
                            <div className="p-3">
                              <p className="font-medium text-zinc-900">{trip.title}</p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {trip.slug || "no-slug"} • {formatVisibilityLabel(trip.visibility)}
                              </p>
                              <p className="text-xs text-zinc-400 mt-1">
                                Updated {new Date(trip.updated_at || trip.created_at).toLocaleString()}
                              </p>
                            </div>
                          </button>
                          <div className="px-3 pb-3">
                            <button
                              type="button"
                              onClick={() => onDeleteTrip(trip.id)}
                              className="w-full px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50"
                            >
                              Delete Trip
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : null}
            </section>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <label className="text-sm text-zinc-600">Default visibility:</label>
          <select
            value={cloudVisibility}
            onChange={(e) => onChangeVisibility(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-300 text-sm"
          >
            <option value="private">Only me</option>
            <option value="unlisted">Shared (link only)</option>
            <option value="public">Public</option>
          </select>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
        >
          Close
        </button>
      </aside>
    </div>
  );
}
