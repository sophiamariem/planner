import React, { useMemo, useState, useEffect } from "react";
import { tripConfig as defaultTripConfig, flights as defaultFlights, days as defaultDays, dayBadges as defaultDayBadges, palette, ll as defaultLocations } from "./data/trip";
import useFavicon from "./hooks/useFavicon";
import { ensureTailwindCDN } from "./utils/tailwind";
import { getTripFromURL, updateURLWithTrip, saveTripToLocalStorage, loadTripFromLocalStorage, generateShareURL, clearLocalStorageTrip, validateTripData, getSourceFromURL, getCloudFromURL, isViewOnlyFromURL } from "./utils/tripData";
import { QUICK_TEMPLATES, buildTemplateTrip, getTemplateJson } from "./utils/tripTemplates";
import { ADMIN_EMAILS } from "./utils/admin";
import { extractStartIsoFromTrip, extractEndIsoFromTrip, extractCoverImage, attachCopyAttribution, formatVisibilityLabel } from "./utils/tripMeta";
import { isSupabaseConfigured, setSessionFromUrl } from "./lib/supabaseClient";
import { getCurrentUser, signInWithMagicLink, signInWithGoogle, signOut, saveTripToCloud, updateCloudTrip, listMyTrips, getMyCollaboratorRole, listTripCollaborators, addTripCollaboratorByEmail, removeTripCollaboratorByEmail, loadCloudTripById, loadCloudTripByShareToken, loadCloudTripBySlug, deleteCloudTripById } from "./lib/cloudTrips";

import TripBuilder from "./components/TripBuilder";
import TripViewHeader from "./components/TripViewHeader";
import TripPreviewContent from "./components/TripPreviewContent";
import SignInDrawer from "./components/drawers/SignInDrawer";
import ShareDrawer from "./components/drawers/ShareDrawer";
import ResetDrawer from "./components/drawers/ResetDrawer";
import MyTripsDrawer from "./components/drawers/MyTripsDrawer";
import ImportJsonDrawer from "./components/drawers/ImportJsonDrawer";
import ToastLayer from "./components/ToastLayer";
import OnboardingTripsPanel from "./components/onboarding/OnboardingTripsPanel";
import OnboardingCreatePanel from "./components/onboarding/OnboardingCreatePanel";
import OnboardingShell from "./components/onboarding/OnboardingShell";
import AuthPage from "./components/AuthPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

