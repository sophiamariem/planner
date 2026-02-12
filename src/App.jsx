import React, { useMemo, useState, useEffect } from "react";
import { tripConfig as defaultTripConfig, flights as defaultFlights, days as defaultDays, dayBadges as defaultDayBadges, palette, ll as defaultLocations } from "./data/trip";
import useFavicon from "./hooks/useFavicon";
import { ensureTailwindCDN } from "./utils/tailwind";
import { getTripFromURL, updateURLWithTrip, saveTripToLocalStorage, loadTripFromLocalStorage, generateShareURL, clearLocalStorageTrip, validateTripData, getSourceFromURL, getCloudFromURL, isViewOnlyFromURL } from "./utils/tripData";
import { isSupabaseConfigured, setSessionFromUrl } from "./lib/supabaseClient";
import { getCurrentUser, signInWithMagicLink, signInWithGoogle, signOut, saveTripToCloud, updateCloudTrip, listMyTrips, loadCloudTripById, loadCloudTripByShareToken, loadCloudTripBySlug, generateShareToken, deleteCloudTripById } from "./lib/cloudTrips";

import FlightCard from "./components/FlightCard";
import DayCard from "./components/DayCard";
import CalendarView from "./components/CalendarView";
import TripBuilder from "./components/TripBuilder";

const QUICK_TEMPLATES = [
  {
    id: "city",
    emoji: "🏙️",
    title: "City Break",
    description: "Museums, cafes, neighborhoods",
    cover: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "beach",
    emoji: "🏖️",
    title: "Beach Week",
    description: "Relaxed days by the coast",
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "road",
    emoji: "🚗",
    title: "Road Trip",
    description: "Multi-stop adventure",
    cover: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "family",
    emoji: "👨‍👩‍👧‍👦",
    title: "Family Trip",
    description: "Kid-friendly pace and plans",
    cover: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80",
  },
];

const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || "sophiamariem@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function extractStartIsoFromTrip(tripLike) {
  const days = tripLike?.days || tripLike?.trip_data?.days || [];
  const isoDates = (days || []).map((d) => d.isoDate).filter(Boolean).sort();
  if (isoDates.length) return isoDates[0];
  return null;
}

function extractEndIsoFromTrip(tripLike) {
  const days = tripLike?.days || tripLike?.trip_data?.days || [];
  const isoDates = (days || []).map((d) => d.isoDate).filter(Boolean).sort();
  if (isoDates.length) return isoDates[isoDates.length - 1];
  return null;
}

function extractCoverImage(tripLike) {
  return (
    tripLike?.tripConfig?.cover ||
    tripLike?.trip_data?.tripConfig?.cover ||
    tripLike?.days?.find((d) => (d.photos || []).length > 0)?.photos?.[0] ||
    tripLike?.trip_data?.days?.find((d) => (d.photos || []).length > 0)?.photos?.[0] ||
    null
  );
}

