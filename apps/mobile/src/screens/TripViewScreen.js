import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import TripTopBar from './tripView/TripTopBar';
import TripHeaderCard from './tripView/TripHeaderCard';
import TripDayCard from './tripView/TripDayCard';
import TripCalendarPanel from './tripView/TripCalendarPanel';
import TripFlightsCard from './tripView/TripFlightsCard';
import { formatStartDate, getDayNavLabel, normalizeDaysWithInferredDates, parseIsoDate } from './tripView/dateUtils';

function extractCover(tripData) {
  return tripData?.tripConfig?.cover || (tripData?.days || []).find((d) => (d.photos || []).length > 0)?.photos?.[0] || null;
}

function getMapQueryUrl(pin) {
  if (Array.isArray(pin?.ll) && pin.ll.length === 2) {
    const lat = Number(pin.ll[0]);
    const lon = Number(pin.ll[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }
  }
  const q = String(pin?.q || pin?.name || '').trim();
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function getOfflineKey(tripId) {
  return `trip-offline:${tripId}`;
}

function buildShareUrl(tripRow) {
  const slug = String(tripRow?.slug || '').trim();
  if (!slug) return null;
  const base = String(process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://plnr.guide').replace(/\/+$/, '');
  return `${base}/${slug}`;
}

function normalizeArrowText(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\s*->\s*/g, ' → ');
}

export default function TripViewScreen({ tripRow, currentUserId, savingSharedCopy = false, onSaveSharedCopy, onBack, onEdit, onDelete, onToast }) {
  const scrollRef = useRef(null);
  const dayOffsetsRef = useRef({});
  const tripData = tripRow?.trip_data || {};
  const tripId = tripRow?.id || 'unknown';
  const title = tripData?.tripConfig?.title || tripRow?.title || 'Untitled Trip';
  const calendarYear = Number(tripData?.tripConfig?.calendar?.year);
  const flights = Array.isArray(tripData?.flights) ? tripData.flights : [];
  const days = useMemo(
    () => normalizeDaysWithInferredDates(Array.isArray(tripData?.days) ? tripData.days : [], flights, Number.isFinite(calendarYear) ? calendarYear : undefined),
    [tripData?.days, flights, calendarYear],
  );
  const startDate = formatStartDate(days);
  const cover = extractCover(tripData);
  const tripFooter = String(tripData?.tripConfig?.footer || '').trim();
  const [hasOfflineCopy, setHasOfflineCopy] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState('cards');
  const shareUrl = buildShareUrl(tripRow);
  const isSharedNotOwned = Boolean(tripRow?.owner_id && currentUserId && tripRow.owner_id !== currentUserId);
  const copiedFrom = tripData?.tripConfig?.copiedFrom || null;
  const selectedDay = days[activeDayIndex] || null;

  const calendarMonths = useMemo(() => {
    const dated = (days || [])
      .map((d, i) => ({ index: i, iso: String(d?.isoDate || '').trim() }))
      .filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v.iso));
    const byIso = new Map(dated.map((v) => [v.iso, v.index]));
    if (!dated.length) {
      const fallbackYear = Number.isFinite(calendarYear) ? calendarYear : new Date().getFullYear();
      const fallbackMonth = Number.isFinite(Number(tripData?.tripConfig?.calendar?.month))
        ? Number(tripData?.tripConfig?.calendar?.month)
        : new Date().getMonth();
      return {
        byIso,
        months: [{ year: fallbackYear, month: fallbackMonth }],
      };
    }

    const firstIso = dated[0].iso;
    const lastIso = dated[dated.length - 1].iso;
    const start = parseIsoDate(firstIso);
    const end = parseIsoDate(lastIso);
    if (!start || !end) {
      return { byIso, months: [] };
    }

    const months = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= endMonth) {
      months.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return { byIso, months };
  }, [days, calendarYear, tripData?.tripConfig?.calendar?.month]);

  useEffect(() => {
    let mounted = true;
    const loadOfflineStatus = async () => {
      const raw = await AsyncStorage.getItem(getOfflineKey(tripId));
      if (mounted) setHasOfflineCopy(Boolean(raw));
    };
    loadOfflineStatus();
    return () => {
      mounted = false;
    };
  }, [tripId]);

  useEffect(() => {
    if (!days.length) {
      setActiveDayIndex(0);
      return;
    }
    setActiveDayIndex((prev) => Math.min(Math.max(prev, 0), days.length - 1));
  }, [days.length]);

  const handleToggleOffline = async () => {
    const key = getOfflineKey(tripId);
    if (hasOfflineCopy) {
      await AsyncStorage.removeItem(key);
      setHasOfflineCopy(false);
      onToast?.('Removed offline copy.');
      return;
    }
    const payload = {
      savedAt: new Date().toISOString(),
      trip: tripRow,
    };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
    setHasOfflineCopy(true);
    onToast?.('Trip saved for offline use.');
  };

  const handleJumpToDay = (index) => {
    setActiveDayIndex(index);
    const y = dayOffsetsRef.current[index];
    if (typeof y === 'number' && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 140), animated: true });
    }
  };

  const openPinInMaps = async (pin) => {
    const url = getMapQueryUrl(pin);
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      onToast?.('Could not open maps right now.');
    }
  };

  const handleShareTrip = async () => {
    if (!shareUrl) {
      onToast?.('Short share link is unavailable right now.', 'error');
      return;
    }
    try {
      await Share.share({
        title,
        message: `${title}\n${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      onToast?.('Could not open share right now.');
    }
  };

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

        <View style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 16, backgroundColor: '#ffffff', padding: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setViewMode('cards')}
              style={{
                borderWidth: 1,
                borderColor: viewMode === 'cards' ? '#111827' : '#d1d5db',
                backgroundColor: viewMode === 'cards' ? '#111827' : '#ffffff',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 7,
              }}
            >
              <Text style={{ color: viewMode === 'cards' ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>Cards</Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('calendar')}
              style={{
                borderWidth: 1,
                borderColor: viewMode === 'calendar' ? '#111827' : '#d1d5db',
                backgroundColor: viewMode === 'calendar' ? '#111827' : '#ffffff',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 7,
              }}
            >
              <Text style={{ color: viewMode === 'calendar' ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>Calendar</Text>
            </Pressable>
          </View>

          {viewMode === 'cards' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {days.map((day, index) => (
                <Pressable
                  key={`jump-${day.id || index}`}
                  onPress={() => handleJumpToDay(index)}
                  style={{
                    borderWidth: 1,
                    borderColor: activeDayIndex === index ? '#111827' : '#d1d5db',
                    backgroundColor: activeDayIndex === index ? '#111827' : '#ffffff',
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: activeDayIndex === index ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>
                    {getDayNavLabel(day, index)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <TripCalendarPanel
              calendarMonths={calendarMonths}
              activeDayIndex={activeDayIndex}
              onSelectDayIndex={setActiveDayIndex}
            />
          )}
        </View>

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