export default function TripPlannerApp() {
  const isAuthRoute = typeof window !== "undefined" && window.location.pathname === "/auth";
  const isPrivacyRoute = typeof window !== "undefined" && window.location.pathname === "/privacy";
  const isTermsRoute = typeof window !== "undefined" && window.location.pathname === "/terms";
  const [mode, setMode] = useState('loading'); // 'loading', 'onboarding', 'builder', 'view'
  const [onboardingPage, setOnboardingPage] = useState("create"); // 'trips' | 'create'
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
  const [cloudCollaboratorRole, setCloudCollaboratorRole] = useState(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [myTrips, setMyTrips] = useState([]);
  const [myTripsLoading, setMyTripsLoading] = useState(false);
  const [showPastSavedTrips, setShowPastSavedTrips] = useState(false);
  const [user, setUser] = useState(null);
  const isAdminUser = Boolean(user?.email && ADMIN_EMAILS.includes(String(user.email).toLowerCase()));

  useEffect(() => {
    if (mode !== "onboarding") return;
    setOnboardingPage(user ? "trips" : "create");
  }, [user, mode]);

  const templateJSON = getTemplateJson(palette);

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

  const refreshCollaborators = async (tripId = cloudTripId) => {
    if (!tripId || !isCloudOwnedByCurrentUser) return;
    setCollaboratorsLoading(true);
    try {
      const rows = await listTripCollaborators(tripId);
      setCollaborators(rows || []);
    } catch (error) {
      console.error("Error loading collaborators:", error);
      pushToast(error.message || "Could not load collaborators.", "error");
    } finally {
      setCollaboratorsLoading(false);
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
    setCloudCollaboratorRole(null);
    setSourceUrl(null);
    setMode('view');

    try {
      if (user?.id && row.owner_id && user.id !== row.owner_id) {
        const role = await getMyCollaboratorRole(row.id);
        setCloudCollaboratorRole(role);
      }
    } catch (error) {
      console.error("Error checking collaborator role:", error);
      setCloudCollaboratorRole(null);
    }
  };

  // Load auth + trip data on mount (only runs once)
  useEffect(() => {
    ensureTailwindCDN();

    const viewOnly = isViewOnlyFromURL();
    setIsViewOnly(viewOnly);

    const initialize = async () => {
      let currentUser = null;
      if (isSupabaseConfigured) {
        try {
          setSessionFromUrl();
          currentUser = await getCurrentUser();
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

      // Check for source URL next
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

      // Check encoded URL trip next
      const urlTrip = getTripFromURL();
      if (urlTrip) {
        setTripData(urlTrip);
        setMode('view');
        return;
      }

      const currentPath = window.location.pathname;
      if (currentPath === "/app" || currentPath === "/new") {
        setOnboardingPage(currentPath === "/new" ? "create" : (currentUser ? "trips" : "create"));
        setMode("onboarding");
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
    cloudShareAccess === "collaborate" &&
    cloudCollaboratorRole === "editor"
  );
  const canEditCurrentTrip = Boolean(
    !sourceUrl &&
    !isViewOnly &&
    (!cloudTripId || isCloudOwnedByCurrentUser || canCollaborateOnSharedTrip)
  );
  const canSaveSharedCopy = Boolean(user && isSharedCloudTrip && tripData);
  const copiedFrom = tripData?.tripConfig?.copiedFrom || null;

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
      pushToast("Check your inbox for your PLNR sign-in link.", "success");
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

  const handleSaveSharedCopy = async () => {
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
      const copiedTripData = attachCopyAttribution(tripData, {
        ownerId: cloudOwnerId,
        tripId: cloudTripId,
        slug: cloudSlug,
      });
      const row = await saveTripToCloud(copiedTripData, "private", "view");
      setCloudTripId(row.id);
      setCloudSlug(row.slug || null);
      setShareToken(null);
      setCloudVisibility(row.visibility || "private");
      setCloudShareAccess(row.share_access || "view");
      setCloudOwnerId(row.owner_id || user.id);
      setCloudCollaboratorRole(null);
      const cloudHash = row.slug ? `#t=${encodeURIComponent(row.slug)}` : `#cloud=${encodeURIComponent(row.id)}`;
      window.history.pushState(null, '', cloudHash);
      await refreshMyTrips();
      pushToast("Saved to your trips.", "success");
    } catch (error) {
      console.error("Save shared copy failed:", error);
      pushToast(error.message || "Could not save this trip.", "error");
    } finally {
      setCloudSaving(false);
    }
  };

  const handleAddCollaborator = async () => {
    const email = collaboratorEmail.trim();
    if (!email) {
      pushToast("Enter a collaborator email.", "error");
      return;
    }
    if (!cloudTripId || !isCloudOwnedByCurrentUser) return;

    setCollaboratorsLoading(true);
    try {
      await addTripCollaboratorByEmail(cloudTripId, email, "editor");
      setCollaboratorEmail("");
      await refreshCollaborators(cloudTripId);
      pushToast("Collaborator added.", "success");
    } catch (error) {
      console.error("Add collaborator error:", error);
      pushToast(error.message || "Could not add collaborator.", "error");
      setCollaboratorsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (email) => {
    if (!email || !cloudTripId || !isCloudOwnedByCurrentUser) return;

    setCollaboratorsLoading(true);
    try {
      await removeTripCollaboratorByEmail(cloudTripId, email);
      await refreshCollaborators(cloudTripId);
      pushToast("Collaborator removed.", "success");
    } catch (error) {
      console.error("Remove collaborator error:", error);
      pushToast(error.message || "Could not remove collaborator.", "error");
      setCollaboratorsLoading(false);
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
        setCloudCollaboratorRole(null);
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
    window.history.pushState(null, "", "/app");
    setMode("onboarding");
    setOnboardingPage(user ? "trips" : "create");
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
    setCloudCollaboratorRole(null);
    setSourceUrl(null);
    setShowResetModal(false);
    setMode('onboarding');
    setOnboardingPage(user ? "trips" : "create");
  };

  const openBuilderWithTrip = (nextTripData) => {
    setTripData(nextTripData);
    setBuilderStartTab("basic");
    setCloudTripId(null);
    setCloudSlug(null);
    setShareToken(null);
    setCloudShareAccess("view");
    setCloudOwnerId(null);
    setCloudCollaboratorRole(null);
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
        setCloudCollaboratorRole(null);
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

  const handleShare = async () => {
    setShowShareModal(true);

    // Auto-create a short link for signed-in users so sharing starts ready.
    if (!cloudTripId && user && isSupabaseConfigured && tripData) {
      setCloudSaving(true);
      try {
        const row = await saveTripToCloud(tripData, "unlisted", "view");
        setCloudTripId(row.id);
        setCloudSlug(row.slug || null);
        setShareToken(row.share_token || null);
        setCloudVisibility(row.visibility || "unlisted");
        setCloudShareAccess(row.share_access || "view");
        setCloudOwnerId(row.owner_id || user.id);
        setCloudCollaboratorRole(null);
        const cloudHash = row.slug ? `#t=${encodeURIComponent(row.slug)}` : `#cloud=${encodeURIComponent(row.id)}`;
        window.history.pushState(null, "", cloudHash);
        await refreshMyTrips();
      } catch (error) {
        console.error("Auto-create share link failed:", error);
        pushToast(error.message || "Could not prepare share link.", "error");
      } finally {
        setCloudSaving(false);
      }
    }
  };

  const handleShareAccessChange = async (nextAccess) => {
    if (!cloudTripId || !isCloudOwnedByCurrentUser || !tripData) return;
    if (nextAccess === cloudShareAccess && cloudVisibility !== "private") return;

    const previousAccess = cloudShareAccess;
    const targetVisibility = cloudVisibility === "private" ? "unlisted" : cloudVisibility;
    setCloudShareAccess(nextAccess);
    setCloudSaving(true);
    try {
      const row = await updateCloudTrip(cloudTripId, tripData, targetVisibility, cloudSlug, nextAccess);
      setCloudSlug(row.slug || null);
      setCloudVisibility(row.visibility || targetVisibility);
      setCloudShareAccess(row.share_access || nextAccess);
      setCloudOwnerId(row.owner_id || cloudOwnerId || user?.id || null);
      const nextHash = row.slug ? `#t=${encodeURIComponent(row.slug)}` : `#cloud=${encodeURIComponent(row.id)}`;
      window.history.pushState(null, "", nextHash);
      await refreshMyTrips();
      if (nextAccess !== previousAccess) {
        pushToast("Shared access updated.", "success");
      }
    } catch (error) {
      console.error("Share access update failed:", error);
      setCloudShareAccess(previousAccess);
      pushToast(error.message || "Could not update shared access.", "error");
    } finally {
      setCloudSaving(false);
    }
  };

  const copyShareLink = async () => {
    if (!canCopyShareLink || !currentShareURL) {
      pushToast("Short link is not ready yet.", "error");
      return;
    }
    let shareURL = currentShareURL;

    if (cloudTripId && isCloudOwnedByCurrentUser && cloudVisibility === "private") {
      setCloudSaving(true);
      try {
        const row = await updateCloudTrip(cloudTripId, tripData, "unlisted", cloudSlug, cloudShareAccess);
        setCloudSlug(row.slug || null);
        setCloudVisibility(row.visibility || "unlisted");
        setCloudShareAccess(row.share_access || cloudShareAccess);
        setCloudOwnerId(row.owner_id || cloudOwnerId || user?.id || null);
        setCloudCollaboratorRole(null);
        const nextHash = row.slug ? `#t=${encodeURIComponent(row.slug)}` : `#cloud=${encodeURIComponent(row.id)}`;
        window.history.pushState(null, "", nextHash);
        shareURL = row.slug ? generateShareURL(tripData, { cloudSlug: row.slug }) : shareURL;
        pushToast("Share link ready.", "success");
      } catch (error) {
        console.error("Share visibility update failed:", error);
        pushToast(error.message || "Could not prepare share link.", "error");
        return;
      } finally {
        setCloudSaving(false);
      }
    }

    navigator.clipboard.writeText(shareURL)
      .then(() => {
        pushToast("Link copied.", "success");
      })
      .catch(() => {
        pushToast("Could not copy link.", "error");
      });
  };

  const currentShareURL = cloudSlug
    ? generateShareURL(tripData, { cloudSlug, shareToken })
    : (shareToken ? generateShareURL(tripData, { shareToken }) : null);
  const canCopyShareLink = Boolean(currentShareURL);

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

  useEffect(() => {
    if (!showShareModal || !isCloudOwnedByCurrentUser || !cloudTripId || cloudShareAccess !== "collaborate") return;
    refreshCollaborators(cloudTripId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShareModal, isCloudOwnedByCurrentUser, cloudTripId, cloudShareAccess]);

  if (isPrivacyRoute) {
    return <PrivacyPage />;
  }

  if (isTermsRoute) {
    return <TermsPage />;
  }

  if (isAuthRoute) {
    return (
      <>
        <AuthPage
          user={user}
          isSupabaseConfigured={isSupabaseConfigured}
          signInEmail={signInEmail}
          onEmailChange={setSignInEmail}
          onGoogleSignIn={submitGoogleSignIn}
          onSubmitSignIn={submitSignIn}
          signInLoading={signInLoading}
          onContinueToApp={() => {
            window.history.replaceState(null, "", "/");
            setMode("onboarding");
          }}
        />
        <ToastLayer toasts={toasts} />
      </>
    );
  }

  // Onboarding screen
  if (mode === 'onboarding') {
    return (
      <>
        <OnboardingShell
          onboardingPage={onboardingPage}
          onSwitchPage={(page) => {
            setOnboardingPage(page);
            window.history.pushState(null, "", page === "trips" ? "/app" : "/new");
          }}
        >
          {onboardingPage === "trips" ? (
            <OnboardingTripsPanel
              user={user}
              onGoCreate={() => { setOnboardingPage("create"); window.history.pushState(null, "", "/new"); }}
              onSignOut={handleSignOut}
              onSignIn={handleSignIn}
              savedUpcomingTrips={savedUpcomingTrips}
              savedPastTrips={savedPastTrips}
              showPastSavedTrips={showPastSavedTrips}
              onTogglePast={() => setShowPastSavedTrips((prev) => !prev)}
              onOpenTrip={handleOpenCloudTrip}
              extractCoverImage={extractCoverImage}
              formatVisibilityLabel={formatVisibilityLabel}
            />
          ) : (
            <OnboardingCreatePanel
              onStartFromTemplate={handleStartFromTemplate}
              onStartFromScratch={handleStartFromScratch}
              quickTemplates={QUICK_TEMPLATES}
              onStartFromQuickTemplate={handleStartFromQuickTemplate}
              isAdminUser={isAdminUser}
              onOpenImportModal={openImportModal}
            />
          )}

          <ImportJsonDrawer
            open={showImportModal}
            isAdminUser={isAdminUser}
            importJson={importJson}
            onImportJsonChange={setImportJson}
            importError={importError}
            onClose={() => setShowImportModal(false)}
            onImport={handleImportJson}
          />
        </OnboardingShell>
        <SignInDrawer
          open={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          isSupabaseConfigured={isSupabaseConfigured}
          signInEmail={signInEmail}
          onEmailChange={setSignInEmail}
          onGoogleSignIn={submitGoogleSignIn}
          onSubmitSignIn={submitSignIn}
          signInLoading={signInLoading}
        />
        <ToastLayer toasts={toasts} />
      </>
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
        <SignInDrawer
          open={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          isSupabaseConfigured={isSupabaseConfigured}
          signInEmail={signInEmail}
          onEmailChange={setSignInEmail}
          onGoogleSignIn={submitGoogleSignIn}
          onSubmitSignIn={submitSignIn}
          signInLoading={signInLoading}
        />
        <ToastLayer toasts={toasts} />
        <ResetDrawer open={showResetModal} onClose={() => setShowResetModal(false)} onConfirm={confirmReset} />
      </>
    );
  }

  // View mode
  return (
    <div className={`min-h-screen bg-gradient-to-b ${activePalette.bg}`}>
      <TripViewHeader
        tripTitle={tripConfig.title}
        isSharedCloudTrip={isSharedCloudTrip}
        canCollaborateOnSharedTrip={canCollaborateOnSharedTrip}
        copiedFromOwnerId={copiedFrom?.ownerId}
        onGoHome={handleGoHome}
        view={view}
        onChangeView={setView}
        filter={filter}
        onChangeFilter={setFilter}
        onShare={handleShare}
        canSaveSharedCopy={canSaveSharedCopy}
        onSaveSharedCopy={handleSaveSharedCopy}
        cloudSaving={cloudSaving}
        canEditCurrentTrip={canEditCurrentTrip}
        onEditTrip={handleEditTrip}
        onReset={handleReset}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <ToastLayer toasts={toasts} />

      <SignInDrawer
        open={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        isSupabaseConfigured={isSupabaseConfigured}
        signInEmail={signInEmail}
        onEmailChange={setSignInEmail}
        onGoogleSignIn={submitGoogleSignIn}
        onSubmitSignIn={submitSignIn}
        signInLoading={signInLoading}
      />

      <ResetDrawer open={showResetModal} onClose={() => setShowResetModal(false)} onConfirm={confirmReset} />

      <ShareDrawer
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        publishIssues={publishIssues}
        onFixIssue={handleFixIssue}
        currentShareURL={currentShareURL}
        canCopyShareLink={canCopyShareLink}
        onCopyShareLink={copyShareLink}
        isSupabaseConfigured={isSupabaseConfigured}
        user={user}
        cloudSaving={cloudSaving}
        onOpenSignIn={() => {
          setShowShareModal(false);
          handleSignIn();
        }}
        cloudTripId={cloudTripId}
        isCloudOwnedByCurrentUser={isCloudOwnedByCurrentUser}
        cloudShareAccess={cloudShareAccess}
        onShareAccessChange={handleShareAccessChange}
        collaboratorEmail={collaboratorEmail}
        onCollaboratorEmailChange={setCollaboratorEmail}
        onAddCollaborator={handleAddCollaborator}
        collaboratorsLoading={collaboratorsLoading}
        collaborators={collaborators}
        onRemoveCollaborator={handleRemoveCollaborator}
        isViewOnly={isViewOnly}
        onViewOnlyChange={setIsViewOnly}
      />

      <MyTripsDrawer
        open={showMyTripsModal}
        onClose={() => setShowMyTripsModal(false)}
        myTripsLoading={myTripsLoading}
        myTrips={myTrips}
        savedUpcomingTrips={savedUpcomingTrips}
        savedPastTrips={savedPastTrips}
        showPastSavedTrips={showPastSavedTrips}
        onTogglePast={() => setShowPastSavedTrips((prev) => !prev)}
        onOpenTrip={handleOpenCloudTrip}
        onDeleteTrip={handleDeleteCloudTrip}
        extractCoverImage={extractCoverImage}
        formatVisibilityLabel={formatVisibilityLabel}
        cloudVisibility={cloudVisibility}
        onChangeVisibility={setCloudVisibility}
      />

      <TripPreviewContent
        tripConfig={tripConfig}
        cloudTripId={cloudTripId}
        cloudSlug={cloudSlug}
        user={user}
        isSupabaseConfigured={isSupabaseConfigured}
        flights={flights}
        days={days}
        onEditTrip={handleEditTrip}
        view={view}
        filtered={filtered}
        showMaps={showMaps}
        imgClass={imgClass}
        selectedId={selectedId}
        onSelectDay={setSelectedId}
        dayBadges={dayBadges}
        selectedDay={selectedDay}
        activePaletteCard={activePalette.card}
      />
    </div>
  );
}
