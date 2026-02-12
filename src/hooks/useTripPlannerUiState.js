import { useMemo, useState } from "react";
import { tripConfig as defaultTripConfig, palette } from "../data/trip";
import { ADMIN_EMAILS } from "../utils/admin";
import { extractEndIsoFromTrip, extractStartIsoFromTrip } from "../utils/tripMeta";

export default function useTripPlannerUiState() {
  const [mode, setMode] = useState("loading");
  const [onboardingPage, setOnboardingPage] = useState("create");
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteTripId, setPendingDeleteTripId] = useState(null);
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
  const tripConfig = tripData?.tripConfig || defaultTripConfig;
  const flights = tripData?.flights || [];
  const days = useMemo(() => tripData?.days || [], [tripData?.days]);
  const dayBadges = tripData?.dayBadges || {};
  const activePalette = tripData?.palette || palette;
  const eventIds = useMemo(() => (days || []).map(d => Number(d.id)).sort((a, b) => a - b), [days]);
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

  return {
    mode, setMode,
    onboardingPage, setOnboardingPage,
    tripData, setTripData,
    isViewOnly, setIsViewOnly,
    sourceUrl, setSourceUrl,
    filter, setFilter,
    showMaps,
    dense,
    view, setView,
    showShareModal, setShowShareModal,
    showMyTripsModal, setShowMyTripsModal,
    showSignInModal, setShowSignInModal,
    showResetModal, setShowResetModal,
    showDeleteModal, setShowDeleteModal,
    pendingDeleteTripId, setPendingDeleteTripId,
    showImportModal, setShowImportModal,
    builderStartTab, setBuilderStartTab,
    importJson, setImportJson,
    importError, setImportError,
    toasts, setToasts,
    signInEmail, setSignInEmail,
    signInLoading, setSignInLoading,
    cloudTripId, setCloudTripId,
    cloudSlug, setCloudSlug,
    shareToken, setShareToken,
    cloudVisibility, setCloudVisibility,
    cloudShareAccess, setCloudShareAccess,
    cloudOwnerId, setCloudOwnerId,
    cloudCollaboratorRole, setCloudCollaboratorRole,
    collaboratorEmail, setCollaboratorEmail,
    collaborators, setCollaborators,
    collaboratorsLoading, setCollaboratorsLoading,
    cloudSaving, setCloudSaving,
    myTrips, setMyTrips,
    myTripsLoading, setMyTripsLoading,
    showPastSavedTrips, setShowPastSavedTrips,
    user, setUser,
    isAdminUser,
    tripConfig,
    flights,
    days,
    dayBadges,
    activePalette,
    eventIds,
    selectedId, setSelectedId,
    selectedDay,
    imgClass,
    filtered,
    savedUpcomingTrips,
    savedPastTrips,
    isCloudOwnedByCurrentUser,
    isSharedCloudTrip,
    canCollaborateOnSharedTrip,
    canEditCurrentTrip,
    canSaveSharedCopy,
    copiedFrom,
  };
}
