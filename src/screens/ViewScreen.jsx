import React from "react";
import TripViewHeader from "../components/TripViewHeader";
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
    tripConfig,
    cloudSlug,
    cloudTripId,
    isSupabaseConfigured,
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
