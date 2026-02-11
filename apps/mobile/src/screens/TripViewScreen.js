import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

function formatStartDate(days) {
  const start = (days || []).map((d) => d.isoDate).filter(Boolean).sort()[0];
  if (!start) return null;
  const date = new Date(`${start}T00:00:00`);
  if (Number.isNaN(date.getTime())) return start;
  return date.toDateString();
}

function extractCover(tripData) {
  return tripData?.tripConfig?.cover || (tripData?.days || []).find((d) => (d.photos || []).length > 0)?.photos?.[0] || null;
}

function getOfflineKey(tripId) {
  return `trip-offline:${tripId}`;
}

export default function TripViewScreen({ tripRow, onBack, onEdit, onToast }) {
  const scrollRef = useRef(null);
  const dayOffsetsRef = useRef({});
  const tripData = tripRow?.trip_data || {};
  const tripId = tripRow?.id || 'unknown';
  const title = tripData?.tripConfig?.title || tripRow?.title || 'Untitled Trip';
  const days = Array.isArray(tripData?.days) ? tripData.days : [];
  const flights = Array.isArray(tripData?.flights) ? tripData.flights : [];
  const startDate = formatStartDate(days);
  const cover = extractCover(tripData);
  const [hasOfflineCopy, setHasOfflineCopy] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return days.find((d) => {
      if (!d.isoDate) return false;
      const date = new Date(`${d.isoDate}T00:00:00`);
      if (Number.isNaN(date.getTime())) return false;
      return date >= today;
    }) || days[0] || null;
  }, [days]);

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

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Back to Saved" onPress={onBack} variant="outline" />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Edit Trip" onPress={onEdit} />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        stickyHeaderIndices={[1]}
      >
        <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, backgroundColor: '#ffffff', overflow: 'hidden' }}>
          {cover ? (
            <View style={{ width: '100%', height: 200 }}>
              <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ) : null}
          <View style={{ padding: 14, gap: 6 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827' }}>{title}</Text>
            <Text style={{ color: '#6b7280' }}>
              {startDate ? `Starts ${startDate}` : 'Add dates in edit mode'} • {days.length} day(s)
            </Text>
            {upcoming ? (
              <View style={{ marginTop: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '700' }}>Coming up: {upcoming.title || `${upcoming.dow || ''} ${upcoming.date || ''}`}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 14, backgroundColor: '#ffffff', padding: 10, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ color: '#111827', fontWeight: '800', fontSize: 14 }}>
              {upcoming ? `Today / Next: ${upcoming.title || `${upcoming.dow || ''} ${upcoming.date || ''}`}` : 'Today / Next'}
            </Text>
            <Pressable
              onPress={handleToggleOffline}
              style={{
                borderWidth: 1,
                borderColor: hasOfflineCopy ? '#bbf7d0' : '#d1d5db',
                backgroundColor: hasOfflineCopy ? '#f0fdf4' : '#ffffff',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: hasOfflineCopy ? '#166534' : '#374151', fontSize: 11, fontWeight: '700' }}>
                {hasOfflineCopy ? 'Offline saved' : 'Save offline'}
              </Text>
            </Pressable>
          </View>
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
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: activeDayIndex === index ? '#ffffff' : '#374151', fontSize: 11, fontWeight: '700' }}>
                  Day {index + 1}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {flights.length > 0 ? (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, backgroundColor: '#ffffff', padding: 12, gap: 8 }}>
            <Text style={{ color: '#111827', fontWeight: '800', fontSize: 16 }}>Flights</Text>
            {flights.map((f, i) => (
              <View key={`flight-${i}`} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#f8fafc', gap: 3 }}>
                <Text style={{ color: '#111827', fontWeight: '700' }}>{f.title || 'Flight'}</Text>
                <Text style={{ color: '#4b5563', fontSize: 12 }}>{f.route || `${f.flightFrom || ''} → ${f.flightTo || ''}`}</Text>
                {f.date ? <Text style={{ color: '#6b7280', fontSize: 12 }}>{f.date}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          {days.map((day, index) => (
            <View
              key={`${day.id || index}-${index}`}
              onLayout={(event) => {
                dayOffsetsRef.current[index] = event.nativeEvent.layout.y;
              }}
              style={{
                borderWidth: 1,
                borderColor: activeDayIndex === index ? '#bfdbfe' : '#e5e7eb',
                borderRadius: 16,
                backgroundColor: activeDayIndex === index ? '#f8fbff' : '#ffffff',
                padding: 12,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#111827', fontWeight: '800', fontSize: 16 }}>{day.title || `Day ${index + 1}`}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>
                    {day.dow || ''} {day.date || day.isoDate || ''}
                  </Text>
                </View>
                {day.isoDate ? (
                  <View style={{ borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: '700' }}>Day {index + 1}</Text>
                  </View>
                ) : null}
              </View>

              {(day.photos || []).length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {(day.photos || []).slice(0, 6).map((uri, i) => (
                    <View key={`${uri}-${i}`} style={{ width: 140, height: 95, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                  ))}
                </ScrollView>
              ) : null}

              {(day.notes || []).length > 0 ? (
                <View style={{ gap: 5 }}>
                  {(day.notes || []).map((note, i) => (
                    <View key={`note-${i}`} style={{ flexDirection: 'row', gap: 6 }}>
                      <Text style={{ color: '#9ca3af' }}>•</Text>
                      <Text style={{ color: '#374151', fontSize: 13, flex: 1 }}>{note}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>No notes for this day.</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
