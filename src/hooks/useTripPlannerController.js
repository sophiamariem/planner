import { useMemo, useEffect } from "react";
import useFavicon from "./useFavicon";
import useTripPlannerUiState from "./useTripPlannerUiState";
import useTripCreationActions from "./useTripCreationActions";
import useAuthActions from "./useAuthActions";
import useShareActions from "./useShareActions";
import useCloudTripLoader from "./useCloudTripLoader";
import useTripNavigationActions from "./useTripNavigationActions";
import { QUICK_TEMPLATES } from "../utils/tripTemplates";
import { extractCoverImage, formatVisibilityLabel } from "../utils/tripMeta";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export default function useTripPlannerController() {
  const isAuthRoute = typeof window !== "undefined" && window.location.pathname === "/auth";
  const isPrivacyRoute = typeof window !== "undefined" && window.location.pathname === "/privacy";
  const isTermsRoute = typeof window !== "undefined" && window.location.pathname === "/terms";

  const {
    mode, setMode,
    onboardingPage, setOnboardingPage,
    tripData, setTripData,
    isViewOnly, setIsViewOnly,
    setSourceUrl,
    filter, setFilter,
    showMaps,
    view, setView,
    showShareModal, setShowShareModal,
    showMyTripsModal, setShowMyTripsModal,
    showSignInModal, setShowSignInModal,
    showResetModal, setShowResetModal,
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
    setCloudCollaboratorRole,
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
  } = useTripPlannerUiState();

  useEffect(() => {
    if (mode !== "onboarding") return;
    setOnboardingPage(user ? "trips" : "create");
  }, [user, mode, setOnboardingPage]);

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

  const {
    openImportModal,
    handleStartFromTemplate,
    handleStartFromQuickTemplate,
    handleStartFromScratch,
    handleImportJson,
  } = useTripCreationActions({
    isAdminUser,
    pushToast,
    importJson,
    setTripData,
    setBuilderStartTab,
    setCloudTripId,
    setCloudSlug,
    setShareToken,
    setCloudShareAccess,
    setCloudOwnerId,
    setCloudCollaboratorRole,
    setSourceUrl,
    setMode,
    setShowImportModal,
    setImportJson,
    setImportError,
  });

  const {
    handleSignIn,
    submitSignIn,
    submitGoogleSignIn,
    handleSignOut,
  } = useAuthActions({
    signInEmail,
    setSignInLoading,
    setShowSignInModal,
    setSignInEmail,
    setUser,
    setMyTrips,
    pushToast,
  });

  const {
    refreshMyTrips,
    refreshCollaborators,
    loadCloudTrip,
  } = useCloudTripLoader({
    user,
    cloudTripId,
    isCloudOwnedByCurrentUser,
    pushToast,
    setMode,
    setOnboardingPage,
    setTripData,
    setIsViewOnly,
    setSourceUrl,
    setCloudTripId,
    setCloudSlug,
    setShareToken,
    setCloudVisibility,
    setCloudShareAccess,
    setCloudOwnerId,
    setCloudCollaboratorRole,
    setCollaboratorsLoading,
    setCollaborators,
    setMyTripsLoading,
    setMyTrips,
    setUser,
  });

  useFavicon(tripConfig.favicon);

  const {
    currentShareURL,
    canCopyShareLink,
    handleSaveSharedCopy,
    handleAddCollaborator,
    handleRemoveCollaborator,
    handleShare,
    handleShareAccessChange,
    copyShareLink,
  } = useShareActions({
    user,
    tripData,
    cloudTripId,
    cloudSlug,
    shareToken,
    cloudVisibility,
    cloudShareAccess,
    cloudOwnerId,
    collaboratorEmail,
    isCloudOwnedByCurrentUser,
    setCloudSaving,
    setCloudTripId,
    setCloudSlug,
    setShareToken,
    setCloudVisibility,
    setCloudShareAccess,
    setCloudOwnerId,
    setCloudCollaboratorRole,
    setCollaboratorEmail,
    setCollaboratorsLoading,
    refreshMyTrips,
    refreshCollaborators,
    pushToast,
  });

  const {
    handleOpenCloudTrip,
    handleDeleteCloudTrip,
    handleEditTrip,
    handleSaveAndPreview,
    handleCancelEdit,
    handleGoHome,
    handleReset,
    confirmReset,
    handleFixIssue,
  } = useTripNavigationActions({
    user,
    myTrips,
    cloudTripId,
    loadCloudTrip,
    refreshMyTrips,
    pushToast,
    setMode,
    setOnboardingPage,
    setBuilderStartTab,
    setShowShareModal,
    setShowMyTripsModal,
    setShowSignInModal,
    setShowImportModal,
    setShowResetModal,
    setIsViewOnly,
    setSourceUrl,
    setTripData,
    setCloudTripId,
    setCloudSlug,
    setShareToken,
    setCloudShareAccess,
    setCloudOwnerId,
    setCloudCollaboratorRole,
  });

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

  useEffect(() => {
    if (!showShareModal || !isCloudOwnedByCurrentUser || !cloudTripId || cloudShareAccess !== "collaborate") return;
    refreshCollaborators(cloudTripId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShareModal, isCloudOwnedByCurrentUser, cloudTripId, cloudShareAccess]);

  const overlayProps = {
    toasts,
    showSignInModal,
    onCloseSignInModal: () => setShowSignInModal(false),
    isSupabaseConfigured,
    signInEmail,
    onSignInEmailChange: setSignInEmail,
    onGoogleSignIn: submitGoogleSignIn,
    onSubmitSignIn: submitSignIn,
    signInLoading,
    showResetModal,
    onCloseResetModal: () => setShowResetModal(false),
    onConfirmReset: confirmReset,
    showShareModal,
    onCloseShareModal: () => setShowShareModal(false),
    publishIssues,
    onFixIssue: handleFixIssue,
    currentShareURL,
    canCopyShareLink,
    onCopyShareLink: copyShareLink,
    user,
    cloudSaving,
    onOpenSignInFromShare: () => {
      setShowShareModal(false);
      handleSignIn();
    },
    cloudTripId,
    isCloudOwnedByCurrentUser,
    cloudShareAccess,
    onShareAccessChange: handleShareAccessChange,
    collaboratorEmail,
    onCollaboratorEmailChange: setCollaboratorEmail,
    onAddCollaborator: handleAddCollaborator,
    collaboratorsLoading,
    collaborators,
    onRemoveCollaborator: handleRemoveCollaborator,
    isViewOnly,
    onViewOnlyChange: setIsViewOnly,
    showMyTripsModal,
    onCloseMyTripsModal: () => setShowMyTripsModal(false),
    myTripsLoading,
    myTrips,
    savedUpcomingTrips,
    savedPastTrips,
    showPastSavedTrips,
    onTogglePast: () => setShowPastSavedTrips((prev) => !prev),
    onOpenTrip: handleOpenCloudTrip,
    onDeleteTrip: handleDeleteCloudTrip,
    extractCoverImage,
    formatVisibilityLabel,
    cloudVisibility,
    onChangeVisibility: setCloudVisibility,
    showImportModal,
    isAdminUser,
    importJson,
    onImportJsonChange: setImportJson,
    importError,
    onCloseImportModal: () => setShowImportModal(false),
    onImportJson: handleImportJson,
  };

  const authProps = {
    user,
    isSupabaseConfigured,
    signInEmail,
    onEmailChange: setSignInEmail,
    onGoogleSignIn: submitGoogleSignIn,
    onSubmitSignIn: submitSignIn,
    signInLoading,
    onContinueToApp: () => {
      window.history.replaceState(null, "", "/");
      setMode("onboarding");
    },
  };

  const onboardingProps = {
    onboardingPage,
    onSwitchPage: (page) => {
      setOnboardingPage(page);
      window.history.pushState(null, "", page === "trips" ? "/app" : "/new");
    },
    user,
    onGoCreate: () => {
      setOnboardingPage("create");
      window.history.pushState(null, "", "/new");
    },
    onSignOut: handleSignOut,
    onSignIn: handleSignIn,
    savedUpcomingTrips,
    savedPastTrips,
    showPastSavedTrips,
    onTogglePast: () => setShowPastSavedTrips((prev) => !prev),
    onOpenTrip: handleOpenCloudTrip,
    extractCoverImage,
    formatVisibilityLabel,
    onStartFromTemplate: handleStartFromTemplate,
    onStartFromScratch: handleStartFromScratch,
    quickTemplates: QUICK_TEMPLATES,
    onStartFromQuickTemplate: handleStartFromQuickTemplate,
    isAdminUser,
    onOpenImportModal: openImportModal,
  };

  const builderProps = {
    tripData,
    onSave: handleSaveAndPreview,
    onCancel: handleCancelEdit,
    onHome: handleGoHome,
    onReset: handleReset,
    initialTab: builderStartTab,
    isAdmin: isAdminUser,
  };

  const viewProps = {
    activePaletteBg: activePalette.bg,
    tripTitle: tripConfig.title,
    isSharedCloudTrip,
    canCollaborateOnSharedTrip,
    copiedFromOwnerId: copiedFrom?.ownerId,
    onGoHome: handleGoHome,
    view,
    onChangeView: setView,
    filter,
    onChangeFilter: setFilter,
    onShare: () => handleShare(setShowShareModal),
    canSaveSharedCopy,
    onSaveSharedCopy: handleSaveSharedCopy,
    cloudSaving,
    canEditCurrentTrip,
    onEditTrip: handleEditTrip,
    onReset: handleReset,
    user,
    onSignIn: handleSignIn,
    onSignOut: handleSignOut,
    tripConfig,
    cloudSlug,
    cloudTripId,
    isSupabaseConfigured,
    flights,
    days,
    filtered,
    showMaps,
    imgClass,
    selectedId,
    onSelectDay: setSelectedId,
    dayBadges,
    selectedDay,
    activePaletteCard: activePalette.card,
  };

  return {
    isAuthRoute,
    isPrivacyRoute,
    isTermsRoute,
    mode,
    authProps,
    onboardingProps,
    builderProps,
    viewProps,
    overlayProps,
  };
}
