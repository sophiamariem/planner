import React from "react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <a href="/app" className="flex items-center gap-3 hover:opacity-90 transition-opacity" aria-label="Go to homepage">
              <img
                src="/favicon.png"
                alt="PLNR logo"
                className="w-10 h-10 rounded-xl border border-zinc-200 bg-white object-cover"
              />
              <div>
                <h1 className="text-2xl font-black text-zinc-900">PLNR Privacy Policy</h1>
                <p className="text-xs text-zinc-500">Last updated: February 12, 2026</p>
              </div>
            </a>
          </div>

          <div className="space-y-4 text-sm text-zinc-700 leading-6">
            <p>
              PLNR helps you create, save, and share travel itineraries. This policy explains what data we use and how.
            </p>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">What we collect</h2>
              <p>
                When you sign in, we store your account identifier (such as email via Supabase Auth). For trips, we store
                itinerary content you create, including titles, dates, notes, flights, and photos you attach.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">How we use your data</h2>
              <p>
                We use your data to provide core app features: saving your trips, syncing across devices, and sharing links
                you explicitly create.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Sharing and visibility</h2>
              <p>
                Trips are private by default. You can choose shared modes (read-only or collaborative). Only users and links
                you share can access shared trips according to your selected permissions.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Storage providers</h2>
              <p>
                PLNR uses Supabase for authentication and database storage. Media you import may be stored in your configured
                Supabase Storage bucket.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Your controls</h2>
              <p>
                You can edit or delete your trips at any time from the app. If you need account-level data removal, contact
                the app owner.
              </p>
              <p className="mt-2">
                Contact:{" "}
                <a className="text-blue-700 hover:underline" href="mailto:soru.events+plnr@gmail.com">
                  soru.events+plnr@gmail.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-200 flex items-center justify-between gap-3">
            <a href="/" className="text-sm font-medium text-blue-700 hover:underline">
              Back to PLNR
            </a>
            <a href="/app" className="text-xs text-zinc-500 hover:underline">PLNR</a>
          </div>
        </div>
      </div>
    </div>
  );
}
