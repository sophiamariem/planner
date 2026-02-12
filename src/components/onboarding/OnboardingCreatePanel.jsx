import React from "react";

export default function OnboardingCreatePanel({
  onStartFromTemplate,
  onStartFromScratch,
  quickTemplates,
  onStartFromQuickTemplate,
  isAdminUser,
  onOpenImportModal,
}) {
  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
        <h2 className="text-xl font-bold text-zinc-900 mb-3">Start a New Trip</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={onStartFromTemplate}
            className="p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-left"
          >
            <p className="font-semibold text-zinc-900">Example Template</p>
            <p className="text-sm text-zinc-600 mt-1">Start from a complete sample trip.</p>
          </button>
          <button
            onClick={onStartFromScratch}
            className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left"
          >
            <p className="font-semibold text-zinc-900">Start from Scratch</p>
            <p className="text-sm text-zinc-600 mt-1">Build every day yourself.</p>
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
        <p className="text-sm font-semibold text-zinc-900 mb-3">Templates</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onStartFromQuickTemplate(tpl.id)}
              className="rounded-xl border border-zinc-200 hover:border-zinc-300 p-3 text-left bg-zinc-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{tpl.emoji}</span>
                <p className="font-semibold text-sm text-zinc-900">{tpl.title}</p>
              </div>
              <p className="text-xs text-zinc-600 mt-1">{tpl.description}</p>
            </button>
          ))}
        </div>
      </section>

      {isAdminUser && (
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
          <button
            onClick={onOpenImportModal}
            className="w-full p-4 rounded-xl border-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 text-left"
          >
            <p className="font-semibold text-zinc-900">Import JSON (Admin)</p>
            <p className="text-sm text-zinc-600 mt-1">Load itinerary data directly.</p>
          </button>
        </section>
      )}
    </div>
  );
}
