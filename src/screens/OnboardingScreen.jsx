import React from "react";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import OnboardingTripsPanel from "../components/onboarding/OnboardingTripsPanel";
import OnboardingCreatePanel from "../components/onboarding/OnboardingCreatePanel";
import ImportJsonDrawer from "../components/drawers/ImportJsonDrawer";
import SignInDrawer from "../components/drawers/SignInDrawer";
import ToastLayer from "../components/ToastLayer";

export default function OnboardingScreen({
  onboardingPage,
  onSwitchPage,
  user,
  onGoCreate,
  onSignOut,
  onSignIn,
  savedUpcomingTrips,
  savedPastTrips,
  showPastSavedTrips,
  onTogglePast,
  onOpenTrip,
  extractCoverImage,
  formatVisibilityLabel,
  onStartFromTemplate,
  onStartFromScratch,
  quickTemplates,
  onStartFromQuickTemplate,
  isAdminUser,
  onOpenImportModal,
  showImportModal,
  importJson,
  onImportJsonChange,
  importError,
  onCloseImportModal,
  onImportJson,
  showSignInModal,
  onCloseSignInModal,
  isSupabaseConfigured,
  signInEmail,
  onSignInEmailChange,
  onGoogleSignIn,
  onSubmitSignIn,
  signInLoading,
  toasts,
}) {
  return (
    <>
      <OnboardingShell onboardingPage={onboardingPage} onSwitchPage={onSwitchPage}>
        {onboardingPage === "trips" ? (
          <OnboardingTripsPanel
            user={user}
            onGoCreate={onGoCreate}
            onSignOut={onSignOut}
            onSignIn={onSignIn}
            savedUpcomingTrips={savedUpcomingTrips}
            savedPastTrips={savedPastTrips}
            showPastSavedTrips={showPastSavedTrips}
            onTogglePast={onTogglePast}
            onOpenTrip={onOpenTrip}
            extractCoverImage={extractCoverImage}
            formatVisibilityLabel={formatVisibilityLabel}
          />
        ) : (
          <OnboardingCreatePanel
            onStartFromTemplate={onStartFromTemplate}
            onStartFromScratch={onStartFromScratch}
            quickTemplates={quickTemplates}
            onStartFromQuickTemplate={onStartFromQuickTemplate}
            isAdminUser={isAdminUser}
            onOpenImportModal={onOpenImportModal}
          />
        )}

        <ImportJsonDrawer
          open={showImportModal}
          isAdminUser={isAdminUser}
          importJson={importJson}
          onImportJsonChange={onImportJsonChange}
          importError={importError}
          onClose={onCloseImportModal}
          onImport={onImportJson}
        />
      </OnboardingShell>
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
      <ToastLayer toasts={toasts} />
    </>
  );
}
