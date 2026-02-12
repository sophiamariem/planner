import React from "react";
import TripViewHeader from "../components/TripViewHeader";
import ToastLayer from "../components/ToastLayer";
import SignInDrawer from "../components/drawers/SignInDrawer";
import ResetDrawer from "../components/drawers/ResetDrawer";
import ShareDrawer from "../components/drawers/ShareDrawer";
import MyTripsDrawer from "../components/drawers/MyTripsDrawer";
import TripPreviewContent from "../components/TripPreviewContent";

export default function ViewScreen(props) {
  const {
    activePaletteBg,
    tripTitle,
    isSharedCloudTrip,
    canCollaborateOnSharedTrip,
    copiedFromOwnerId,
    onGoHome,
    view,
    onChangeView,
    filter,
    onChangeFilter,
    onShare,
    canSaveSharedCopy,
    onSaveSharedCopy,
    cloudSaving,
    canEditCurrentTrip,
    onEditTrip,
    onReset,
    user,
    onSignIn,
    onSignOut,
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
    tripConfig,
    cloudSlug,
    flights,
    days,
    filtered,
    showMaps,
    imgClass,
    selectedId,
    onSelectDay,
    dayBadges,
    selectedDay,
    activePaletteCard,
  } = props;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${activePaletteBg}`}>
      <TripViewHeader
        tripTitle={tripTitle}
        isSharedCloudTrip={isSharedCloudTrip}
        canCollaborateOnSharedTrip={canCollaborateOnSharedTrip}
        copiedFromOwnerId={copiedFromOwnerId}
        onGoHome={onGoHome}
        view={view}
        onChangeView={onChangeView}
        filter={filter}
        onChangeFilter={onChangeFilter}
        onShare={onShare}
        canSaveSharedCopy={canSaveSharedCopy}
        onSaveSharedCopy={onSaveSharedCopy}
        cloudSaving={cloudSaving}
        canEditCurrentTrip={canEditCurrentTrip}
        onEditTrip={onEditTrip}
        onReset={onReset}
        user={user}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />

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

      <TripPreviewContent
        tripConfig={tripConfig}
        cloudTripId={cloudTripId}
        cloudSlug={cloudSlug}
        user={user}
        isSupabaseConfigured={isSupabaseConfigured}
        flights={flights}
        days={days}
        onEditTrip={onEditTrip}
        view={view}
        filtered={filtered}
        showMaps={showMaps}
        imgClass={imgClass}
        selectedId={selectedId}
        onSelectDay={onSelectDay}
        dayBadges={dayBadges}
        selectedDay={selectedDay}
        activePaletteCard={activePaletteCard}
      />
    </div>
  );
}
