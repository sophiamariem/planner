import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

function getMapPreviewUrls(pins = []) {
  const valid = (pins || []).filter((p) => Array.isArray(p?.ll) && p.ll.length === 2).slice(0, 8);
  if (!valid.length) return [];
  const lats = valid.map((p) => Number(p.ll[0])).filter(Number.isFinite);
  const lons = valid.map((p) => Number(p.ll[1])).filter(Number.isFinite);
  if (!lats.length || !lons.length) return [];
  const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;
  const markerParam = valid
    .map((p) => `${Number(p.ll[0]).toFixed(6)},${Number(p.ll[1]).toFixed(6)},red-pushpin`)
    .join('|');
  const osm = `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat.toFixed(6)},${centerLon.toFixed(6)}&zoom=11&size=800x360&markers=${encodeURIComponent(markerParam)}`;
  const yandexMarkers = valid
    .map((p) => `${Number(p.ll[1]).toFixed(6)},${Number(p.ll[0]).toFixed(6)},pm2rdm`)
    .join('~');
  const yandex = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${centerLon.toFixed(6)},${centerLat.toFixed(6)}&z=11&l=map&size=650,320&pt=${encodeURIComponent(yandexMarkers)}`;
  return [osm, yandex];
}

function RemoteImage({ uri, fallbackUri, fallbackUris = [], style, resizeMode = 'cover' }) {
  const candidates = useMemo(() => {
    const list = [uri, ...(Array.isArray(fallbackUris) ? fallbackUris : []), fallbackUri].filter((v) => String(v || '').trim());
    return [...new Set(list)];
  }, [uri, fallbackUri, fallbackUris]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sourceUri = candidates[sourceIndex] || '';

  useEffect(() => {
    setSourceIndex(0);
  }, [candidates]);

  if (!sourceUri) {
    return <View style={[style, { backgroundColor: '#e5e7eb' }]} />;
  }
  return (
    <Image
      source={{ uri: sourceUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        setSourceIndex((prev) => Math.min(prev + 1, candidates.length - 1));
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

function flightDisplayTitle(flight, index, total) {
  if (String(flight?.title || '').trim()) return String(flight.title).trim();
  if (total <= 1) return 'Flight Out';
  if (index === 0) return 'Flight Out';
  if (index === total - 1) return 'Flight Home';
  return 'Domestic Flight';
}

function IconActionButton({ iconName, onPress, tone = 'default', accessibilityLabel, compact = false }) {
  const palette = tone === 'danger'
    ? { bg: '#fef2f2', border: '#fecaca', fg: '#b91c1c' }
    : tone === 'primary'
      ? { bg: '#eff6ff', border: '#bfdbfe', fg: '#1d4ed8' }
      : { bg: '#ffffff', border: '#d1d5db', fg: '#111827' };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        width: compact ? 36 : 42,
        height: compact ? 36 : 42,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={iconName} size={compact ? 16 : 18} color={palette.fg} />
    </Pressable>
  );
}

function DayPhotoLayout({ photos = [], query = '' }) {
  const list = (Array.isArray(photos) ? photos : []).slice(0, 5);
  if (!list.length) return null;

  if (list.length === 1) {
    return (
      <View style={{ width: '100%', height: 240, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
        <RemoteImage uri={list[0]} fallbackUri={fallbackPhotoUri(query, 0)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
    );
  }

  if (list.length === 2) {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {list.map((uri, i) => (
          <View key={`${uri}-${i}`} style={{ flex: 1, height: 190, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
            <RemoteImage uri={uri} fallbackUri={fallbackPhotoUri(query, i)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ))}
      </View>
    );
  }

  const extra = list.length - 3;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1.7, height: 240, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
        <RemoteImage uri={list[0]} fallbackUri={fallbackPhotoUri(query, 0)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
          <RemoteImage uri={list[1]} fallbackUri={fallbackPhotoUri(query, 1)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
          <RemoteImage uri={list[2]} fallbackUri={fallbackPhotoUri(query, 2)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          {extra > 0 ? (
            <View style={{ position: 'absolute', right: 8, bottom: 8, borderRadius: 999, backgroundColor: 'rgba(17,24,39,0.82)', paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>+{extra}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function TripViewScreen({ tripRow, onBack, onEdit, onDelete, onToast }) {
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2 }}>
        <IconActionButton iconName="chevron-back-outline" onPress={onBack} accessibilityLabel="Back to saved trips" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconActionButton iconName="trash-outline" onPress={onDelete} tone="danger" accessibilityLabel="Delete trip" />
          <IconActionButton iconName="create-outline" onPress={onEdit} tone="primary" accessibilityLabel="Edit trip" />
          <IconActionButton iconName="share-social-outline" onPress={handleShareTrip} accessibilityLabel="Share trip" />
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
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <Text style={{ flex: 1, fontSize: 26, fontWeight: '800', color: '#111827' }}>{title}</Text>
              <IconActionButton
                iconName={hasOfflineCopy ? 'checkmark-done-outline' : 'download-outline'}
                onPress={handleToggleOffline}
                tone={hasOfflineCopy ? 'primary' : 'default'}
                compact
                accessibilityLabel={hasOfflineCopy ? 'Offline saved' : 'Save for offline'}
              />
            </View>
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
            {tripFooter ? (
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{tripFooter}</Text>
            ) : null}
          </View>
        </View>

        <View style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 14, backgroundColor: '#ffffff', padding: 10, gap: 8 }}>
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
              <View key={`flight-${i}`} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#f8fafc', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="airplane-outline" size={14} color="#111827" />
                    <Text style={{ color: '#111827', fontWeight: '800' }}>{flightDisplayTitle(f, i, flights.length)}</Text>
                  </View>
                  <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '700' }}>{f.num || ''}</Text>
                </View>
                <Text style={{ color: '#374151', fontSize: 13, fontWeight: '600' }}>{f.route || `${f.flightFrom || ''} → ${f.flightTo || ''}`}</Text>
                {f.date ? <Text style={{ color: '#6b7280', fontSize: 12 }}>{f.date}</Text> : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {f.times ? (
                    <View style={{ borderWidth: 1, borderColor: '#2563eb', borderRadius: 999, backgroundColor: '#2563eb', paddingHorizontal: 9, paddingVertical: 4 }}>
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>{f.times}</Text>
                    </View>
                  ) : null}
                  {f.codes ? (
                    <View style={{ borderWidth: 1, borderColor: '#111827', borderRadius: 999, backgroundColor: '#111827', paddingHorizontal: 9, paddingVertical: 4 }}>
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>{f.codes}</Text>
                    </View>
                  ) : null}
                </View>
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
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                    <View style={{ borderRadius: 999, backgroundColor: '#2563eb', paddingHorizontal: 9, paddingVertical: 4 }}>
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>{day.dow || 'Day'}</Text>
                    </View>
                    <View style={{ borderRadius: 999, backgroundColor: '#7c3aed', paddingHorizontal: 9, paddingVertical: 4 }}>
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>{day.date || day.isoDate || ''}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#111827', fontWeight: '800', fontSize: 16 }}>
                    {normalizeDayTitle(day.title, index, days.length)}
                  </Text>
                </View>
              </View>

              <DayPhotoLayout photos={day.photos || []} query={day.photoQ || day.title} />

              {day.route ? (
                <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, backgroundColor: '#fafafa', paddingHorizontal: 10, paddingVertical: 7 }}>
                  <Text style={{ color: '#374151', fontSize: 12, fontWeight: '600' }}>Route: {day.route}</Text>
                </View>
              ) : null}

              {(day.notes || []).length > 0 ? (
                <LinearGradient
                  colors={['#fef3c7', '#fce7f3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, gap: 6 }}
                >
                  <Text style={{ color: '#7c2d12', fontWeight: '700', fontSize: 12 }}>Plan</Text>
                  {(day.notes || []).map((note, i) => (
                    <View key={`note-${i}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                      <View style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                      </View>
                      <Text style={{ color: '#374151', fontSize: 13, flex: 1 }}>{note}</Text>
                    </View>
                  ))}
                </LinearGradient>
              ) : (
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>No notes for this day.</Text>
              )}

              {Array.isArray(day.pins) && day.pins.length > 0 ? (
                <View style={{ gap: 6 }}>
                  {String(day.route || '').trim() && getMapPreviewUrls(day.pins).length > 0 ? (
                    <Pressable onPress={() => openPinInMaps(day.pins[0])} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                      <RemoteImage
                        uri={getMapPreviewUrls(day.pins)[0]}
                        fallbackUris={getMapPreviewUrls(day.pins).slice(1)}
                        fallbackUri=""
                        style={{ width: '100%', height: 132, backgroundColor: '#f1f5f9' }}
                        resizeMode="cover"
                      />
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
