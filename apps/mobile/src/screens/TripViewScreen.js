import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

function defaultDayTitle(index, total) {
  if (index === 0) return 'Arrival';
  if (index === total - 1) return 'Departure';
  return `Day ${index + 1}`;
}

function normalizeDayTitle(title, index, total) {
  const raw = String(title || '').trim();
  if (!raw || /^day\s+nan$/i.test(raw)) return defaultDayTitle(index, total);
  return raw;
}

function toIsoDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(value) {
  const s = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function shortDow(date) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
}

function shortMonth(date) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
}

function parseFlightDateCandidates(text, fallbackYear) {
  const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const src = String(text || '');
  const parsed = [];
  const withYear = [...src.matchAll(/(\d{1,2})\s*([A-Za-z]{3,9})\s*(20\d{2})/g)];
  for (const m of withYear) {
    const day = Number(m[1]);
    const month = monthMap[m[2].slice(0, 3).toLowerCase()];
    const year = Number(m[3]);
    if (month === undefined || !Number.isFinite(day) || !Number.isFinite(year)) continue;
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) parsed.push(d);
  }
  if (parsed.length) return parsed;

  const year = Number.isFinite(fallbackYear) ? fallbackYear : new Date().getFullYear();
  const withoutYear = [...src.matchAll(/(\d{1,2})\s*([A-Za-z]{3,9})/g)];
  for (const m of withoutYear) {
    const day = Number(m[1]);
    const month = monthMap[m[2].slice(0, 3).toLowerCase()];
    if (month === undefined || !Number.isFinite(day)) continue;
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) parsed.push(d);
  }
  return parsed;
}