function buildTemplateTrip(templateId, paletteValue) {
  const map = {
    city: {
      tripConfig: {
        title: "City Break",
        footer: "48 hours in the city",
        favicon: null,
        cover: QUICK_TEMPLATES[0].cover,
        calendar: { year: 2026, month: 4 },
        badgeLegend: [{ emoji: "🏛️", label: "Culture" }, { emoji: "🍽️", label: "Food" }],
      },
      flights: [],
      days: [
        { id: "10", isoDate: "2026-05-10", dow: "Sun", date: "10 May", title: "Arrival + old town walk", photos: [], hasMap: false, route: "", pins: [], notes: ["Hotel check-in", "Sunset viewpoint"] },
        { id: "11", isoDate: "2026-05-11", dow: "Mon", date: "11 May", title: "Museums + food market", photos: [], hasMap: false, route: "", pins: [], notes: ["Museum in the morning", "Market lunch"] },
        { id: "12", isoDate: "2026-05-12", dow: "Tue", date: "12 May", title: "Departure", photos: [], hasMap: false, route: "", pins: [], notes: ["Brunch", "Airport transfer"] },
      ],
      dayBadges: { 10: ["🏛️"], 11: ["🍽️"] },
      ll: {},
      palette: paletteValue,
    },
    beach: {
      tripConfig: {
        title: "Beach Week",
        footer: "Sun, swim, repeat",
        favicon: null,
        cover: QUICK_TEMPLATES[1].cover,
        calendar: { year: 2026, month: 6 },
        badgeLegend: [{ emoji: "🏖️", label: "Beach" }, { emoji: "🌅", label: "Sunset" }],
      },
      flights: [],
      days: [
        { id: "6", isoDate: "2026-07-06", dow: "Mon", date: "6 Jul", title: "Arrival + beach sunset", photos: [], hasMap: false, route: "", pins: [], notes: ["Check-in", "Golden hour swim"] },
        { id: "7", isoDate: "2026-07-07", dow: "Tue", date: "7 Jul", title: "Boat day", photos: [], hasMap: false, route: "", pins: [], notes: ["Snorkel stop", "Beach dinner"] },
        { id: "8", isoDate: "2026-07-08", dow: "Wed", date: "8 Jul", title: "Departure", photos: [], hasMap: false, route: "", pins: [], notes: ["Slow morning", "Checkout"] },
      ],
      dayBadges: { 6: ["🏖️"], 7: ["🌅"] },
      ll: {},
      palette: paletteValue,
    },
    road: {
      tripConfig: {
        title: "Road Trip",
        footer: "Drive, stop, explore",
        favicon: null,
        cover: QUICK_TEMPLATES[2].cover,
        calendar: { year: 2026, month: 8 },
        badgeLegend: [{ emoji: "🚗", label: "Drive" }, { emoji: "⛰️", label: "Scenic" }],
      },
      flights: [],
      days: [
        { id: "2", isoDate: "2026-09-02", dow: "Wed", date: "2 Sep", title: "Pickup + first leg", photos: [], hasMap: true, route: "", pins: [], notes: ["Collect car", "Scenic stop"] },
        { id: "3", isoDate: "2026-09-03", dow: "Thu", date: "3 Sep", title: "Mountain loop", photos: [], hasMap: true, route: "", pins: [], notes: ["Coffee stop", "Hike"] },
        { id: "4", isoDate: "2026-09-04", dow: "Fri", date: "4 Sep", title: "Final city + return", photos: [], hasMap: true, route: "", pins: [], notes: ["City lunch", "Return car"] },
      ],
      dayBadges: { 2: ["🚗"], 3: ["⛰️"] },
      ll: {},
      palette: paletteValue,
    },
    family: {
      tripConfig: {
        title: "Family Trip",
        footer: "Fun at a comfortable pace",
        favicon: null,
        cover: QUICK_TEMPLATES[3].cover,
        calendar: { year: 2026, month: 3 },
        badgeLegend: [{ emoji: "🎡", label: "Activities" }, { emoji: "🍽️", label: "Family meal" }],
      },
      flights: [],
      days: [
        { id: "18", isoDate: "2026-04-18", dow: "Sat", date: "18 Apr", title: "Arrival + easy afternoon", photos: [], hasMap: false, route: "", pins: [], notes: ["Hotel pool", "Early dinner"] },
        { id: "19", isoDate: "2026-04-19", dow: "Sun", date: "19 Apr", title: "Main activity day", photos: [], hasMap: false, route: "", pins: [], notes: ["Theme park morning", "Nap break"] },
        { id: "20", isoDate: "2026-04-20", dow: "Mon", date: "20 Apr", title: "Departure", photos: [], hasMap: false, route: "", pins: [], notes: ["Pack slowly", "Airport"] },
      ],
      dayBadges: { 19: ["🎡"] },
      ll: {},
      palette: paletteValue,
    },
  };
  return map[templateId] || null;
}

