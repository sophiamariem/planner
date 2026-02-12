import React, { useMemo, useEffect } from "react";
import useFavicon from "./hooks/useFavicon";
import useTripPlannerUiState from "./hooks/useTripPlannerUiState";
import useTripCreationActions from "./hooks/useTripCreationActions";
import { ensureTailwindCDN } from "./utils/tailwind";
import { getTripFromURL, updateURLWithTrip, saveTripToLocalStorage, loadTripFromLocalStorage, generateShareURL, clearLocalStorageTrip, validateTripData, getSourceFromURL, getCloudFromURL, isViewOnlyFromURL } from "./utils/tripData";
import { QUICK_TEMPLATES } from "./utils/tripTemplates";
import { extractCoverImage, attachCopyAttribution, formatVisibilityLabel } from "./utils/tripMeta";
import { isSupabaseConfigured, setSessionFromUrl } from "./lib/supabaseClient";
import { getCurrentUser, signInWithMagicLink, signInWithGoogle, signOut, saveTripToCloud, updateCloudTrip, listMyTrips, getMyCollaboratorRole, listTripCollaborators, addTripCollaboratorByEmail, removeTripCollaboratorByEmail, loadCloudTripById, loadCloudTripByShareToken, loadCloudTripBySlug, deleteCloudTripById } from "./lib/cloudTrips";

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