function parseDayLabelDate(label, cursorDate, fallbackYear) {
  const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const m = String(label || '').trim().match(/(\d{1,2})\s+([A-Za-z]{3,9})/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = monthMap[m[2].slice(0, 3).toLowerCase()];
  if (!Number.isFinite(day) || month === undefined) return null;
  const year = Number.isFinite(fallbackYear) ? fallbackYear : (cursorDate ? cursorDate.getFullYear() : new Date().getFullYear());
  let d = new Date(year, month, day);
  if (cursorDate && d < cursorDate) d = new Date(year + 1, month, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeDaysWithInferredDates(days = [], flights = [], calendarYear) {
  const result = [];
  const candidates = flights.flatMap((f) => parseFlightDateCandidates(f?.date, calendarYear));
  candidates.sort((a, b) => a.getTime() - b.getTime());
  let cursor = candidates[0] ? new Date(candidates[0]) : null;

  for (let i = 0; i < days.length; i += 1) {
    const day = { ...(days[i] || {}) };
    const explicit = parseIsoDate(day.isoDate);
    let resolved = explicit ? new Date(explicit) : null;
    if (!resolved) resolved = parseDayLabelDate(day.date, cursor, calendarYear);
    if (!resolved && cursor) resolved = new Date(cursor);
    if (!resolved && candidates[0]) {
      resolved = new Date(candidates[0]);
      resolved.setDate(resolved.getDate() + i);
    }
    if (resolved) {
      day.isoDate = toIsoDate(resolved);
      day.dow = shortDow(resolved);
      day.date = `${resolved.getDate()} ${shortMonth(resolved)}`;
      cursor = new Date(resolved);
      cursor.setDate(cursor.getDate() + 1);
    }
    result.push(day);
  }
  return result;
}

function fallbackPhotoUri(query, index = 0) {
  const seed = encodeURIComponent(String(query || 'travel').trim() || 'travel');
  return `https://picsum.photos/seed/${seed}-${index}/1200/800`;
}

function RemoteImage({ uri, fallbackUri, style, resizeMode = 'cover' }) {
  const [sourceUri, setSourceUri] = useState(uri || fallbackUri || '');
  useEffect(() => {
    setSourceUri(uri || fallbackUri || '');
  }, [uri, fallbackUri]);
  if (!sourceUri) {
    return <View style={[style, { backgroundColor: '#e5e7eb' }]} />;
  }
  return (
    <Image
      source={{ uri: sourceUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (sourceUri !== fallbackUri && fallbackUri) setSourceUri(fallbackUri);
      }}
    />
  );
}

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

function getMapPreviewUrl(pins = []) {
  const valid = (pins || []).filter((p) => Array.isArray(p?.ll) && p.ll.length === 2).slice(0, 8);
  if (!valid.length) return null;
  const lats = valid.map((p) => Number(p.ll[0])).filter(Number.isFinite);
  const lons = valid.map((p) => Number(p.ll[1])).filter(Number.isFinite);
  if (!lats.length || !lons.length) return null;
  const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;
  const markerParam = valid
    .map((p) => `${Number(p.ll[0]).toFixed(6)},${Number(p.ll[1]).toFixed(6)},red-pushpin`)
    .join('|');
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat.toFixed(6)},${centerLon.toFixed(6)}&zoom=11&size=800x360&markers=${encodeURIComponent(markerParam)}`;
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

export default function TripViewScreen({ tripRow, onBack, onEdit, onToast }) {
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
  const shareUrl = buildShareUrl(tripRow);

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
      onToast?.('Save this trip first to get a share link.');
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
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Back to Saved" onPress={onBack} variant="outline" />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Share Trip" onPress={handleShareTrip} variant="outline" />
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
              <RemoteImage uri={cover} fallbackUri={fallbackPhotoUri(title)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ) : null}
          <View style={{ padding: 14, gap: 6 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827' }}>{title}</Text>
            <Text style={{ color: '#6b7280' }}>
              {startDate ? `Starts ${startDate}` : 'Add dates in edit mode'} • {days.length} day(s)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              {startDate ? (
                <View style={{ borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#fef3c7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: '#92400e', fontSize: 11, fontWeight: '700' }}>{startDate}</Text>
                </View>
              ) : null}
              <View style={{ borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: '700' }}>{days.length} days</Text>
              </View>
            </View>
            {upcoming ? (
              <View style={{ marginTop: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '700' }}>Coming up: {upcoming.title || `${upcoming.dow || ''} ${upcoming.date || ''}`}</Text>
              </View>
            ) : null}
            {tripFooter ? (
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{tripFooter}</Text>
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
                  <Text style={{ color: '#111827', fontWeight: '800', fontSize: 16 }}>
                    {normalizeDayTitle(day.title, index, days.length)}
                  </Text>
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
                    <View key={`${uri}-${i}`} style={{ width: 220, height: 150, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
                      <RemoteImage uri={uri} fallbackUri={fallbackPhotoUri(day.photoQ || day.title, i)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                  ))}
                </ScrollView>
              ) : null}

              {day.route ? (
                <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, backgroundColor: '#fafafa', paddingHorizontal: 10, paddingVertical: 7 }}>
                  <Text style={{ color: '#374151', fontSize: 12, fontWeight: '600' }}>Route: {day.route}</Text>
                </View>
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

              {Array.isArray(day.pins) && day.pins.length > 0 ? (
                <View style={{ gap: 6 }}>
                  {getMapPreviewUrl(day.pins) ? (
                    <Pressable onPress={() => openPinInMaps(day.pins[0])} style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 12, overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                      <RemoteImage
                        uri={getMapPreviewUrl(day.pins)}
                        fallbackUri=""
                        style={{ width: '100%', height: 170, backgroundColor: '#f1f5f9' }}
                        resizeMode="cover"
                      />
                      <View style={{ position: 'absolute', right: 8, bottom: 8, borderWidth: 1, borderColor: '#dbeafe', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: '#1e3a8a', fontSize: 11, fontWeight: '700' }}>Open map</Text>
                      </View>
                    </Pressable>
                  ) : null}
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>Locations</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {day.pins.map((pin, pinIndex) => (
                      <Pressable key={`${pin?.name || 'pin'}-${pinIndex}`} onPress={() => openPinInMaps(pin)} style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 999, backgroundColor: '#eff6ff', paddingHorizontal: 9, paddingVertical: 4 }}>
                        <Text style={{ color: '#1e3a8a', fontSize: 12 }}>{pin?.name || 'Location'}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
