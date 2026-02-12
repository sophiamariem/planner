import React from "react";

export default function AuthPage({
  user,
  isSupabaseConfigured,
  signInEmail,
  onEmailChange,
  onGoogleSignIn,
  onSubmitSignIn,
  signInLoading,
  onContinueToApp,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-xl p-6">
        <h1 className="text-2xl font-bold text-zinc-900">Account</h1>
        <p className="text-sm text-zinc-600 mt-1 mb-4">
          Sign in to save, sync, and reopen trips on any device.
        </p>
        {!isSupabaseConfigured && (
          <p className="text-sm text-amber-700 mb-4">
            Sign in is temporarily unavailable right now.
          </p>
        )}
        {user ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-700">Signed in as {user.email}</p>
            <button
              type="button"
              onClick={onContinueToApp}
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-black"
            >
              Continue to App
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={!isSupabaseConfigured}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium disabled:opacity-50"
            >
              Continue with Google
            </button>
            <input
              type="email"
              value={signInEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={onSubmitSignIn}
              disabled={signInLoading || !isSupabaseConfigured}
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50"
            >
              {signInLoading ? "Sending..." : "Send Magic Link"}
            </button>
            <button
              type="button"
              onClick={onContinueToApp}
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 text-sm font-medium hover:bg-zinc-50"
            >
              Continue as Guest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
