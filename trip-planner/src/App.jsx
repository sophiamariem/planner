import React, { useMemo, useState, useEffect } from "react";
import { tripConfig as defaultTripConfig, flights as defaultFlights, days as defaultDays, dayBadges as defaultDayBadges, palette, ll as defaultLocations } from "./data/trip";
import useFavicon from "./hooks/useFavicon";
import { ensureTailwindCDN } from "./utils/tailwind";
import { getTripFromURL, updateURLWithTrip, saveTripToLocalStorage, loadTripFromLocalStorage, generateShareURL, clearLocalStorageTrip, validateTripData, getSourceFromURL, getCloudFromURL, isViewOnlyFromURL } from "./utils/tripData";
import { isSupabaseConfigured, setSessionFromUrl } from "./lib/supabaseClient";
import { getCurrentUser, signInWithMagicLink, signOut, saveTripToCloud, updateCloudTrip, listMyTrips, loadCloudTripById, loadCloudTripByShareToken, loadCloudTripBySlug, generateShareToken } from "./lib/cloudTrips";

import FlightCard from "./components/FlightCard";
import DayCard from "./components/DayCard";
import CalendarView from "./components/CalendarView";
import TripBuilder from "./components/TripBuilder";

export default function TripPlannerApp() {
  const [mode, setMode] = useState('loading'); // 'loading', 'onboarding', 'builder', 'view'
  const [tripData, setTripData] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [sourceUrl, setSourceUrl] = useState(null);
  const [filter, setFilter] = useState("");
  const [showMaps] = useState(true);
  const [dense] = useState(false);
  const [view, setView] = useState("cards");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMyTripsModal, setShowMyTripsModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [cloudTripId, setCloudTripId] = useState(null);
  const [cloudSlug, setCloudSlug] = useState(null);
  const [shareToken, setShareToken] = useState(null);
  const [cloudVisibility, setCloudVisibility] = useState("private");
  const [cloudSaving, setCloudSaving] = useState(false);
  const [myTrips, setMyTrips] = useState([]);
  const [myTripsLoading, setMyTripsLoading] = useState(false);
  const [user, setUser] = useState(null);

  const templateJSON = JSON.stringify({
    tripConfig: {
      title: "Portugal City Escape",
      footer: "Spring city break",
      favicon: "https://example.com/favicon.png",
      calendar: { year: 2026, month: 3 },
      badgeLegend: [{ emoji: "✈️", label: "Flight" }, { emoji: "🚆", label: "Train" }]
    },
    flights: [
      { title: "Flight Out", num: "TP210", route: "JFK → LIS", date: "Sun, 12 Apr 2026", times: "19:10 → 07:10", codes: "JFK → LIS" }
    ],
    days: [
      {
        id: "12",
        dow: "Sun",
        date: "12 Apr",
        title: "Arrival in Lisbon",
        photos: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957"],
        hasMap: true,
        pins: [{ name: "Lisbon Airport", q: "Lisbon Airport", ll: [38.7742, -9.1342] }],
        notes: ["Airport transfer", "Hotel check-in"]
      }
    ],
    ll: {
      "Lisbon Airport": [38.7742, -9.1342]
    },
    palette: {
      bg: "from-blue-100 via-cyan-50 to-teal-50",
      card: "bg-white/90 border border-zinc-200 shadow-sm"
    }
  }, null, 2);

  const openImportModal = () => {
    setImportJson(templateJSON);
    setShowImportModal(true);
    setImportError("");
  };

  const pushToast = (message, tone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const refreshMyTrips = async (activeUser = user) => {
    if (!isSupabaseConfigured || !activeUser) return;
    setMyTripsLoading(true);
    try {
      const rows = await listMyTrips();
      setMyTrips(rows);
    } catch (error) {
      console.error("Error loading trips:", error);
      pushToast(error.message || "Could not load your cloud trips.", "error");
    } finally {
      setMyTripsLoading(false);
    }
  };

  const loadCloudTrip = async (cloudRef) => {
    let row;
    if (cloudRef.type === "share") {
      row = await loadCloudTripByShareToken(cloudRef.value);
    } else if (cloudRef.type === "slug") {
      row = await loadCloudTripBySlug(cloudRef.value);
    } else {
      row = await loadCloudTripById(cloudRef.value);
    }

    const validation = validateTripData(row.trip_data);
    if (!validation.valid) {
      throw new Error(`Invalid cloud trip data: ${validation.error}`);
    }

    setTripData(row.trip_data);
    setCloudTripId(row.id);
    setCloudSlug(row.slug || null);
    setShareToken(row.share_token || null);
    setCloudVisibility(row.visibility || "private");
    setSourceUrl(null);
    if (cloudRef.type === "share") {
      setIsViewOnly(true);
    }
    setMode('view');
  };

  // Load auth + trip data on mount (only runs once)
  useEffect(() => {
    ensureTailwindCDN();

    const viewOnly = isViewOnlyFromURL();
    setIsViewOnly(viewOnly);

    const initialize = async () => {
      if (isSupabaseConfigured) {
        try {
          setSessionFromUrl();
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          if (currentUser) {
            await refreshMyTrips(currentUser);
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
        }
      }

      // Check for cloud URL first
      const cloud = getCloudFromURL();
      if (cloud && isSupabaseConfigured) {
        try {
          await loadCloudTrip(cloud);
          return;
        } catch (error) {
          console.error("Error loading cloud trip:", error);
          pushToast(error.message || "Could not load cloud trip.", "error");
          setMode('onboarding');
          return;
        }
      }

    // Check for source URL first
      const source = getSourceFromURL();
      if (source) {
        setSourceUrl(source);
        setIsViewOnly(true); // Default to view-only for source trips
        fetch(source)
          .then(res => res.json())
          .then(data => {
            const validation = validateTripData(data);
            if (validation.valid) {
              setTripData(data);
              setMode('view');
            } else {
              console.error("Invalid trip data from source:", validation.error);
              setMode('onboarding');
            }
          })
          .catch(err => {
            console.error("Error fetching trip data from source:", err);
            setMode('onboarding');
          });
        return;
      }

      // Check URL next
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
    };

    initialize();

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, never again

  // Get active trip config and data
  const tripConfig = tripData?.tripConfig || defaultTripConfig;
  const flights = tripData?.flights || [];
  const days = useMemo(() => tripData?.days || [], [tripData?.days]);
  const dayBadges = tripData?.dayBadges || {};
  const activePalette = tripData?.palette || palette;

  const eventIds = useMemo(() => (days || []).map(d => Number(d.id)).sort((a,b)=>a-b), [days]);
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
    if (!cloudTripId) {
      updateURLWithTrip(newTripData);
    }
  };

  const handleSignIn = async () => {
    setShowSignInModal(true);
  };

  const submitSignIn = async () => {
    if (!signInEmail.trim()) {
      pushToast("Enter an email address.", "error");
      return;
    }

    setSignInLoading(true);
    try {
      await signInWithMagicLink(signInEmail.trim());
      setShowSignInModal(false);
      setSignInEmail("");
      pushToast("Magic link sent. Check your email.", "success");
    } catch (error) {
      console.error("Sign in error:", error);
      pushToast(error.message || "Could not send sign-in link.", "error");
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!isSupabaseConfigured) {
      pushToast("Cloud is not configured yet.", "error");
      return;
    }
    if (!user) {
      pushToast("Sign in first to save to cloud.", "error");
      return;
    }
    if (!tripData) {
      pushToast("No trip loaded.", "error");
      return;
    }

    setCloudSaving(true);
    try {
      const row = cloudTripId
        ? await updateCloudTrip(cloudTripId, tripData, cloudVisibility, cloudSlug)
        : await saveTripToCloud(tripData, cloudVisibility);

      setCloudTripId(row.id);
      setCloudSlug(row.slug || null);
      const cloudHash = row.slug ? `#t=${encodeURIComponent(row.slug)}` : `#cloud=${encodeURIComponent(row.id)}`;
      window.history.pushState(null, '', cloudHash);
      await refreshMyTrips();
      pushToast("Trip saved to cloud.", "success");
    } catch (error) {
      console.error("Cloud save failed:", error);
      pushToast(error.message || "Cloud save failed.", "error");
    } finally {
      setCloudSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
      setMyTrips([]);
    }
  };

  const handleOpenMyTrips = async () => {
    setShowMyTripsModal(true);
    await refreshMyTrips();
  };

  const handleOpenCloudTrip = async (id) => {
    try {
      await loadCloudTrip({ type: "id", value: id });
      const selected = myTrips.find((trip) => trip.id === id);
      const cloudHash = selected?.slug ? `#t=${encodeURIComponent(selected.slug)}` : `#cloud=${encodeURIComponent(id)}`;
      window.history.pushState(null, '', cloudHash);
      setShowMyTripsModal(false);
      setIsViewOnly(false);
      setSourceUrl(null);
    } catch (error) {
      console.error("Error opening trip:", error);
      pushToast(error.message || "Could not open trip.", "error");
    }
  };

  const handleGenerateShareToken = async () => {
    if (!cloudTripId) {
      pushToast("Save to cloud first before creating a share link.", "error");
      return;
    }
    try {
      const token = await generateShareToken(cloudTripId);
      setShareToken(token);
      pushToast("Public share token created.", "success");
    } catch (error) {
      console.error("Share token error:", error);
      pushToast(error.message || "Could not create share token.", "error");
    }
  };

  const handleEditTrip = () => {
    setMode('builder');
  };

  const handleSaveAndPreview = (newTripData) => {
    handleSaveTrip(newTripData);
    setMode('view');
    pushToast("Trip saved.", "success");
  };

  const handleCancelEdit = () => {
    setMode('view');
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    clearLocalStorageTrip();
    window.location.hash = "";
    setTripData(null);
    setCloudTripId(null);
    setCloudSlug(null);
    setShareToken(null);
    setSourceUrl(null);
    setShowResetModal(false);
    setMode('onboarding');
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
    setCloudTripId(null);
    setCloudSlug(null);
    setShareToken(null);
    setSourceUrl(null);
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
    setCloudTripId(null);
    setCloudSlug(null);
    setShareToken(null);
    setSourceUrl(null);
    setMode('builder');
  };

  const handleImportJson = () => {
    try {
      if (!importJson.trim()) {
        setImportError("Please paste some JSON data first.");
        return;
      }
      const parsed = JSON.parse(importJson);
      const validation = validateTripData(parsed);
      
      if (validation.valid) {
        // Automatically extract locations (ll) from pins if they are missing from top-level ll
        const importedLl = parsed.ll || {};
        const extractedLl = { ...importedLl };
        
        if (parsed.days && Array.isArray(parsed.days)) {
          parsed.days.forEach(day => {
            if (day.pins && Array.isArray(day.pins)) {
              day.pins.forEach(pin => {
                if (pin.name && pin.ll && !extractedLl[pin.name]) {
                  extractedLl[pin.name] = pin.ll;
                }
              });
            }
          });
        }

        // Automatically extract badges from notes if dayBadges is empty
        const importedBadges = parsed.dayBadges || {};
        const extractedBadges = { ...importedBadges };

        if (Object.keys(extractedBadges).length === 0 && parsed.days && Array.isArray(parsed.days)) {
          parsed.days.forEach(day => {
            const dayId = Number(day.id);
            if (isNaN(dayId)) return;
            
            const emojis = [];
            (day.notes || []).forEach(note => {
              // Extract common emojis used for badges
              const found = note.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
              if (found) emojis.push(...found);
            });
            
            if (emojis.length > 0) {
              extractedBadges[dayId] = [...new Set(emojis)]; // Unique emojis
            }
          });
        }

        // Ensure optional fields exist for the app state
        const sanitizedData = {
          ...parsed,
          flights: parsed.flights || [],
          days: (parsed.days || []).map(day => ({
            ...day,
            pins: day.pins || [],
            notes: day.notes || []
          })),
          ll: extractedLl,
          dayBadges: extractedBadges,
          palette: parsed.palette || palette
        };
        
        setTripData(sanitizedData);
        setCloudTripId(null);
        setCloudSlug(null);
        setShareToken(null);
        setSourceUrl(null);
        setMode('view');
        setShowImportModal(false);
        setImportJson("");
        setImportError("");
        // Save it so it persists
        saveTripToLocalStorage(sanitizedData);
        updateURLWithTrip(sanitizedData);
      } else {
        setImportError(`Invalid trip data: ${validation.error}`);
      }
    } catch (e) {
      setImportError("Invalid JSON format. Please check your syntax.");
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    const shareURL = generateShareURL(tripData, { viewOnly: isViewOnly, source: sourceUrl, cloudId: cloudTripId, cloudSlug, shareToken });
    if (shareURL) {
      navigator.clipboard.writeText(shareURL)
        .then(() => {
          pushToast("Link copied.", "success");
        })
        .catch(() => {
          pushToast("Could not copy link.", "error");
        });
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
            {isSupabaseConfigured && (
              <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-zinc-900 text-sm">Cloud account</p>
                  <p className="text-xs text-zinc-600">
                    {user ? `Signed in as ${user.email}` : "Sign in to save trips, reopen them later, and share cloud links."}
                  </p>
                </div>
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 rounded-lg border border-zinc-300 hover:bg-white text-sm"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-black text-sm"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleStartFromTemplate}
              className="w-full p-6 rounded-xl border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">🗺️</div>
                <div>
                  <h3 className="font-bold text-xl text-zinc-900 mb-2 group-hover:text-blue-700">
                    Start with Example Template
                  </h3>
                  <p className="text-zinc-600">
                    See a fully populated example trip that you can customize and make your own
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


            <button
              onClick={openImportModal}
              className="w-full p-6 rounded-xl border-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition-colors text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">💻</div>
                <div>
                  <h3 className="font-bold text-xl text-zinc-900 mb-2 group-hover:text-zinc-700">
                    Import JSON (Tech-savvy)
                  </h3>
                  <p className="text-zinc-600">
                    Paste your own trip JSON data to immediately load your itinerary
                  </p>
                </div>
              </div>
            </button>
          </div>

          {showImportModal && (
            <div className="fixed inset-0 z-50" onClick={() => setShowImportModal(false)}>
              <div className="absolute inset-0 bg-black/40" />
              <aside className="absolute right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-zinc-900 mb-4">Import Trip JSON</h2>
                <p className="text-zinc-600 mb-4 text-sm">
                  Paste your trip data JSON below. We've provided a complete template for you — just edit the values to match your trip!
                </p>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  className="w-full h-[58vh] p-3 border border-zinc-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder='{ "tripConfig": { ... }, "days": [], "flights": [] }'
                />
                {importError && (
                  <p className="text-red-600 text-sm mt-2">{importError}</p>
                )}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleImportJson}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Import Data
                  </button>
                </div>
              </aside>
            </div>
          )}

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
              {isSupabaseConfigured && (
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Optional cloud account with saved trips
                </li>
              )}
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
    <div className={`min-h-screen bg-gradient-to-b ${activePalette.bg}`}>
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">{tripConfig.title}</h1>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {isSupabaseConfigured && (
              <>
                {!user ? (
                  <button type="button" onClick={handleSignIn} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50">
                    Sign In
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={handleOpenMyTrips} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50">
                      My Saved Trips
                    </button>
                    <button type="button" onClick={handleSaveToCloud} disabled={cloudSaving} className="px-3 py-2 rounded-2xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">
                      {cloudSaving ? "Saving..." : cloudTripId ? "Update Cloud" : "Save to Cloud"}
                    </button>
                    <button type="button" onClick={handleSignOut} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50">
                      Sign Out
                    </button>
                  </>
                )}
              </>
            )}
            {!isViewOnly && !sourceUrl && (
              <button type="button" onClick={handleReset} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50 flex items-center gap-1 text-zinc-600 font-medium" title="Reset and go Home">
                <span>Reset</span>
              </button>
            )}
            <div className="inline-flex rounded-2xl overflow-hidden border border-zinc-300">
              <button type="button" onClick={()=>setView('cards')} className={`px-3 py-2 text-sm ${view==='cards' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Cards</button>
              <button type="button" onClick={()=>setView('calendar')} className={`px-3 py-2 text-sm border-l border-zinc-300 ${view==='calendar' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Calendar</button>
            </div>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter days, places, notes" className="px-3 py-2 rounded-2xl border border-zinc-300 bg-white text-sm outline-none focus:ring-2 focus:ring-pink-400"/>
            {filter && (<button type="button" onClick={()=>setFilter("")} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-white">Clear</button>)}
            <button type="button" onClick={handleShare} className="px-3 py-2 rounded-2xl bg-blue-600 text-white text-sm hover:bg-blue-700">Share</button>
            {!isViewOnly && !sourceUrl && (
              <button type="button" onClick={handleEditTrip} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-white">Edit</button>
            )}
            <button type="button" onClick={()=>window.print()} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-white">Print</button>
          </div>
        </div>
      </header>

      {toasts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 items-center">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-xl border px-4 py-3 text-sm shadow-lg max-w-[90vw] sm:max-w-md ${
                toast.tone === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : toast.tone === "error"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-white border-zinc-200 text-zinc-800"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {showSignInModal && (
        <div className="fixed inset-0 z-50" onClick={() => setShowSignInModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Sign In</h2>
            <p className="text-sm text-zinc-600 mb-4">Enter your email and we’ll send a magic sign-in link.</p>
            <input
              type="email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowSignInModal(false)}
                className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={submitSignIn}
                disabled={signInLoading}
                className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-black text-sm font-medium disabled:opacity-50"
              >
                {signInLoading ? "Sending..." : "Send Link"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-50" onClick={() => setShowResetModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Reset current trip?</h2>
            <p className="text-sm text-zinc-600 mb-5">
              This clears your local draft and returns to the start screen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Reset Trip
              </button>
            </div>
          </aside>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-50" onClick={() => setShowShareModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute right-0 top-0 h-full w-full sm:max-w-lg bg-white shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Share Your Trip</h2>
            <p className="text-zinc-600 mb-4">
              Copy this link to share your trip planner with others. Cloud trips use short slug links when available.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generateShareURL(tripData, { viewOnly: isViewOnly, source: sourceUrl, cloudId: cloudTripId, cloudSlug, shareToken })}
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

              <div className="flex flex-col gap-2 p-3 border border-zinc-200 rounded-xl bg-zinc-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isViewOnly}
                    onChange={(e) => setIsViewOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-zinc-900">View Only Mode</span>
                </label>
                <p className="text-xs text-zinc-500 ml-6">
                  Prevents others from seeing "Edit" or "Reset" buttons.
                </p>
              </div>

              {cloudTripId && !shareToken && (
                <button
                  onClick={handleGenerateShareToken}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
                >
                  Generate Public Share Token
                </button>
              )}

              {sourceUrl && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-800 font-medium">
                    ✨ Live Link Active: This trip is synced with the cloud and will stay updated!
                  </p>
                  <button
                    onClick={() => { setSourceUrl(null); }}
                    className="mt-2 text-xs text-green-700 underline hover:text-green-800"
                  >
                    Switch back to normal link (encoded in URL)
                  </button>
                </div>
              )}

              {cloudTripId && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  {cloudSlug && (
                    <p className="text-xs text-emerald-800 font-medium">
                      Slug: <code>{cloudSlug}</code>
                    </p>
                  )}
                  <p className="text-xs text-emerald-800 font-medium">
                    Cloud trip ID: <code>{cloudTripId}</code>
                  </p>
                  {shareToken && (
                    <p className="text-xs text-emerald-700 mt-1">
                      Share token active: <code>{shareToken}</code>
                    </p>
                  )}
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-800">
                  Share this link with friends so they can open your itinerary instantly. Turn on "View Only Mode" if you only want them to browse.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-6 w-full px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
            >
              Close
            </button>
          </aside>
        </div>
      )}

      {showMyTripsModal && (
        <div className="fixed inset-0 z-50" onClick={() => setShowMyTripsModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">My Cloud Trips</h2>
            <p className="text-zinc-600 mb-4 text-sm">Open one of your saved trips.</p>

            {myTripsLoading ? (
              <p className="text-sm text-zinc-600">Loading trips...</p>
            ) : myTrips.length === 0 ? (
              <p className="text-sm text-zinc-600">No cloud trips yet. Save your current trip first.</p>
            ) : (
              <div className="max-h-80 overflow-auto border border-zinc-200 rounded-xl divide-y divide-zinc-100">
                {myTrips.map((trip) => (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => handleOpenCloudTrip(trip.id)}
                    className="w-full text-left p-3 hover:bg-zinc-50"
                  >
                    <p className="font-medium text-zinc-900">{trip.title}</p>
                    <p className="text-xs text-zinc-500">
                      {trip.slug || "no-slug"} • {trip.visibility} • Updated {new Date(trip.updated_at || trip.created_at).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <label className="text-sm text-zinc-600">Default visibility:</label>
              <select
                value={cloudVisibility}
                onChange={(e) => setCloudVisibility(e.target.value)}
                className="px-3 py-2 rounded-lg border border-zinc-300 text-sm"
              >
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
            </div>

            <button
              onClick={() => setShowMyTripsModal(false)}
              className="mt-6 w-full px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
            >
              Close
            </button>
          </aside>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8">
        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-700 flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900">Status:</span>
          {cloudTripId ? (
            <>
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">Cloud synced</span>
              {cloudSlug && <span className="px-2 py-1 rounded-full bg-zinc-100 text-zinc-800">slug: {cloudSlug}</span>}
            </>
          ) : (
            <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800">Local draft</span>
          )}
          {!user && isSupabaseConfigured && (
            <span className="text-zinc-500">Sign in to sync and reopen on any device.</span>
          )}
        </div>

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
                    {(days || []).map(d => (
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
                    {(tripConfig.badgeLegend || []).map((badge, i) => (
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
                    <div className={'rounded-3xl p-5 ' + activePalette.card}>
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
