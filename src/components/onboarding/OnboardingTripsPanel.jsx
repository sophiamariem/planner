import React from "react";

export default function OnboardingTripsPanel({
  user,
  onGoCreate,
  onSignOut,
  onSignIn,
  savedUpcomingTrips,
  savedPastTrips,
  showPastSavedTrips,
  onTogglePast,
  onOpenTrip,
  extractCoverImage,
  formatVisibilityLabel,
}) {
  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Account</p>
            <p className="text-sm text-zinc-600 mt-1">
              {user ? `Signed in as ${user.email}` : "Sign in to save and sync trips across devices."}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${user ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
            {user ? "Signed in" : "Guest"}
          </div>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          {user ? (
            <>
              <button
                type="button"
                onClick={onGoCreate}
                className="px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-black text-sm font-medium"
              >
                Create New Trip
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-sm font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-black text-sm font-medium"
            >
              Create Account / Sign In
            </button>
          )}
        </div>
      </section>

      {user ? (
        <>
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
            <h3 className="text-base font-semibold text-zinc-900 mb-3">Upcoming ({savedUpcomingTrips.length})</h3>
            {savedUpcomingTrips.length === 0 ? (
              <p className="text-sm text-zinc-500">No upcoming trips yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                          {cover && <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />}
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-zinc-900">{trip.title}</p>
                          <p className="text-xs text-zinc-500 mt-1">{trip.slug || "no-slug"} • {formatVisibilityLabel(trip.visibility)}</p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
            <button
              type="button"
              onClick={onTogglePast}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between"
            >
              <span>Past ({savedPastTrips.length})</span>
              <span>{showPastSavedTrips ? "Hide" : "Show"}</span>
            </button>
            {showPastSavedTrips && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {savedPastTrips.map((trip) => {
                  const cover = extractCoverImage(trip);
                  return (
                    <div key={trip.id} className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => onOpenTrip(trip.id)}
                        className="w-full text-left hover:bg-zinc-50"
                      >
                        <div className="h-24 bg-zinc-100">
                          {cover && <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />}
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-zinc-900">{trip.title}</p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
          <p className="text-sm text-zinc-600">No saved trips in guest mode. Create a trip or sign in to sync across devices.</p>
        </section>
      )}
    </div>
  );
}
