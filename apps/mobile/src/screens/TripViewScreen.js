import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import TripTopBar from './tripView/TripTopBar';
import TripHeaderCard from './tripView/TripHeaderCard';
import TripDayCard from './tripView/TripDayCard';
import TripFlightsCard from './tripView/TripFlightsCard';
import TripViewSwitcher from './tripView/TripViewSwitcher';
import { getDayNavLabel } from './tripView/dateUtils';
import useTripViewController from './tripView/useTripViewController';

export default function TripViewScreen({ tripRow, currentUserId, savingSharedCopy = false, onSaveSharedCopy, onRefresh, onBack, onEdit, onDelete, onToast }) {
  const {
    scrollRef,
    dayOffsetsRef,
    dayListOffsetRef,
    stickyHeaderHeightRef,
    title,
    flights,
    days,
    startDate,
    cover,
    tripFooter,
    dayBadges,
    badgeLegend,
    hasOfflineCopy,
    activeDayIndex,
    setActiveDayIndex,
    viewMode,
    setViewMode,
    shareUrl,
    isSharedNotOwned,
    copiedFrom,
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
        onRefresh={onRefresh}
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

        <View
          onLayout={(event) => {
            stickyHeaderHeightRef.current = event.nativeEvent.layout.height;
          }}
        >
          <TripViewSwitcher
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            days={days}
            activeDayIndex={activeDayIndex}
            onJumpToDay={handleJumpToDay}
            calendarMonths={calendarMonths}
            dayBadges={dayBadges}
            onSelectDayIndex={(index) => {
              setActiveDayIndex(index);
              setViewMode('cards');
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  handleJumpToDay(index);
                });
              });
            }}
            getDayNavLabel={getDayNavLabel}
          />
          {badgeLegend.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              {badgeLegend.map((badge, i) => (
                <View key={`legend-${i}`} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ color: '#4b5563', fontSize: 12 }}>{`${String(badge?.emoji || '').trim()} ${String(badge?.label || '').trim()}`.trim()}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {viewMode === 'cards' ? (
          <>
            <TripFlightsCard flights={flights} normalizeArrowText={normalizeArrowText} />
            <View
              style={{ gap: 12 }}
              onLayout={(event) => {
                dayListOffsetRef.current = event.nativeEvent.layout.y;
              }}
            >
              {days.map((day, index) => (
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
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
