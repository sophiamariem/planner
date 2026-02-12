import { useMemo } from "react";
import { saveTripToCloud, updateCloudTrip, addTripCollaboratorByEmail, removeTripCollaboratorByEmail } from "../lib/cloudTrips";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { generateShareURL } from "../utils/tripData";
import { attachCopyAttribution } from "../utils/tripMeta";

export default function useShareActions({
  user,
  tripData,
  cloudTripId,
  cloudSlug,
  shareToken,
  cloudVisibility,
  cloudShareAccess,
  cloudOwnerId,
  collaboratorEmail,
  canCopyShareLink,
  currentShareURL,
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
}) {
  const computedShareURL = useMemo(
    () => (
      cloudSlug
        ? generateShareURL(tripData, { cloudSlug, shareToken })
        : (shareToken ? generateShareURL(tripData, { shareToken }) : null)
    ),
    [cloudSlug, shareToken, tripData]
  );

  const computedCanCopyShareLink = Boolean(computedShareURL);

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
      window.history.pushState(null, "", cloudHash);
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

  const handleShare = async (setShowShareModal) => {
    setShowShareModal(true);

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
    const effectiveCanCopy = canCopyShareLink ?? computedCanCopyShareLink;
    const effectiveUrl = currentShareURL ?? computedShareURL;
    if (!effectiveCanCopy || !effectiveUrl) {
      pushToast("Short link is not ready yet.", "error");
      return;
    }
    let shareURL = effectiveUrl;

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

  return {
    currentShareURL: currentShareURL ?? computedShareURL,
    canCopyShareLink: canCopyShareLink ?? computedCanCopyShareLink,
    handleSaveSharedCopy,
    handleAddCollaborator,
    handleRemoveCollaborator,
    handleShare,
    handleShareAccessChange,
    copyShareLink,
  };
}