export default function TripPlannerApp() {
  const isAuthRoute = typeof window !== "undefined" && window.location.pathname === "/auth";
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
  const [builderStartTab, setBuilderStartTab] = useState("basic");
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [cloudTripId, setCloudTripId] = useState(null);
  const [cloudSlug, setCloudSlug] = useState(null);
  const [shareToken, setShareToken] = useState(null);
  const [cloudVisibility, setCloudVisibility] = useState("private");
  const [cloudShareAccess, setCloudShareAccess] = useState("view");
  const [cloudOwnerId, setCloudOwnerId] = useState(null);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [myTrips, setMyTrips] = useState([]);
  const [myTripsLoading, setMyTripsLoading] = useState(false);
  const [showPastSavedTrips, setShowPastSavedTrips] = useState(false);
  const [user, setUser] = useState(null);
  const isAdminUser = Boolean(user?.email && ADMIN_EMAILS.includes(String(user.email).toLowerCase()));

  const templateJSON = JSON.stringify({
    tripConfig: {
      title: "Portugal City Escape",
      footer: "Spring city break",
      favicon: "https://example.com/favicon.png",
      cover: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
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
    if (!isAdminUser) {
      pushToast("This import tool is only available to admins.", "error");
      return;
    }
    setImportJson(templateJSON);
    setShowImportModal(true);
    setImportError("");
  };

  const toSafeUserMessage = (message, fallback) => {
    const raw = String(message || "").trim();
    if (!raw) return fallback;
    const lower = raw.toLowerCase();
    if (
      lower.includes("supabase") ||
      lower.includes("react_app_") ||
      lower.includes("expo_public_") ||
      lower.includes("jwt") ||
      lower.includes("token") ||
      lower.includes("postgres") ||
      lower.includes("sql") ||
      lower.includes("schema") ||
      lower.includes("relation") ||
      lower.includes("policy") ||
      lower.includes("auth/v1") ||
      lower.includes("rest/v1") ||
      lower.includes("unsupported provider") ||
      lower.includes("provider is not enabled")
    ) {
      return fallback;
    }
    return raw;
  };

  const pushToast = (message, tone = "info") => {
    const safeMessage = toSafeUserMessage(
      message,
      tone === "error" ? "Something went wrong. Please try again." : "Done."
    );
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message: safeMessage, tone }]);
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
      pushToast(error.message || "Could not load your saved trips.", "error");
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
      throw new Error(`Invalid saved trip data: ${validation.error}`);
    }

    setTripData(row.trip_data);
    setCloudTripId(row.id);
    setCloudSlug(row.slug || null);
    setShareToken(row.share_token || null);
    setCloudVisibility(row.visibility || "private");
    setCloudShareAccess(row.share_access || "view");
    setCloudOwnerId(row.owner_id || null);
    setSourceUrl(null);
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
          console.error("Error loading saved trip:", error);
          pushToast(error.message || "Could not load saved trip.", "error");
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

  const { savedUpcomingTrips, savedPastTrips } = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const upcoming = [];
    const past = [];

    for (const trip of myTrips) {
      const endIso = extractEndIsoFromTrip(trip);
      if (endIso && endIso < todayIso) {
        past.push(trip);
      } else {
        upcoming.push(trip);
      }
    }

    upcoming.sort((a, b) => {
      const aStart = extractStartIsoFromTrip(a) || "9999-12-31";
      const bStart = extractStartIsoFromTrip(b) || "9999-12-31";
      return aStart.localeCompare(bStart);
    });

    past.sort((a, b) => {
      const aEnd = extractEndIsoFromTrip(a) || "0000-01-01";
      const bEnd = extractEndIsoFromTrip(b) || "0000-01-01";
      return bEnd.localeCompare(aEnd);
    });

    return { savedUpcomingTrips: upcoming, savedPastTrips: past };
  }, [myTrips]);

  const isCloudOwnedByCurrentUser = Boolean(user && cloudOwnerId && user.id === cloudOwnerId);
  const isSharedCloudTrip = Boolean(cloudTripId && cloudOwnerId && (!user || user.id !== cloudOwnerId));
  const canCollaborateOnSharedTrip = Boolean(
    user &&
    isSharedCloudTrip &&
    cloudVisibility !== "private" &&
    cloudShareAccess === "collaborate"
  );
  const canEditCurrentTrip = Boolean(
    !sourceUrl &&
    !isViewOnly &&
    (!cloudTripId || isCloudOwnedByCurrentUser || canCollaborateOnSharedTrip)
  );

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
    if (!isSupabaseConfigured) {
      pushToast("Sign in is unavailable right now. Please try again in a moment.", "error");
      return;
    }
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

  const submitGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      pushToast("Google sign in is unavailable right now.", "error");
      return;
    }
    try {
      signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
      pushToast(error.message || "Could not start Google sign-in.", "error");
    }
  };

  const handleSaveToCloud = async () => {
    if (!isSupabaseConfigured) {
      pushToast("Saved trips are unavailable right now.", "error");
      return;
    }
    if (!user) {
      pushToast("Sign in first to save this trip.", "error");
      return;
    }
    if (!tripData) {
      pushToast("No trip loaded.", "error");
      return;
    }

    setCloudSaving(true);
    try {
      let row;
      if (cloudTripId) {
        if (isCloudOwnedByCurrentUser || canCollaborateOnSharedTrip) {
          row = await updateCloudTrip(cloudTripId, tripData, cloudVisibility, cloudSlug, cloudShareAccess);
        } else {
          row = await saveTripToCloud(tripData, "private", "view");
        }
      } else {
        row = await saveTripToCloud(tripData, cloudVisibility, cloudShareAccess);
      }

      setCloudTripId(row.id);
      setCloudSlug(row.slug || null);
      setCloudVisibility(row.visibility || "private");
      setCloudShareAccess(row.share_access || "view");
      setCloudOwnerId(row.owner_id || user?.id || null);
      const cloudHash = row.slug ? `#t=${encodeURIComponent(row.slug)}` : `#cloud=${encodeURIComponent(row.id)}`;
      window.history.pushState(null, '', cloudHash);
      await refreshMyTrips();
      if (cloudTripId && !isCloudOwnedByCurrentUser && !canCollaborateOnSharedTrip) {
        pushToast("Saved a private copy to your trips.", "success");
      } else if (canCollaborateOnSharedTrip) {
        pushToast("Shared trip updated.", "success");
      } else {
        pushToast("Trip saved.", "success");
      }
    } catch (error) {
      console.error("Save failed:", error);
      pushToast(error.message || "Could not save trip.", "error");
    } finally {
      setCloudSaving(false);
    }
  };

  const handleSaveCopyToCloud = async () => {
    if (!isSupabaseConfigured) {
      pushToast("Saved trips are unavailable right now.", "error");
      return;
    }
    if (!user) {
      pushToast("Sign in first to save this trip.", "error");
      return;
    }
    if (!tripData) {
      pushToast("No trip loaded.", "error");
      return;
    }

    setCloudSaving(true);
    try {
      const row = await saveTripToCloud(tripData, "private", "view");
      setCloudTripId(row.id);
      setCloudSlug(row.slug || null);
      setCloudVisibility(row.visibility || "private");
      setCloudShareAccess(row.share_access || "view");
      setCloudOwnerId(row.owner_id || user?.id || null);
      setShareToken(null);
      const cloudHash = row.slug ? `#t=${encodeURIComponent(row.slug)}` : `#cloud=${encodeURIComponent(row.id)}`;
      window.history.pushState(null, '', cloudHash);
      await refreshMyTrips();
      pushToast("Saved a private copy to your trips.", "success");
    } catch (error) {
      console.error("Save copy failed:", error);
      pushToast(error.message || "Could not save copy.", "error");
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

  const handleDeleteCloudTrip = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this trip permanently?");
    if (!confirmed) return;
    try {
      await deleteCloudTripById(id);
      if (cloudTripId === id) {
        setTripData(null);
        setCloudTripId(null);
        setCloudSlug(null);
        setShareToken(null);
        setCloudShareAccess("view");
        setCloudOwnerId(null);
        setSourceUrl(null);
        setMode('onboarding');
      }
      await refreshMyTrips();
      pushToast("Trip deleted.", "success");
    } catch (error) {
      console.error("Delete trip error:", error);
      pushToast(error.message || "Could not delete trip.", "error");
    }
  };

  const handleGenerateShareToken = async () => {
    if (!cloudTripId) {
      pushToast("Save this trip first before creating a share link.", "error");
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
    setBuilderStartTab("basic");
    setMode('builder');
  };

  const handleSaveAndPreview = (newTripData) => {
    handleSaveTrip(newTripData);
    setBuilderStartTab("basic");
    setMode('view');
    pushToast("Trip saved.", "success");
  };

  const handleCancelEdit = () => {
    setMode('view');
  };

  const handleGoHome = () => {
    window.history.pushState(null, "", "/");
    setMode("onboarding");
    setShowShareModal(false);
    setShowMyTripsModal(false);
    setShowSignInModal(false);
    setShowImportModal(false);
    setShowResetModal(false);
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
    setCloudShareAccess("view");
    setCloudOwnerId(null);
    setSourceUrl(null);
    setShowResetModal(false);
    setMode('onboarding');
  };

  const openBuilderWithTrip = (nextTripData) => {
    setTripData(nextTripData);
    setBuilderStartTab("basic");
    setCloudTripId(null);
    setCloudSlug(null);
    setShareToken(null);
    setCloudShareAccess("view");
    setCloudOwnerId(null);
    setSourceUrl(null);
    setMode('builder');
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
    openBuilderWithTrip(templateData);
  };

  const handleStartFromQuickTemplate = (templateId) => {
    const templateData = buildTemplateTrip(templateId, palette);
    if (!templateData) return;
    openBuilderWithTrip(templateData);
  };

  const handleStartFromScratch = () => {
    const emptyData = {
      tripConfig: {
        title: "My Trip",
        footer: "My Adventure",
        favicon: null,
        cover: null,
        calendar: { year: new Date().getFullYear(), month: new Date().getMonth() },
        badgeLegend: []
      },
      flights: [],
      days: [],
      dayBadges: {},
      ll: {},
      palette
    };
    openBuilderWithTrip(emptyData);
  };

  const handleImportJson = () => {
    if (!isAdminUser) {
      pushToast("This import tool is only available to admins.", "error");
      return;
    }
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
        setCloudShareAccess("view");
        setCloudOwnerId(null);
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
    if (!canCopyShareLink) {
      pushToast("Save this trip first for a shareable link.", "error");
      return;
    }
    const shareURL = generateShareURL(tripData, { viewOnly: isViewOnly && !cloudTripId, source: sourceUrl, cloudId: cloudTripId, cloudSlug, shareToken });
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

  const currentShareURL = generateShareURL(tripData, { viewOnly: isViewOnly && !cloudTripId, source: sourceUrl, cloudId: cloudTripId, cloudSlug, shareToken });
  const isLocalDraftShare = !cloudTripId && !sourceUrl;
  const canCopyShareLink = Boolean(cloudTripId || sourceUrl);

  const publishIssues = useMemo(() => {
    const issues = [];
    if (!tripData?.tripConfig?.title?.trim()) {
      issues.push({ key: "title", label: "Add a trip title", action: "edit-basic" });
    }
    if (!tripData?.days?.length) {
      issues.push({ key: "days", label: "Add at least one itinerary day", action: "edit-days" });
    }
    if ((tripData?.days || []).some((d) => !d.isoDate)) {
      issues.push({ key: "dates", label: "Set a date for each day", action: "edit-days" });
    }
    if ((tripData?.flights || []).some((f) => !String(f.flightFrom || "").trim() || !String(f.flightTo || "").trim())) {
      issues.push({ key: "flights", label: "Complete each flight from/to", action: "edit-flights" });
    }
    return issues;
  }, [tripData]);

  const upcomingTrips = useMemo(() => {
    if (!Array.isArray(myTrips)) return [];
    const todayIso = new Date().toISOString().slice(0, 10);
    return myTrips
      .map((trip) => {
        const startIso = extractStartIsoFromTrip(trip);
        return {
          ...trip,
          startIso,
          coverImage: extractCoverImage(trip),
        };
      })
      .filter((trip) => trip.startIso && trip.startIso >= todayIso)
      .sort((a, b) => a.startIso.localeCompare(b.startIso))
      .slice(0, 6);
  }, [myTrips]);

  const handleFixIssue = (issueAction) => {
    setShowShareModal(false);
    const map = {
      "edit-basic": "basic",
      "edit-days": "days",
      "edit-flights": "flights",
    };
    setBuilderStartTab(map[issueAction] || "basic");
    setMode("builder");
  };

  const resetDrawer = showResetModal && (
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
            Reset
          </button>
        </div>
      </aside>
    </div>
  );

  const signInDrawer = showSignInModal && (
    <div className="fixed inset-0 z-50" onClick={() => setShowSignInModal(false)}>
      <div className="absolute inset-0 bg-black/40" />
      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Sign In</h2>
        <p className="text-sm text-zinc-600 mb-4">Continue with Google or use an email magic link.</p>
        <button
          type="button"
          onClick={() => {
            window.history.pushState(null, "", "/auth");
            setShowSignInModal(false);
          }}
          className="text-xs text-blue-700 hover:underline mb-3"
        >
          Open full sign-in page
        </button>
        {!isSupabaseConfigured && (
          <p className="text-sm text-amber-700 mb-4">
            Sign in is temporarily unavailable right now.
          </p>
        )}
        <button
          onClick={submitGoogleSignIn}
          disabled={!isSupabaseConfigured}
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with Google
        </button>
        <div className="flex items-center gap-2 my-4">
          <div className="h-px bg-zinc-200 flex-1" />
          <span className="text-xs text-zinc-500 uppercase tracking-wide">or</span>
          <div className="h-px bg-zinc-200 flex-1" />
        </div>
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
            disabled={signInLoading || !isSupabaseConfigured}
            className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-black text-sm font-medium disabled:opacity-50"
          >
            {signInLoading ? "Sending..." : "Send Link"}
          </button>
        </div>
      </aside>
    </div>
  );

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-xl p-6">
          <h1 className="text-2xl font-bold text-zinc-900">Account</h1>
          <p className="text-sm text-zinc-600 mt-1 mb-4">
            Sign in to save, sync, and reopen trips on any device.
          </p>
          {!isSupabaseConfigured && (
            <p className="text-sm text-amber-700 mb-4">
              Sign in is temporarily unavailable right now.
            </p>
          )}
          {user ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-700">Signed in as {user.email}</p>
              <button
                type="button"
                onClick={() => {
                  window.history.replaceState(null, "", "/");
                  setMode("onboarding");
                }}
                className="w-full px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-black"
              >
                Continue to App
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={submitGoogleSignIn}
                disabled={!isSupabaseConfigured}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium disabled:opacity-50"
              >
                Continue with Google
              </button>
              <input
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={submitSignIn}
                disabled={signInLoading || !isSupabaseConfigured}
                className="w-full px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50"
              >
                {signInLoading ? "Sending..." : "Send Magic Link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  window.history.replaceState(null, "", "/");
                  setMode("onboarding");
                }}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 text-sm font-medium hover:bg-zinc-50"
              >
                Continue as Guest
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Onboarding screen
  if (mode === 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/favicon.png"
                alt="plnr.guide logo"
                className="w-14 h-14 rounded-xl border border-zinc-200 bg-white object-cover shadow-sm"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4">
              plnr.guide
            </h1>
            <p className="text-lg text-zinc-600">
              Create beautiful, shareable trip itineraries in minutes
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 md:p-5 border border-zinc-200 rounded-xl bg-gradient-to-r from-zinc-50 to-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 text-sm">Account</p>
                    <p className="text-sm text-zinc-600 mt-1">
                      {user
                        ? `Signed in as ${user.email}`
                        : "Sign in to save trips, edit them later, and manage upcoming trips across devices."}
                    </p>
                    {!isSupabaseConfigured && (
                      <p className="text-xs text-amber-700 mt-2">
                        Sign in is temporarily unavailable right now.
                      </p>
                    )}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${user ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                  {user ? "Signed in" : "Guest"}
                </div>
              </div>
              <div className="mt-4">
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg border border-zinc-300 hover:bg-white text-sm font-medium"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-black text-sm font-medium"
                  >
                    Create Account / Sign In
                  </button>
                )}
              </div>
            </div>

            {user && upcomingTrips.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-zinc-900">Upcoming Trips</h3>
                  <button
                    type="button"
                    onClick={handleOpenMyTrips}
                    className="text-xs text-blue-700 hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {upcomingTrips.slice(0, 4).map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => handleOpenCloudTrip(trip.id)}
                      className="text-left rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-300"
                    >
                      <div className="h-24 bg-zinc-100">
                        {trip.coverImage ? (
                          <img src={trip.coverImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : null}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-zinc-900">{trip.title}</p>
                        <p className="text-xs text-zinc-500 mt-1">Starts {new Date(`${trip.startIso}T00:00:00`).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
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
                    See a fully populated example trip you can customize.
                    {isSupabaseConfigured && !user ? (
                      <span className="block mt-1 text-sm text-zinc-500">Guest trips stay on this browser unless you sign in.</span>
                    ) : null}
                  </p>
                </div>
              </div>
            </button>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold text-zinc-900 mb-3">Start from a Template</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleStartFromQuickTemplate(tpl.id)}
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
            </div>

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
                    Build your trip from the ground up.
                    {isSupabaseConfigured && !user ? (
                      <span className="block mt-1 text-sm text-zinc-500">Guest trips stay local to this device.</span>
                    ) : null}
                  </p>
                </div>
              </div>
            </button>

            {isAdminUser && (
              <button
                onClick={openImportModal}
                className="w-full p-6 rounded-xl border-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition-colors text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">💻</div>
                  <div>
                    <h3 className="font-bold text-xl text-zinc-900 mb-2 group-hover:text-zinc-700">
                      Import JSON (Admin)
                    </h3>
                    <p className="text-zinc-600">
                      Paste your own trip JSON data to immediately load your itinerary
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>

          {showImportModal && isAdminUser && (
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
                Free account for saved trips, edits, and cross-device access
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
                  Optional account with saved trips
                </li>
              )}
            </ul>
          </div>
        </div>
        {signInDrawer}
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
      <>
        <TripBuilder
          tripData={tripData}
          onSave={handleSaveAndPreview}
          onCancel={handleCancelEdit}
          onHome={handleGoHome}
          onReset={handleReset}
          initialTab={builderStartTab}
          isAdmin={isAdminUser}
        />
        {signInDrawer}
        {resetDrawer}
      </>
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
            {!user ? (
              <button type="button" onClick={handleSignIn} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50">
                Sign In
              </button>
            ) : (
              <>
                {isSupabaseConfigured && (
                  <>
                    <button type="button" onClick={handleOpenMyTrips} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50">
                      My Saved Trips
                    </button>
                    <button type="button" onClick={handleSaveToCloud} disabled={cloudSaving} className="px-3 py-2 rounded-2xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">
                      {cloudSaving
                        ? "Saving..."
                        : canCollaborateOnSharedTrip
                          ? "Save Changes"
                          : cloudTripId
                            ? isCloudOwnedByCurrentUser
                              ? "Update Saved"
                              : "Save Copy"
                            : "Save Trip"}
                    </button>
                    {isSharedCloudTrip && (
                      <button type="button" onClick={handleSaveCopyToCloud} disabled={cloudSaving} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50 disabled:opacity-50">
                        Save Copy
                      </button>
                    )}
                  </>
                )}
                <button type="button" onClick={handleSignOut} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50">
                  Sign Out
                </button>
              </>
            )}
            <button type="button" onClick={handleGoHome} className="px-3 py-2 rounded-2xl border border-zinc-300 text-sm hover:bg-zinc-50 flex items-center gap-1 text-zinc-700 font-medium" title="Go Home">
              <span>Home</span>
            </button>
            {canEditCurrentTrip && (
              <button type="button" onClick={handleReset} className="px-3 py-2 rounded-2xl border border-red-200 text-red-600 text-sm hover:bg-red-50 flex items-center gap-1 font-medium" title="Reset">
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
            {canEditCurrentTrip && (
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

      {signInDrawer}

      {resetDrawer}

      {showShareModal && (
        <div className="fixed inset-0 z-50" onClick={() => setShowShareModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute right-0 top-0 h-full w-full sm:max-w-lg bg-white shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Share Your Trip</h2>
            <p className="text-zinc-600 mb-4">
              {isLocalDraftShare
                ? "You're sharing a local draft link, so it will be long. Save first for a short, clean link."
                : "Copy this link to share your trip. Saved trips use short slug links when available."}
            </p>
            {isLocalDraftShare && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800">
                  Local draft links include the full trip data in the URL.
                </p>
                <button
                  type="button"
                  onClick={handleSaveToCloud}
                  disabled={!isSupabaseConfigured || !user || cloudSaving}
                  className="mt-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {!isSupabaseConfigured ? "Short links unavailable" : !user ? "Sign in to get short links" : (cloudSaving ? "Saving..." : "Save for short link")}
                </button>
              </div>
            )}
            <div className="flex flex-col gap-4">
              {publishIssues.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-medium text-amber-900 mb-2">Before sharing, fix these:</p>
                  <div className="space-y-2">
                    {publishIssues.map((issue) => (
                      <div key={issue.key} className="flex items-center justify-between gap-2">
                        <p className="text-xs text-amber-900">{issue.label}</p>
                        <button
                          type="button"
                          onClick={() => handleFixIssue(issue.action)}
                          className="px-2 py-1 rounded border border-amber-300 text-amber-900 text-xs hover:bg-amber-100"
                        >
                          Fix
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentShareURL}
                  readOnly
                  className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg bg-zinc-50 text-sm font-mono"
                />
                <button
                  onClick={copyShareLink}
                  disabled={!canCopyShareLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Copy
                </button>
              </div>
              {!canCopyShareLink && (
                <p className="text-xs text-zinc-500">
                  Save first to copy a clean share link.
                </p>
              )}

              {cloudTripId ? (
                <div className="flex flex-col gap-2 p-3 border border-zinc-200 rounded-xl bg-zinc-50">
                  {isCloudOwnedByCurrentUser ? (
                    <>
                      <label className="text-sm font-medium text-zinc-900">Shared access</label>
                      <select
                        value={cloudShareAccess}
                        onChange={(e) => setCloudShareAccess(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-zinc-300 text-sm bg-white"
                      >
                        <option value="view">View only</option>
                        <option value="collaborate">Collaborate (signed-in users can edit)</option>
                      </select>
                      <p className="text-xs text-zinc-500">
                        Save the trip after changing this setting so the shared link updates.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-zinc-600">
                      This shared trip is currently <strong>{cloudShareAccess === "collaborate" ? "collaborative" : "view only"}</strong>.
                    </p>
                  )}
                </div>
              ) : (
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
              )}

              {cloudTripId && isCloudOwnedByCurrentUser && !shareToken && (
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
                    ✨ Live Link Active: This trip stays synced and will stay updated.
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
                    Saved trip ID: <code>{cloudTripId}</code>
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
                  Share this link with friends so they can open your itinerary instantly. People can always save a copy to their own account.
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
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">My Saved Trips</h2>
            <p className="text-zinc-600 mb-4 text-sm">Open one of your saved trips.</p>

            {myTripsLoading ? (
              <p className="text-sm text-zinc-600">Loading trips...</p>
            ) : myTrips.length === 0 ? (
              <p className="text-sm text-zinc-600">No saved trips yet. Save your current trip first.</p>
            ) : (
              <div className="max-h-[70vh] overflow-auto space-y-5">
                <section>
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2">Upcoming ({savedUpcomingTrips.length})</h3>
                  {savedUpcomingTrips.length === 0 ? (
                    <p className="text-xs text-zinc-500">No upcoming trips.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {savedUpcomingTrips.map((trip) => {
                        const cover = extractCoverImage(trip);
                        return (
                          <div key={trip.id} className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => handleOpenCloudTrip(trip.id)}
                              className="w-full text-left hover:bg-zinc-50"
                            >
                              <div className="h-28 bg-zinc-100">
                                {cover && (
                                  <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />
                                )}
                              </div>
                              <div className="p-3">
                                <p className="font-medium text-zinc-900">{trip.title}</p>
                                <p className="text-xs text-zinc-500 mt-1">
                                  {trip.slug || "no-slug"} • {trip.visibility}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                  Updated {new Date(trip.updated_at || trip.created_at).toLocaleString()}
                                </p>
                              </div>
                            </button>
                            <div className="px-3 pb-3">
                              <button
                                type="button"
                                onClick={() => handleDeleteCloudTrip(trip.id)}
                                className="w-full px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50"
                              >
                                Delete Trip
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section>
                  <button
                    type="button"
                    onClick={() => setShowPastSavedTrips((prev) => !prev)}
                    className="w-full mb-2 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between"
                  >
                    <span>Past ({savedPastTrips.length})</span>
                    <span>{showPastSavedTrips ? "Hide" : "Show"}</span>
                  </button>
                  {showPastSavedTrips ? (
                    savedPastTrips.length === 0 ? (
                      <p className="text-xs text-zinc-500">No past trips.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {savedPastTrips.map((trip) => {
                          const cover = extractCoverImage(trip);
                          return (
                            <div key={trip.id} className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
                              <button
                                type="button"
                                onClick={() => handleOpenCloudTrip(trip.id)}
                                className="w-full text-left hover:bg-zinc-50"
                              >
                                <div className="h-28 bg-zinc-100">
                                  {cover && (
                                    <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />
                                  )}
                                </div>
                                <div className="p-3">
                                  <p className="font-medium text-zinc-900">{trip.title}</p>
                                  <p className="text-xs text-zinc-500 mt-1">
                                    {trip.slug || "no-slug"} • {trip.visibility}
                                  </p>
                                  <p className="text-xs text-zinc-400 mt-1">
                                    Updated {new Date(trip.updated_at || trip.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </button>
                              <div className="px-3 pb-3">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCloudTrip(trip.id)}
                                  className="w-full px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50"
                                >
                                  Delete Trip
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : null}
                </section>
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
        {tripConfig.cover && (
          <div className="rounded-3xl overflow-hidden border border-zinc-200 shadow-sm bg-white">
            <img src={tripConfig.cover} alt="" className="w-full h-48 md:h-72 object-cover" loading="lazy" />
          </div>
        )}
        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-700 flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900">Status:</span>
          {cloudTripId ? (
            <>
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">Saved & synced</span>
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
