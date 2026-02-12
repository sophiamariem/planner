import React, { useRef } from "react";
import FlightCard from "./FlightCard";
import DayCard from "./DayCard";
import CalendarView from "./CalendarView";
import TripStatusBar from "./TripStatusBar";

export default function TripPreviewContent({
  tripConfig,
  cloudTripId,
  cloudSlug,
  user,
  isSupabaseConfigured,
  flights,
  days,
  onEditTrip,
  view,
  filtered,
  showMaps,
  imgClass,
  selectedId,
  onSelectDay,
  dayBadges,
  selectedDay,
  activePaletteCard,
}) {
  const selectedDayRef = useRef(null);

  const handleSelectFromCalendar = (id) => {
    onSelectDay?.(id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        selectedDayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8">
      {tripConfig.cover && (
        <div className="rounded-3xl overflow-hidden border border-zinc-200 shadow-sm bg-white">
          <img src={tripConfig.cover} alt="" className="w-full h-48 md:h-72 object-cover" loading="lazy" />
        </div>
      )}
      <TripStatusBar
        cloudTripId={cloudTripId}
        cloudSlug={cloudSlug}
        user={user}
        isSupabaseConfigured={isSupabaseConfigured}
      />

      {flights.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4" id="flights">
          {flights.map((f, i) => (<FlightCard key={i} f={f} />))}
        </div>
      )}

      {days.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <p className="text-zinc-600 mb-4">No days added to your itinerary yet.</p>
          <button
            onClick={onEditTrip}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Days
          </button>
        </div>
      ) : (
        <>
          {view === "cards" ? (
            <>
              <nav className="overflow-x-auto no-scrollbar" id="timeline">
                <div className="flex items-center gap-2 w-max">
                  {(days || []).map(d => (
                    <a key={d.id} href={`#day-${d.id}`} className="px-4 py-2 rounded-2xl bg-zinc-900 text-white text-sm hover:opacity-90 active:scale-[.99]">{d.dow} {d.date}</a>
                  ))}
                </div>
              </nav>

              <div className="grid gap-8">
                {filtered.map(d => (<DayCard key={d.id} d={d} showMaps={showMaps} imgClass={imgClass} />))}
              </div>
            </>
          ) : (
            <>
              <CalendarView
                year={tripConfig.calendar.year}
                month={tripConfig.calendar.month}
                days={days}
                selectedId={selectedId}
                onSelect={handleSelectFromCalendar}
                badges={dayBadges}
              />
              {tripConfig.badgeLegend && tripConfig.badgeLegend.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600">
                  {(tripConfig.badgeLegend || []).map((badge, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-white/80 border border-zinc-200">
                      {badge.emoji} {badge.label}
                    </span>
                  ))}
                </div>
              )}
              <div ref={selectedDayRef} className="grid gap-8 mt-6">
                {selectedDay ? (
                  <DayCard d={selectedDay} showMaps={showMaps} imgClass={imgClass} />
                ) : (
                  <div className={`rounded-3xl p-5 ${activePaletteCard}`}>
                    <p className="text-sm text-zinc-600">Pick a highlighted date to see its plan.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
      <footer className="pb-10 text-center text-sm text-zinc-500">{tripConfig.footer}</footer>
    </main>
  );
}
