import React, { useMemo, useState, useEffect } from "react";
import { tripConfig as defaultTripConfig, flights as defaultFlights, days as defaultDays, dayBadges as defaultDayBadges, palette, ll as defaultLocations } from "./data/trip";
import useFavicon from "./hooks/useFavicon";
import { ensureTailwindCDN } from "./utils/tailwind";
import { getTripFromURL, updateURLWithTrip, saveTripToLocalStorage, loadTripFromLocalStorage, generateShareURL, clearLocalStorageTrip } from "./utils/tripData";

import FlightCard from "./components/FlightCard";
import DayCard from "./components/DayCard";
import CalendarView from "./components/CalendarView";
import TripBuilder from "./components/TripBuilder";

export default function TripPlannerApp() {
  const [mode, setMode] = useState('loading'); // 'loading', 'onboarding', 'builder', 'view'
  const [tripData, setTripData] = useState(null);
  const [filter, setFilter] = useState("");
  const [showMaps] = useState(true);
  const [dense] = useState(false);
  const [view, setView] = useState("cards");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  // Load trip data on mount (only runs once)
  useEffect(() => {
    ensureTailwindCDN();

    // Check URL first
    const urlTrip = getTripFromURL();
    if (urlTrip) {
      setTripData(urlTrip);
      setMode('view');
      return;
    }

    // Check localStorage backup
    const localTrip = loadTripFromLocalStorage();
    if (localTrip) {
      setTripData(localTrip);
      setMode('view');
      return;
    }

    // Show onboarding
    setMode('onboarding');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, never again

  // Get active trip config and data
  const tripConfig = tripData?.tripConfig || defaultTripConfig;
  const flights = tripData?.flights || [];
  const days = tripData?.days || [];
  const dayBadges = tripData?.dayBadges || {};

  const eventIds = useMemo(() => days.map(d => Number(d.id)).sort((a,b)=>a-b), [days]);
  const [selectedId, setSelectedId] = useState(eventIds[0] || null);
  const selectedDay = useMemo(() => days.find(d => Number(d.id) === selectedId) || null, [selectedId, days]);

  const imgClass = dense ? "h-44 md:h-56" : "h-56 md:h-72";
  const filtered = useMemo(() => {
    if (!filter) return days;
    return days.filter(d => `${d.dow} ${d.date} ${d.title} ${d.notes?.join(" ")}`.toLowerCase().includes(filter.toLowerCase()));
  }, [filter, days]);

  useFavicon(tripConfig.favicon);

  const handleSaveTrip = (newTripData) => {
    setTripData(newTripData);
    saveTripToLocalStorage(newTripData);
    updateURLWithTrip(newTripData);
  };

  const handleEditTrip = () => {
    setMode('builder');
  };

  const handleSaveAndPreview = (newTripData) => {
    handleSaveTrip(newTripData);
    setMode('view');
    // Show notification that link has been updated
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 5000); // Hide after 5 seconds
  };

  const handleCancelEdit = () => {
    setMode('view');
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset? This will clear your current trip data and return you to the home screen.")) {
      clearLocalStorageTrip();
      window.location.hash = "";
      setTripData(null);
      setMode('onboarding');
    }
  };

  const handleStartFromTemplate = () => {
    const templateData = {
      tripConfig: defaultTripConfig,
      flights: defaultFlights,
      days: defaultDays,
      dayBadges: defaultDayBadges,
      ll: defaultLocations,
      palette
    };
    setTripData(templateData);
    setMode('builder');
  };

  const handleStartFromScratch = () => {
    const emptyData = {
      tripConfig: {
        title: "My Trip",
        footer: "My Adventure",
        favicon: null,
        calendar: { year: new Date().getFullYear(), month: new Date().getMonth() },
        badgeLegend: []
      },
      flights: [],
      days: [],
      dayBadges: {},
      ll: {},
      palette
    };
    setTripData(emptyData);
    setMode('builder');
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    const shareURL = generateShareURL(tripData);
    if (shareURL) {
      navigator.clipboard.writeText(shareURL);
      alert('Link copied to clipboard!');
    }
  };

  // Onboarding screen
  if (mode === 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4">
              Trip Planner
            </h1>
            <p className="text-lg text-zinc-600">
              Create beautiful, shareable trip itineraries in minutes
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleStartFromTemplate}
              className="w-full p-6 rounded-xl border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">🗺️</div>
                <div>
                  <h3 className="font-bold text-xl text-zinc-900 mb-2 group-hover:text-blue-700">
                    Start with Cyprus Template
                  </h3>
                  <p className="text-zinc-600">
                    See a fully populated example (Cyprus 2025) that you can customize and make your own
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleStartFromScratch}
              className="w-full p-6 rounded-xl border-2 border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition-colors text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">✨</div>
                <div>
                  <h3 className="font-bold text-xl text-zinc-900 mb-2 group-hover:text-zinc-700">
                    Start from Scratch
                  </h3>
                  <p className="text-zinc-600">
                    Begin with a blank canvas and build your trip from the ground up
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-200">
            <h4 className="font-semibold text-zinc-900 mb-3">Features:</h4>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                No sign-up required - completely free
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Get a shareable link to your trip
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Interactive maps and photo galleries
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Print-friendly itineraries
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">✈️</div>
          <p className="text-zinc-600">Loading your trip...</p>
        </div>
      </div>
    );
  }

  // Builder mode
  if (mode === 'builder') {
    return (
      <TripBuilder
        tripData={tripData}
        onSave={handleSaveAndPreview}
        onCancel={handleCancelEdit}
        onReset={handleReset}
      />
    );
  }

  // View mode
  return (
    <div className={`min-h-screen bg-gradient-to-b ${palette.bg}`}>
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">{tripConfig.title}</h1>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <button type="button" onClick={handleReset} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50 flex items-center gap-1 text-zinc-600 font-medium" title="Reset and go Home">
              <span>Reset</span>
            </button>
            <div className="inline-flex rounded-2xl overflow-hidden border border-zinc-300">
              <button type="button" onClick={()=>setView('cards')} className={`px-3 py-2 text-sm ${view==='cards' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Cards</button>
              <button type="button" onClick={()=>setView('calendar')} className={`px-3 py-2 text-sm border-l border-zinc-300 ${view==='calendar' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Calendar</button>
            </div>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter days, places, notes" className="px-3 py-2 rounded-2xl border border-zinc-300 bg-white text-sm outline-none focus:ring-2 focus:ring-pink-400"/>
            {filter && (<button type="button" onClick={()=>setFilter("")} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-white">Clear</button>)}
            <button type="button" onClick={handleShare} className="px-3 py-2 rounded-2xl bg-blue-600 text-white text-sm hover:bg-blue-700">Share</button>
            <button type="button" onClick={handleEditTrip} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-white">Edit</button>
            <button type="button" onClick={()=>window.print()} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-white">Print</button>
          </div>
        </div>
      </header>

      {/* Save Notification */}
      {showSaveNotification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-semibold">Trip Saved!</p>
              <p className="text-sm text-green-100">Your shareable link has been updated. Click "Share" to copy it.</p>
            </div>
            <button onClick={() => setShowSaveNotification(false)} className="ml-4 text-white hover:text-green-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Share Your Trip</h2>
            <p className="text-zinc-600 mb-4">
              Copy this link to share your trip planner with others. They can view it and even remix it to create their own version!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={generateShareURL(tripData)}
                readOnly
                className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg bg-zinc-50 text-sm font-mono"
              />
              <button
                onClick={copyShareLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Copy
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Tip:</strong> Anyone with this link can click "Edit" to create their own customized version!
              </p>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8">
        {flights.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4" id="flights">
            {flights.map((f, i) => (<FlightCard key={i} f={f}/>))}
          </div>
        )}

        {days.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-zinc-600 mb-4">No days added to your itinerary yet.</p>
            <button
              onClick={handleEditTrip}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Add Days
            </button>
          </div>
        ) : (
          <>
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
                  year={tripConfig.calendar.year}
                  month={tripConfig.calendar.month}
                  activeDays={days.map(d=>Number(d.id))}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  badges={dayBadges}
                />
                {tripConfig.badgeLegend && tripConfig.badgeLegend.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600">
                    {tripConfig.badgeLegend.map((badge, i) => (
                      <span key={i} className="px-2 py-1 rounded-full bg-white/80 border border-zinc-200">
                        {badge.emoji} {badge.label}
                      </span>
                    ))}
                  </div>
                )}
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
          </>
        )}
        <footer className="pb-10 text-center text-sm text-zinc-500">{tripConfig.footer}</footer>
      </main>
    </div>
  );
}
