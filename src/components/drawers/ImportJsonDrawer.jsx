import React from "react";

export default function ImportJsonDrawer({
  open,
  isAdminUser,
  importJson,
  onImportJsonChange,
  importError,
  onClose,
  onImport,
}) {
  if (!open || !isAdminUser) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">Import Trip JSON</h2>
        <p className="text-zinc-600 mb-4 text-sm">
          Paste your trip data JSON below. We've provided a complete template for you — just edit the values to match your trip!
        </p>
        <textarea
          value={importJson}
          onChange={(e) => onImportJsonChange(e.target.value)}
          className="w-full h-[58vh] p-3 border border-zinc-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder='{ "tripConfig": { ... }, "days": [], "flights": [] }'
        />
        {importError && <p className="text-red-600 text-sm mt-2">{importError}</p>}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
          >
            Close
          </button>
          <button
            onClick={onImport}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Import Data
          </button>
        </div>
      </aside>
    </div>
  );
}
