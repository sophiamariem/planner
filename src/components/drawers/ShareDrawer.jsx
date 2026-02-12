import React from "react";

export default function ShareDrawer({
  open,
  onClose,
  publishIssues,
  onFixIssue,
  currentShareURL,
  canCopyShareLink,
  onCopyShareLink,
  isSupabaseConfigured,
  user,
  cloudSaving,
  onOpenSignIn,
  cloudTripId,
  isCloudOwnedByCurrentUser,
  cloudShareAccess,
  onShareAccessChange,
  collaboratorEmail,
  onCollaboratorEmailChange,
  onAddCollaborator,
  collaboratorsLoading,
  collaborators,
  onRemoveCollaborator,
  isViewOnly,
  onViewOnlyChange,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-lg bg-white shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">Share Your Trip</h2>
        <p className="text-zinc-600 mb-4">
          Copy your short link.
        </p>
        <div className="flex flex-col gap-4">
          {publishIssues.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-medium text-amber-900 mb-2">Fix before sharing:</p>
              <div className="space-y-2">
                {publishIssues.map((issue) => (
                  <div key={issue.key} className="flex items-center justify-between gap-2">
                    <p className="text-xs text-amber-900">{issue.label}</p>
                    <button
                      type="button"
                      onClick={() => onFixIssue(issue.action)}
                      className="px-2 py-1 rounded border border-amber-300 text-amber-900 text-xs hover:bg-amber-100"
                    >
                      Fix
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={currentShareURL || ""}
              readOnly
              placeholder={
                !isSupabaseConfigured
                  ? "Sharing is unavailable right now"
                  : !user
                    ? "Sign in to generate a short share link"
                    : "Preparing short link..."
              }
              className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg bg-zinc-50 text-sm font-mono placeholder:font-sans placeholder:text-zinc-500"
            />
            <button
              onClick={onCopyShareLink}
              disabled={!canCopyShareLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copy
            </button>
          </div>
          {!canCopyShareLink && (
            <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50">
              {!isSupabaseConfigured ? (
                <p className="text-sm text-zinc-700">Sharing is unavailable right now.</p>
              ) : !user ? (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-700">Sign in to generate a short share link.</p>
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-black"
                  >
                    Create Account / Sign In
                  </button>
                </div>
              ) : (
                <p className="text-sm text-zinc-700">Preparing short link...</p>
              )}
            </div>
          )}

          {cloudTripId ? (
            <div className="flex flex-col gap-2 p-3 border border-zinc-200 rounded-xl bg-zinc-50">
              {isCloudOwnedByCurrentUser ? (
                <>
                  <label className="text-sm font-medium text-zinc-900">Shared access</label>
                  <select
                    value={cloudShareAccess}
                    onChange={(e) => onShareAccessChange(e.target.value)}
                    disabled={cloudSaving}
                    className="px-3 py-2 rounded-lg border border-zinc-300 text-sm bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="view">Shared (read-only)</option>
                    <option value="collaborate">Shared (collaborative)</option>
                  </select>
                  <p className="text-xs text-zinc-500">{cloudSaving ? "Saving shared access..." : "Shared access updates automatically."}</p>
                  {cloudShareAccess === "collaborate" && (
                    <div className="mt-2 border border-zinc-200 rounded-lg bg-white p-3 space-y-2">
                      <p className="text-xs font-semibold text-zinc-800">Collaborators who can edit</p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={collaboratorEmail}
                          onChange={(e) => onCollaboratorEmailChange(e.target.value)}
                          placeholder="name@example.com"
                          className="flex-1 px-2 py-1.5 rounded border border-zinc-300 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                          type="button"
                          onClick={onAddCollaborator}
                          disabled={collaboratorsLoading}
                          className="px-2.5 py-1.5 rounded bg-zinc-900 text-white text-xs font-medium disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                      {collaboratorsLoading ? (
                        <p className="text-xs text-zinc-500">Updating collaborators...</p>
                      ) : collaborators.length === 0 ? (
                        <p className="text-xs text-zinc-500">No collaborators yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {collaborators.map((c) => (
                            <div key={`${c.user_id}-${c.email}`} className="flex items-center justify-between gap-2">
                              <p className="text-xs text-zinc-700">{c.email}</p>
                              <button
                                type="button"
                                onClick={() => onRemoveCollaborator(c.email)}
                                className="px-2 py-1 rounded border border-rose-200 text-rose-700 text-xs hover:bg-rose-50"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-zinc-600">
                  This trip is currently <strong>{cloudShareAccess === "collaborate" ? "Shared (collaborative)" : "Shared (read-only)"}</strong>.
                </p>
              )}
            </div>
          ) : user ? (
            <div className="flex flex-col gap-2 p-3 border border-zinc-200 rounded-xl bg-zinc-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isViewOnly}
                  onChange={(e) => onViewOnlyChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-900">View Only Mode</span>
              </label>
              <p className="text-xs text-zinc-500 ml-6">
                Prevents others from seeing "Edit" or "Reset" buttons.
              </p>
            </div>
          ) : null}

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
