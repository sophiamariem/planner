import React from "react";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import OnboardingTripsPanel from "../components/onboarding/OnboardingTripsPanel";
import OnboardingCreatePanel from "../components/onboarding/OnboardingCreatePanel";

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
}) {
  return (
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
    </OnboardingShell>
  );
}
