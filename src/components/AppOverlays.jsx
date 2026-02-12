import React from "react";
import ToastLayer from "./ToastLayer";
import SignInDrawer from "./drawers/SignInDrawer";
import ResetDrawer from "./drawers/ResetDrawer";
import ShareDrawer from "./drawers/ShareDrawer";
import MyTripsDrawer from "./drawers/MyTripsDrawer";
import ImportJsonDrawer from "./drawers/ImportJsonDrawer";

export default function AppOverlays({
  toasts,
  showSignInModal,
  onCloseSignInModal,
  isSupabaseConfigured,
  signInEmail,
  onSignInEmailChange,
  onGoogleSignIn,
  onSubmitSignIn,
  signInLoading,
  showResetModal,
  onCloseResetModal,
  onConfirmReset,
  showShareModal,
  onCloseShareModal,
  publishIssues,
  onFixIssue,
  currentShareURL,
  canCopyShareLink,
  onCopyShareLink,
  user,
  cloudSaving,
  onOpenSignInFromShare,
  cloudTripId,
  isCloudOwnedByCurrentUser,
  cloudShareAccess,
  onShareAccessChange,
  collaboratorEmail,
  onCollaboratorEmailChange,
  onAddCollaborator,
  collaboratorsLoading,
  collaborators,
  onRemoveCollaborator,
  isViewOnly,
  onViewOnlyChange,
  showMyTripsModal,
  onCloseMyTripsModal,
  myTripsLoading,
  myTrips,
  savedUpcomingTrips,
  savedPastTrips,
  showPastSavedTrips,
  onTogglePast,
  onOpenTrip,
  onDeleteTrip,
  extractCoverImage,
  formatVisibilityLabel,
  cloudVisibility,
  onChangeVisibility,
  showImportModal,
  isAdminUser,
  importJson,
  onImportJsonChange,
  importError,
  onCloseImportModal,
  onImportJson,
}) {
  return (
    <>
      <ToastLayer toasts={toasts} />

      <SignInDrawer
        open={showSignInModal}
        onClose={onCloseSignInModal}
        isSupabaseConfigured={isSupabaseConfigured}
        signInEmail={signInEmail}
        onEmailChange={onSignInEmailChange}
        onGoogleSignIn={onGoogleSignIn}
        onSubmitSignIn={onSubmitSignIn}
        signInLoading={signInLoading}
      />

      <ResetDrawer open={showResetModal} onClose={onCloseResetModal} onConfirm={onConfirmReset} />

      <ShareDrawer
        open={showShareModal}
        onClose={onCloseShareModal}
        publishIssues={publishIssues}
        onFixIssue={onFixIssue}
        currentShareURL={currentShareURL}
        canCopyShareLink={canCopyShareLink}
        onCopyShareLink={onCopyShareLink}
        isSupabaseConfigured={isSupabaseConfigured}
        user={user}
        cloudSaving={cloudSaving}
        onOpenSignIn={onOpenSignInFromShare}
        cloudTripId={cloudTripId}
        isCloudOwnedByCurrentUser={isCloudOwnedByCurrentUser}
        cloudShareAccess={cloudShareAccess}
        onShareAccessChange={onShareAccessChange}
        collaboratorEmail={collaboratorEmail}
        onCollaboratorEmailChange={onCollaboratorEmailChange}
        onAddCollaborator={onAddCollaborator}
        collaboratorsLoading={collaboratorsLoading}
        collaborators={collaborators}
        onRemoveCollaborator={onRemoveCollaborator}
        isViewOnly={isViewOnly}
        onViewOnlyChange={onViewOnlyChange}
      />

      <MyTripsDrawer
        open={showMyTripsModal}
        onClose={onCloseMyTripsModal}
        myTripsLoading={myTripsLoading}
        myTrips={myTrips}
        savedUpcomingTrips={savedUpcomingTrips}
        savedPastTrips={savedPastTrips}
        showPastSavedTrips={showPastSavedTrips}
        onTogglePast={onTogglePast}
        onOpenTrip={onOpenTrip}
        onDeleteTrip={onDeleteTrip}
        extractCoverImage={extractCoverImage}
        formatVisibilityLabel={formatVisibilityLabel}
        cloudVisibility={cloudVisibility}
        onChangeVisibility={onChangeVisibility}
      />

      <ImportJsonDrawer
        open={showImportModal}
        isAdminUser={isAdminUser}
        importJson={importJson}
        onImportJsonChange={onImportJsonChange}
        importError={importError}
        onClose={onCloseImportModal}
        onImport={onImportJson}
      />
    </>
  );
}
