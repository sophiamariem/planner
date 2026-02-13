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
  onDeleteTrip,
  extractCoverImage,
  formatVisibilityLabel,
}) {
  const currentUserId = user?.id || null;
  const pillBase = "text-[11px] font-semibold px-2 py-0.5 rounded-full border";

  const visibilityPill = (visibility) => {
    const v = String(visibility || "").toLowerCase();
    if (v === "unlisted") {
      return { label: "Shared (link only)", className: `${pillBase} bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200` };
    }
    if (v === "public") {
      return { label: "Public", className: `${pillBase} bg-indigo-50 text-indigo-700 border-indigo-200` };
    }
    return null;
  };

  const rolePill = (role) => {
    const r = String(role || "").toLowerCase();
    if (r === "editor") {
      return { label: "You can edit", className: `${pillBase} bg-emerald-50 text-emerald-700 border-emerald-200` };
    }
    if (r === "viewer") {
      return { label: "View only", className: `${pillBase} bg-amber-50 text-amber-700 border-amber-200` };
    }
    return null;
  };

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
                  const isSharedWithMe = Boolean(currentUserId && trip?.owner_id && trip.owner_id !== currentUserId);
                  const isCopiedFromShared = Boolean(trip?.trip_data?.tripConfig?.copiedFrom?.ownerId);
                  const sharedVisibility = visibilityPill(trip.visibility);
                  const sharedRole = isSharedWithMe ? rolePill(trip?.my_role) : null;
                  const showPills = Boolean(isSharedWithMe || isCopiedFromShared || sharedVisibility || sharedRole);
                  return (
                    <div key={trip.id} className="rounded-xl border border-zinc-200 overflow-hidden bg-white relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteTrip(trip.id);
                        }}
                        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full border border-red-200 bg-white/95 text-red-600 hover:bg-red-50 flex items-center justify-center"
                        aria-label={`Delete ${trip.title || "trip"}`}
                        title="Delete trip"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
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
                          {showPills ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {isSharedWithMe ? (
                                <span className={`${pillBase} bg-blue-50 text-blue-700 border-blue-200`}>Shared with you</span>
                              ) : null}
                              {sharedRole ? <span className={sharedRole.className}>{sharedRole.label}</span> : null}
                              {isCopiedFromShared ? (
                                <span className={`${pillBase} bg-violet-50 text-violet-700 border-violet-200`}>Copied from shared</span>
                              ) : null}
                              {!isSharedWithMe && sharedVisibility ? (
                                <span className={sharedVisibility.className}>{sharedVisibility.label}</span>
                              ) : null}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-500 mt-1">{formatVisibilityLabel(trip.visibility)}</p>
                          )}
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
                  const isSharedWithMe = Boolean(currentUserId && trip?.owner_id && trip.owner_id !== currentUserId);
                  const isCopiedFromShared = Boolean(trip?.trip_data?.tripConfig?.copiedFrom?.ownerId);
                  const sharedVisibility = visibilityPill(trip.visibility);
                  const sharedRole = isSharedWithMe ? rolePill(trip?.my_role) : null;
                  const showPills = Boolean(isSharedWithMe || isCopiedFromShared || sharedVisibility || sharedRole);
                  return (
                    <div key={trip.id} className="rounded-xl border border-zinc-200 overflow-hidden bg-white relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteTrip(trip.id);
                        }}
                        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full border border-red-200 bg-white/95 text-red-600 hover:bg-red-50 flex items-center justify-center"
                        aria-label={`Delete ${trip.title || "trip"}`}
                        title="Delete trip"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
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
                          {showPills ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {isSharedWithMe ? (
                                <span className={`${pillBase} bg-blue-50 text-blue-700 border-blue-200`}>Shared with you</span>
                              ) : null}
                              {sharedRole ? <span className={sharedRole.className}>{sharedRole.label}</span> : null}
                              {isCopiedFromShared ? (
                                <span className={`${pillBase} bg-violet-50 text-violet-700 border-violet-200`}>Copied from shared</span>
                              ) : null}
                              {!isSharedWithMe && sharedVisibility ? (
                                <span className={sharedVisibility.className}>{sharedVisibility.label}</span>
                              ) : null}
                            </div>
                          ) : null}
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
