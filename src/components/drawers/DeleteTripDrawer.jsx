import React from "react";

export default function DeleteTripDrawer({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Delete this trip?</h2>
        <p className="text-sm text-zinc-600 mb-5">
          This permanently removes the trip from your saved list.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </aside>
    </div>
  );
}
