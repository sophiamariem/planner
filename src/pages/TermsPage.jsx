import React from "react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/favicon.png"
              alt="PLNR logo"
              className="w-10 h-10 rounded-xl border border-zinc-200 bg-white object-cover"
            />
            <div>
              <h1 className="text-2xl font-black text-zinc-900">PLNR Terms of Service</h1>
              <p className="text-xs text-zinc-500">Last updated: February 12, 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-zinc-700 leading-6">
            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Acceptance</h2>
              <p>
                By using PLNR, you agree to these terms. If you do not agree, do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Your content</h2>
              <p>
                You are responsible for the trips and media you upload. You must have the right to use and share that content.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Account and sharing</h2>
              <p>
                You are responsible for activity on your account. Shared links should be treated as access tokens; anyone with a
                link may access content according to the sharing mode you selected.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Acceptable use</h2>
              <p>
                Do not use PLNR for unlawful, abusive, or harmful behavior, including attempts to access data that does not belong
                to you.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Service availability</h2>
              <p>
                PLNR is provided on an "as is" basis. Features may change, and availability is not guaranteed.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Contact</h2>
              <p>
                Questions about these terms:{" "}
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
            <span className="text-xs text-zinc-500">PLNR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
