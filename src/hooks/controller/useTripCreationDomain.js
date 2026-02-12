import useTripCreationActions from "../useTripCreationActions";

export default function useTripCreationDomain({
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
}) {
  return useTripCreationActions({
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
}
