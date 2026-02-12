import { clearLocalStorageTrip, saveTripToLocalStorage, updateURLWithTrip } from "../utils/tripData";
import { deleteCloudTripById } from "../lib/cloudTrips";

export default function useTripNavigationActions({
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
  setShowDeleteModal,
  pendingDeleteTripId,
  setPendingDeleteTripId,
  setIsViewOnly,
  setSourceUrl,
  setTripData,
  setCloudTripId,
  setCloudSlug,
  setShareToken,
  setCloudShareAccess,
  setCloudOwnerId,
  setCloudCollaboratorRole,
}) {
  const handleSaveTrip = (newTripData) => {
    setTripData(newTripData);
    saveTripToLocalStorage(newTripData);
    if (!cloudTripId) {
      updateURLWithTrip(newTripData);
    }
  };

  const handleOpenCloudTrip = async (id) => {
    try {
      await loadCloudTrip({ type: "id", value: id });
      const selected = myTrips.find((trip) => trip.id === id);
      const cloudHash = selected?.slug ? `#t=${encodeURIComponent(selected.slug)}` : `#cloud=${encodeURIComponent(id)}`;
      window.history.pushState(null, "", cloudHash);
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
    setPendingDeleteTripId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteCloudTrip = async () => {
    const id = pendingDeleteTripId;
    if (!id) return;
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
        setMode("onboarding");
      }
      setShowDeleteModal(false);
      setPendingDeleteTripId(null);
      await refreshMyTrips();
      pushToast("Trip deleted.", "success");
    } catch (error) {
      console.error("Delete trip error:", error);
      pushToast(error.message || "Could not delete trip.", "error");
    }
  };

  const cancelDeleteCloudTrip = () => {
    setShowDeleteModal(false);
    setPendingDeleteTripId(null);
  };

  const handleEditTrip = () => {
    setBuilderStartTab("basic");
    setMode("builder");
  };

  const handleSaveAndPreview = (newTripData) => {
    handleSaveTrip(newTripData);
    setBuilderStartTab("basic");
    setMode("view");
    pushToast("Trip saved.", "success");
  };

  const handleCancelEdit = () => {
    setMode("view");
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
    setShowDeleteModal(false);
    setPendingDeleteTripId(null);
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
    setMode("onboarding");
    setOnboardingPage(user ? "trips" : "create");
  };

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

  return {
    handleSaveTrip,
    handleOpenCloudTrip,
    handleDeleteCloudTrip,
    confirmDeleteCloudTrip,
    cancelDeleteCloudTrip,
    handleEditTrip,
    handleSaveAndPreview,
    handleCancelEdit,
    handleGoHome,
    handleReset,
    confirmReset,
    handleFixIssue,
  };
}
