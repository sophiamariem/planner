import React, { useMemo, useEffect } from "react";
import useFavicon from "./hooks/useFavicon";
import useTripPlannerUiState from "./hooks/useTripPlannerUiState";
import useTripCreationActions from "./hooks/useTripCreationActions";
import useAuthActions from "./hooks/useAuthActions";
import useShareActions from "./hooks/useShareActions";
import useCloudTripLoader from "./hooks/useCloudTripLoader";
import { updateURLWithTrip, saveTripToLocalStorage, clearLocalStorageTrip } from "./utils/tripData";
import { QUICK_TEMPLATES } from "./utils/tripTemplates";
import { extractCoverImage, formatVisibilityLabel } from "./utils/tripMeta";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import { deleteCloudTripById } from "./lib/cloudTrips";

import ToastLayer from "./components/ToastLayer";
import AuthPage from "./components/AuthPage";
import OnboardingScreen from "./screens/OnboardingScreen";
import BuilderScreen from "./screens/BuilderScreen";
import ViewScreen from "./screens/ViewScreen";
import LoadingScreen from "./screens/LoadingScreen";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

export default function TripPlannerApp() {
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

  const handleSaveTrip = (newTripData) => {
    setTripData(newTripData);
    saveTripToLocalStorage(newTripData);
    if (!cloudTripId) {
      updateURLWithTrip(newTripData);
    }
  };

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
      <OnboardingScreen
        onboardingPage={onboardingPage}
        onSwitchPage={(page) => {
          setOnboardingPage(page);
          window.history.pushState(null, "", page === "trips" ? "/app" : "/new");
        }}
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
        onStartFromTemplate={handleStartFromTemplate}
        onStartFromScratch={handleStartFromScratch}
        quickTemplates={QUICK_TEMPLATES}
        onStartFromQuickTemplate={handleStartFromQuickTemplate}
        isAdminUser={isAdminUser}
        onOpenImportModal={openImportModal}
        showImportModal={showImportModal}
        importJson={importJson}
        onImportJsonChange={setImportJson}
        importError={importError}
        onCloseImportModal={() => setShowImportModal(false)}
        onImportJson={handleImportJson}
        showSignInModal={showSignInModal}
        onCloseSignInModal={() => setShowSignInModal(false)}
        isSupabaseConfigured={isSupabaseConfigured}
        signInEmail={signInEmail}
        onSignInEmailChange={setSignInEmail}
        onGoogleSignIn={submitGoogleSignIn}
        onSubmitSignIn={submitSignIn}
        signInLoading={signInLoading}
        toasts={toasts}
      />
    );
  }

  // Loading state
  if (mode === 'loading') {
    return <LoadingScreen />;
  }

  // Builder mode
  if (mode === 'builder') {
    return (
      <BuilderScreen
        tripData={tripData}
        onSave={handleSaveAndPreview}
        onCancel={handleCancelEdit}
        onHome={handleGoHome}
        onReset={handleReset}
        initialTab={builderStartTab}
        isAdmin={isAdminUser}
        showSignInModal={showSignInModal}
        onCloseSignInModal={() => setShowSignInModal(false)}
        isSupabaseConfigured={isSupabaseConfigured}
        signInEmail={signInEmail}
        onSignInEmailChange={setSignInEmail}
        onGoogleSignIn={submitGoogleSignIn}
        onSubmitSignIn={submitSignIn}
        signInLoading={signInLoading}
        toasts={toasts}
        showResetModal={showResetModal}
        onCloseResetModal={() => setShowResetModal(false)}
        onConfirmReset={confirmReset}
      />
    );
  }

  // View mode
  return (
    <ViewScreen
      activePaletteBg={activePalette.bg}
      tripTitle={tripConfig.title}
      isSharedCloudTrip={isSharedCloudTrip}
      canCollaborateOnSharedTrip={canCollaborateOnSharedTrip}
      copiedFromOwnerId={copiedFrom?.ownerId}
      onGoHome={handleGoHome}
      view={view}
      onChangeView={setView}
      filter={filter}
      onChangeFilter={setFilter}
      onShare={() => handleShare(setShowShareModal)}
      canSaveSharedCopy={canSaveSharedCopy}
      onSaveSharedCopy={handleSaveSharedCopy}
      cloudSaving={cloudSaving}
      canEditCurrentTrip={canEditCurrentTrip}
      onEditTrip={handleEditTrip}
      onReset={handleReset}
      user={user}
      onSignIn={handleSignIn}
      onSignOut={handleSignOut}
      toasts={toasts}
      showSignInModal={showSignInModal}
      onCloseSignInModal={() => setShowSignInModal(false)}
      isSupabaseConfigured={isSupabaseConfigured}
      signInEmail={signInEmail}
      onSignInEmailChange={setSignInEmail}
      onGoogleSignIn={submitGoogleSignIn}
      onSubmitSignIn={submitSignIn}
      signInLoading={signInLoading}
      showResetModal={showResetModal}
      onCloseResetModal={() => setShowResetModal(false)}
      onConfirmReset={confirmReset}
      showShareModal={showShareModal}
      onCloseShareModal={() => setShowShareModal(false)}
      publishIssues={publishIssues}
      onFixIssue={handleFixIssue}
      currentShareURL={currentShareURL}
      canCopyShareLink={canCopyShareLink}
      onCopyShareLink={copyShareLink}
      onOpenSignInFromShare={() => {
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
      showMyTripsModal={showMyTripsModal}
      onCloseMyTripsModal={() => setShowMyTripsModal(false)}
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
      tripConfig={tripConfig}
      cloudSlug={cloudSlug}
      flights={flights}
      days={days}
      filtered={filtered}
      showMaps={showMaps}
      imgClass={imgClass}
      selectedId={selectedId}
      onSelectDay={setSelectedId}
      dayBadges={dayBadges}
      selectedDay={selectedDay}
      activePaletteCard={activePalette.card}
    />
  );
}
