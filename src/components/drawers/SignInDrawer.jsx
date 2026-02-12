import React from "react";

export default function SignInDrawer({
  open,
  onClose,
  isSupabaseConfigured,
  signInEmail,
  onEmailChange,
  onGoogleSignIn,
  onSubmitSignIn,
  signInLoading,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Sign In</h2>
        <p className="text-sm text-zinc-600 mb-4">Continue with Google or use an email magic link.</p>
        <button
          type="button"
          onClick={() => {
            window.history.pushState(null, "", "/auth");
            onClose();
          }}
          className="text-xs text-blue-700 hover:underline mb-3"
        >
          Open full sign-in page
        </button>
        {!isSupabaseConfigured && (
          <p className="text-sm text-amber-700 mb-4">
            Sign in is temporarily unavailable right now.
          </p>
        )}
        <button
          onClick={onGoogleSignIn}
          disabled={!isSupabaseConfigured}
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with Google
        </button>
        <div className="flex items-center gap-2 my-4">
          <div className="h-px bg-zinc-200 flex-1" />
          <span className="text-xs text-zinc-500 uppercase tracking-wide">or</span>
          <div className="h-px bg-zinc-200 flex-1" />
        </div>
        <input
          type="email"
          value={signInEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
          >
            Close
          </button>
          <button
            onClick={onSubmitSignIn}
            disabled={signInLoading || !isSupabaseConfigured}
            className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-black text-sm font-medium disabled:opacity-50"
          >
            {signInLoading ? "Sending..." : "Send Link"}
          </button>
        </div>
      </aside>
    </div>
  );
}
