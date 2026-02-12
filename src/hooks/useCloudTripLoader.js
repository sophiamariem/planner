import { useCallback, useEffect } from "react";
import { ensureTailwindCDN } from "../utils/tailwind";
import { getTripFromURL, loadTripFromLocalStorage, validateTripData, getSourceFromURL, getCloudFromURL, isViewOnlyFromURL } from "../utils/tripData";
import { isSupabaseConfigured, setSessionFromUrl } from "../lib/supabaseClient";
import { getCurrentUser, listMyTrips, getMyCollaboratorRole, listTripCollaborators, loadCloudTripById, loadCloudTripByShareToken, loadCloudTripBySlug } from "../lib/cloudTrips";

export default function useCloudTripLoader({
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
}) {
  const refreshMyTrips = useCallback(async (activeUser = user) => {
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
  }, [user, setMyTripsLoading, setMyTrips, pushToast]);

  const refreshCollaborators = useCallback(async (tripId = cloudTripId) => {
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
  }, [cloudTripId, isCloudOwnedByCurrentUser, setCollaboratorsLoading, setCollaborators, pushToast]);

  const loadCloudTrip = useCallback(async (cloudRef) => {
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
    setMode("view");

    try {
      if (user?.id && row.owner_id && user.id !== row.owner_id) {
        const role = await getMyCollaboratorRole(row.id);
        setCloudCollaboratorRole(role);
      }
    } catch (error) {
      console.error("Error checking collaborator role:", error);
      setCloudCollaboratorRole(null);
    }
  }, [
    user,
    setTripData,
    setCloudTripId,
    setCloudSlug,
    setShareToken,
    setCloudVisibility,
    setCloudShareAccess,
    setCloudOwnerId,
    setCloudCollaboratorRole,
    setSourceUrl,
    setMode,
  ]);

  useEffect(() => {
    ensureTailwindCDN();

    const viewOnly = isViewOnlyFromURL();
    setIsViewOnly(viewOnly);

    const initialize = async () => {
      let currentUser = null;
      let sessionFromUrl = false;
      if (isSupabaseConfigured) {
        try {
          sessionFromUrl = setSessionFromUrl();
          currentUser = await getCurrentUser();
          setUser(currentUser);
          if (currentUser) {
            await refreshMyTrips(currentUser);
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
        }
      }

      // Always land signed-in users on Saved Trips after an auth callback.
      if (sessionFromUrl && currentUser) {
        window.history.replaceState(null, "", "/app");
        setOnboardingPage("trips");
        setMode("onboarding");
        return;
      }

      const cloud = getCloudFromURL();
      if (cloud && isSupabaseConfigured) {
        try {
          await loadCloudTrip(cloud);
          return;
        } catch (error) {
          console.error("Error loading saved trip:", error);
          pushToast(error.message || "Could not load saved trip.", "error");
          setMode("onboarding");
          return;
        }
      }

      const source = getSourceFromURL();
      if (source) {
        setSourceUrl(source);
        setIsViewOnly(true);
        fetch(source)
          .then((res) => res.json())
          .then((data) => {
            const validation = validateTripData(data);
            if (validation.valid) {
              setTripData(data);
              setMode("view");
            } else {
              console.error("Invalid trip data from source:", validation.error);
              setMode("onboarding");
            }
          })
          .catch((err) => {
            console.error("Error fetching trip data from source:", err);
            setMode("onboarding");
          });
        return;
      }

      const urlTrip = getTripFromURL();
      if (urlTrip) {
        setTripData(urlTrip);
        setMode("view");
        return;
      }

      const currentPath = window.location.pathname;
      if (currentPath === "/auth-callback") {
        if (currentUser) {
          window.history.replaceState(null, "", "/app");
          setOnboardingPage("trips");
        } else {
          window.history.replaceState(null, "", "/auth");
        }
        setMode("onboarding");
        return;
      }

      if (currentPath === "/app" || currentPath === "/new") {
        setOnboardingPage(currentPath === "/new" ? "create" : "trips");
        setMode("onboarding");
        return;
      }

      const localTrip = loadTripFromLocalStorage();
      if (localTrip) {
        setTripData(localTrip);
        setMode("view");
        return;
      }

      setMode("onboarding");
    };

    initialize();
  }, [
    setIsViewOnly,
    setUser,
    refreshMyTrips,
    loadCloudTrip,
    pushToast,
    setMode,
    setSourceUrl,
    setTripData,
    setOnboardingPage,
  ]);

  return {
    refreshMyTrips,
    refreshCollaborators,
    loadCloudTrip,
  };
}
