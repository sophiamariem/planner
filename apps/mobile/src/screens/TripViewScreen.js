import React from 'react';
import { ScrollView, View } from 'react-native';
import TripTopBar from './tripView/TripTopBar';
import TripHeaderCard from './tripView/TripHeaderCard';
import TripDayCard from './tripView/TripDayCard';
import TripFlightsCard from './tripView/TripFlightsCard';
import TripViewSwitcher from './tripView/TripViewSwitcher';
import { getDayNavLabel } from './tripView/dateUtils';
import useTripViewController from './tripView/useTripViewController';

export default function TripViewScreen({ tripRow, currentUserId, savingSharedCopy = false, onSaveSharedCopy, onBack, onEdit, onDelete, onToast }) {
  const {
    scrollRef,
    dayOffsetsRef,
    title,
    flights,
    days,
    startDate,
    cover,
    tripFooter,
    hasOfflineCopy,
    activeDayIndex,
    setActiveDayIndex,
    viewMode,
    setViewMode,
    shareUrl,
    isSharedNotOwned,
    copiedFrom,
    selectedDay,
    calendarMonths,
    normalizeArrowText,
    handleToggleOffline,
    handleJumpToDay,
    openPinInMaps,
    handleShareTrip,
  } = useTripViewController({
    tripRow,
    currentUserId,
    onToast,
  });

  return (
    <View style={{ flex: 1 }}>
      <TripTopBar
        onBack={onBack}
        onDelete={onDelete}
        onEdit={onEdit}
        onShare={handleShareTrip}
        shareDisabled={!shareUrl}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        stickyHeaderIndices={[1]}
      >
        <TripHeaderCard
          cover={cover}
          title={title}
          hasOfflineCopy={hasOfflineCopy}
          onToggleOffline={handleToggleOffline}
          isSharedNotOwned={isSharedNotOwned}
          onSaveSharedCopy={onSaveSharedCopy}
          savingSharedCopy={savingSharedCopy}
          copiedFrom={copiedFrom}
          startDate={startDate}
          daysCount={days.length}
          tripFooter={tripFooter}
        />

        <TripViewSwitcher
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          days={days}
          activeDayIndex={activeDayIndex}
          onJumpToDay={handleJumpToDay}
          calendarMonths={calendarMonths}
          onSelectDayIndex={setActiveDayIndex}
          getDayNavLabel={getDayNavLabel}
        />

        <TripFlightsCard flights={flights} normalizeArrowText={normalizeArrowText} />

        <View style={{ gap: 12 }}>
          {viewMode === 'cards'
            ? days.map((day, index) => (
              <TripDayCard
                key={`day-card-${day.id || index}`}
                day={day}
                index={index}
                totalDays={days.length}
                isActive
                onLayout={(event) => {
                  dayOffsetsRef.current[index] = event.nativeEvent.layout.y;
                }}
                onOpenPin={openPinInMaps}
                normalizeArrowText={normalizeArrowText}
              />
            ))
            : (selectedDay ? (
              <TripDayCard
                key={`day-card-selected-${selectedDay.id || activeDayIndex}`}
                day={selectedDay}
                index={activeDayIndex}
                totalDays={days.length}
                isActive={false}
                onOpenPin={openPinInMaps}
                normalizeArrowText={normalizeArrowText}
              />
            ) : null)}
        </View>
      </ScrollView>
    </View>
  );
}
