import { useEffect } from "react";
import useCloudTripLoader from "../useCloudTripLoader";

export default function useCloudDomain({
  user,
  cloudTripId,
  isCloudOwnedByCurrentUser,
  cloudShareAccess,
  showShareModal,
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
  const cloud = useCloudTripLoader({
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

  const { refreshCollaborators } = cloud;

  useEffect(() => {
    if (!showShareModal || !isCloudOwnedByCurrentUser || !cloudTripId || cloudShareAccess !== "collaborate") return;
    refreshCollaborators(cloudTripId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShareModal, isCloudOwnedByCurrentUser, cloudTripId, cloudShareAccess]);

  return cloud;
}
