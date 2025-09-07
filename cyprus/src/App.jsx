import React, { useMemo, useState, useEffect } from "react";
import { flights, days, dayBadges, palette } from "./data/trip";
import useFavicon from "./hooks/useFavicon";
import { ensureTailwindCDN } from "./utils/tailwind";

import FlightCard from "./components/FlightCard";
import DayCard from "./components/DayCard";
import CalendarView from "./components/CalendarView";

export default function CyprusTripShare() {
  const [filter, setFilter] = useState("");
  const [showMaps] = useState(true);
  const [dense] = useState(false);
  const [view, setView] = useState("cards");

  const eventIds = useMemo(() => days.map(d => Number(d.id)).sort((a,b)=>a-b), []);
  const [selectedId, setSelectedId] = useState(eventIds[0] || null);
  const selectedDay = useMemo(() => days.find(d => Number(d.id) === selectedId) || null, [selectedId]);

  useEffect(() => { ensureTailwindCDN(); }, []);
  const imgClass = dense ? "h-44 md:h-56" : "h-56 md:h-72";
  const filtered = useMemo(() => {
    if (!filter) return days;
    return days.filter(d => `${d.dow} ${d.date} ${d.title} ${d.notes?.join(" ")}`.toLowerCase().includes(filter.toLowerCase()));
  }, [filter]);

  useFavicon("https://www.worldtravelguide.net/wp-content/uploads/2017/04/Think-Cyprus-AyiaNapa-514991484-Kirillm-copy.jpg");

  return (
      <div className={`min-h-screen bg-gradient-to-b ${palette.bg}`}>
        <header className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-zinc-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">Cyprus Trip • 15–24 Sep 2025</h1>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <div className="inline-flex rounded-2xl overflow-hidden border border-zinc-300">
                <button type="button" onClick={()=>setView('cards')} className={`px-3 py-2 text-sm ${view==='cards' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Cards</button>
                <button type="button" onClick={()=>setView('calendar')} className={`px-3 py-2 text-sm border-l border-zinc-300 ${view==='calendar' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Calendar</button>
              </div>
              <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter days, places, notes" className="px-3 py-2 rounded-2xl border border-zinc-300 bg-white text-sm outline-none focus:ring-2 focus:ring-pink-400"/>
              {filter && (<button type="button" onClick={()=>setFilter("")} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-white">Clear</button>)}
              <button type="button" onClick={()=>window.print()} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-white">Print</button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-4" id="flights">
            {flights.map((f, i) => (<FlightCard key={i} f={f}/>))}
          </div>

          {view==='cards' ? (
              <>
                <nav className="overflow-x-auto no-scrollbar" id="timeline">
                  <div className="flex items-center gap-2 w-max">
                    {days.map(d => (
                        <a key={d.id} href={`#day-${d.id}`} className="px-4 py-2 rounded-2xl bg-zinc-900 text-white text-sm hover:opacity-90 active:scale-[.99]">{d.dow} {d.date}</a>
                    ))}
                  </div>
                </nav>

                <div className="grid gap-8">
                  {filtered.map(d => (<DayCard key={d.id} d={d} showMaps={showMaps} imgClass={imgClass}/>))}
                </div>
              </>
          ) : (
              <>
                <CalendarView
                    year={2025}
                    month={8}
                    activeDays={days.map(d=>Number(d.id))}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    badges={dayBadges}
                />
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600">
                  <span className="px-2 py-1 rounded-full bg-white/80 border border-zinc-200">✈️ Flight</span>
                  <span className="px-2 py-1 rounded-full bg-white/80 border border-zinc-200">🎂 Birthday</span>
                  <span className="px-2 py-1 rounded-full bg-white/80 border border-zinc-200">🚗 Drive</span>
                  <span className="px-2 py-1 rounded-full bg-white/80 border border-zinc-200">🛥️ Boat</span>
                  <span className="px-2 py-1 rounded-full bg-white/80 border border-zinc-200">💍 Wedding</span>
                  <span className="px-2 py-1 rounded-full bg-white/80 border border-zinc-200">🏖️ Beach</span>
                  <span className="px-2 py-1 rounded-full bg-white/80 border border-zinc-200">⚓️ Marina</span>
                  <span className="px-2 py-1 rounded-full bg-white/80 border border-zinc-200">🌅 Sunset</span>
                </div>
                <div className="grid gap-8 mt-6">
                  {selectedDay ? (
                      <DayCard d={selectedDay} showMaps={showMaps} imgClass={imgClass}/>
                  ) : (
                      <div className={'rounded-3xl p-5 ' + palette.card}>
                        <p className="text-sm text-zinc-600">Pick a highlighted date to see its plan.</p>
                      </div>
                  )}
                </div>
              </>
          )}
          <footer className="pb-10 text-center text-sm text-zinc-500">Cyprus ☀️ Sept 2025</footer>
        </main>
      </div>
  );
}
