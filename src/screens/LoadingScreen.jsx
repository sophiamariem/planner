import React from "react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">✈️</div>
        <p className="text-zinc-600">Loading your trip...</p>
      </div>
    </div>
  );
}
