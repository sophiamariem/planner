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

function getDayNavLabel(day, index) {
  const dow = String(day?.dow || '').trim();
  const date = String(day?.date || '').trim();
  if (dow && date) return `${dow} ${date}`;
  if (date) return date;
  const iso = parseIsoDate(day?.isoDate);
  if (iso) return `${shortDow(iso)} ${iso.getDate()} ${shortMonth(iso)}`;
  return `Day ${index + 1}`;
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

function proxyImageUris(uri) {
  const raw = String(uri || '').trim();
  if (!raw) return [];
  const stripped = raw.replace(/^https?:\/\//i, '');
  const encoded = encodeURIComponent(stripped);
  return [
    `https://images.weserv.nl/?url=${encoded}&w=1600&output=jpg`,
    `https://wsrv.nl/?url=${encoded}&w=1600&output=jpg`,
  ];
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
  const fallbackList = Array.isArray(fallbackUris) ? fallbackUris : [];
  const candidatesKey = useMemo(
    () => [uri, ...fallbackList, fallbackUri].map((v) => String(v || '').trim()).filter(Boolean).join('|'),
    [uri, fallbackUri, fallbackList.join('|')],
  );
  const candidates = useMemo(() => {
    const list = [uri, ...fallbackList, fallbackUri].filter((v) => String(v || '').trim());
    return [...new Set(list)];
  }, [candidatesKey]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const sourceUri = candidates[sourceIndex] || '';

  useEffect(() => {
    setSourceIndex(0);
  }, [candidatesKey]);

  useEffect(() => {
    setLoaded(false);
  }, [sourceUri]);

  useEffect(() => {
    if (!sourceUri || loaded) return undefined;
    const timeout = setTimeout(() => {
      setSourceIndex((prev) => Math.min(prev + 1, candidates.length - 1));
    }, 2800);
    return () => clearTimeout(timeout);
  }, [sourceUri, loaded, candidates.length]);

  if (!sourceUri) {
    return <View style={[style, { backgroundColor: '#e5e7eb' }]} />;
  }
  return (
    <Image
      source={{ uri: sourceUri }}
      style={style}
      resizeMode={resizeMode}
      onLoad={() => setLoaded(true)}
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

function normalizeArrowText(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\s*->\s*/g, ' → ');
}

function flightDisplayTitle(flight, index, total) {
  if (String(flight?.title || '').trim()) return normalizeArrowText(String(flight.title).trim());
  if (total <= 1) return 'Flight Out';
  if (index === 0) return 'Flight Out';
  if (index === total - 1) return 'Flight Home';
  return 'Domestic Flight';
}

function IconActionButton({ iconName, onPress, tone = 'default', accessibilityLabel, compact = false, disabled = false }) {
  const palette = tone === 'danger'
    ? { bg: '#fef2f2', border: '#fecaca', fg: '#b91c1c' }
    : tone === 'primary'
      ? { bg: '#eff6ff', border: '#bfdbfe', fg: '#1d4ed8' }
      : { bg: '#ffffff', border: '#d1d5db', fg: '#111827' };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
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
        opacity: disabled ? 0.45 : 1,
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
      <View style={{ width: '100%', height: 280, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
        <RemoteImage uri={list[0]} fallbackUris={proxyImageUris(list[0])} fallbackUri={fallbackPhotoUri(query, 0)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
    );
  }

  if (list.length === 2) {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {list.map((uri, i) => (
          <View key={`${uri}-${i}`} style={{ flex: 1, height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
            <RemoteImage uri={uri} fallbackUris={proxyImageUris(uri)} fallbackUri={fallbackPhotoUri(query, i)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ))}
      </View>
    );
  }

  const extra = list.length - 3;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1.7, height: 280, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
        <RemoteImage uri={list[0]} fallbackUris={proxyImageUris(list[0])} fallbackUri={fallbackPhotoUri(query, 0)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
          <RemoteImage uri={list[1]} fallbackUris={proxyImageUris(list[1])} fallbackUri={fallbackPhotoUri(query, 1)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e5e7eb' }}>
          <RemoteImage uri={list[2]} fallbackUris={proxyImageUris(list[2])} fallbackUri={fallbackPhotoUri(query, 2)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          {extra > 0 ? (
            <View style={{ position: 'absolute', right: 8, bottom: 8, borderRadius: 999, backgroundColor: 'rgba(17,24,39,0.82)', paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>+{extra}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
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

  const renderDayCard = (day, index, withLayout = false) => (
    <View
      key={`${day?.id || index}-${index}`}
      onLayout={withLayout ? (event) => { dayOffsetsRef.current[index] = event.nativeEvent.layout.y; } : undefined}
      style={{
        borderWidth: 1,
        borderColor: activeDayIndex === index ? '#bfdbfe' : '#e5e7eb',
        borderRadius: 18,
        backgroundColor: activeDayIndex === index ? '#f8fbff' : '#ffffff',
        padding: 16,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ borderRadius: 999, backgroundColor: '#2563eb', paddingHorizontal: 11, paddingVertical: 5 }}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{day?.dow || 'Day'}</Text>
              </View>
              <View style={{ borderRadius: 999, backgroundColor: '#c026d3', paddingHorizontal: 11, paddingVertical: 5 }}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{day?.date || day?.isoDate || ''}</Text>
              </View>
            </View>
          </View>
          <Text style={{ color: '#111827', fontWeight: '800', fontSize: 28, lineHeight: 34 }}>
            {normalizeArrowText(normalizeDayTitle(day?.title, index, days.length))}
          </Text>
        </View>
      </View>

      {(day?.notes || []).length > 0 ? (
        <LinearGradient
          colors={['#fef3c7', '#fce7f3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
        >
          <Text style={{ color: '#7c2d12', fontWeight: '700', fontSize: 13 }}>Plan</Text>
          {(day?.notes || []).map((note, i) => (
            <View key={`note-${i}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <Text style={{ color: '#374151', fontSize: 14, flex: 1, lineHeight: 20 }}>{normalizeArrowText(note)}</Text>
            </View>
          ))}
        </LinearGradient>
      ) : (
        <Text style={{ color: '#9ca3af', fontSize: 13 }}>No notes for this day.</Text>
      )}

      <DayPhotoLayout photos={day?.photos || []} query={day?.photoQ || day?.title} />

      {day?.route ? (
        <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fafafa', paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: '#374151', fontSize: 13, fontWeight: '600' }}>Route: {normalizeArrowText(day.route)}</Text>
        </View>
      ) : null}

      {Array.isArray(day?.pins) && day.pins.length > 0 ? (
        <View style={{ gap: 6 }}>
          {String(day.route || '').trim() && getMapPreviewUrls(day.pins).length > 0 ? (
            <Pressable onPress={() => openPinInMaps(day.pins[0])} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', backgroundColor: '#f8fafc' }}>
              <RemoteImage
                uri={getMapPreviewUrls(day.pins)[0]}
                fallbackUris={getMapPreviewUrls(day.pins).slice(1)}
                fallbackUri=""
                style={{ width: '100%', height: 156, backgroundColor: '#f1f5f9' }}
                resizeMode="cover"
              />
            </Pressable>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {day.pins.map((pin, pinIndex) => (
              <Pressable key={`${pin?.name || 'pin'}-${pinIndex}`} onPress={() => openPinInMaps(pin)} style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 999, backgroundColor: '#eff6ff', paddingHorizontal: 11, paddingVertical: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="location-sharp" size={13} color="#1e3a8a" />
                  <Text style={{ color: '#1e3a8a', fontSize: 13 }}>{pin?.name || 'Location'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2 }}>
        <IconActionButton iconName="chevron-back-outline" onPress={onBack} accessibilityLabel="Back to saved trips" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconActionButton iconName="trash-outline" onPress={onDelete} tone="danger" accessibilityLabel="Delete trip" />
          <IconActionButton iconName="create-outline" onPress={onEdit} tone="primary" accessibilityLabel="Edit trip" />
          <IconActionButton iconName="share-social-outline" onPress={handleShareTrip} accessibilityLabel="Share trip" disabled={!shareUrl} />
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
            <View style={{ width: '100%', height: 240 }}>
              <RemoteImage uri={cover} fallbackUris={proxyImageUris(cover)} fallbackUri={fallbackPhotoUri(title)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ) : null}
          <View style={{ padding: 16, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <Text style={{ flex: 1, fontSize: 31, fontWeight: '800', color: '#111827' }}>{title}</Text>
              <IconActionButton
                iconName={hasOfflineCopy ? 'checkmark-done-outline' : 'download-outline'}
                onPress={handleToggleOffline}
                tone={hasOfflineCopy ? 'primary' : 'default'}
                compact
                accessibilityLabel={hasOfflineCopy ? 'Offline saved' : 'Save for offline'}
              />
            </View>
            {isSharedNotOwned ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#fffbeb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: '#92400e', fontSize: 12, fontWeight: '700' }}>Shared (read-only)</Text>
                </View>
                <Pressable
                  onPress={onSaveSharedCopy}
                  disabled={savingSharedCopy}
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    backgroundColor: '#ffffff',
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    opacity: savingSharedCopy ? 0.55 : 1,
                  }}
                >
                  <Text style={{ color: '#111827', fontSize: 12, fontWeight: '700' }}>
                    {savingSharedCopy ? 'Saving...' : 'Save to My Trips'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {!isSharedNotOwned && copiedFrom?.ownerId ? (
              <View style={{ borderWidth: 1, borderColor: '#ddd6fe', backgroundColor: '#f5f3ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
                <Text style={{ color: '#6d28d9', fontSize: 12, fontWeight: '700' }}>Copied from shared trip</Text>
              </View>
            ) : null}
            <Text style={{ color: '#6b7280', fontSize: 14 }}>
              {startDate ? `Starts ${startDate}` : 'Add dates in edit mode'} • {days.length} day(s)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              {startDate ? (
                <View style={{ borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#fef3c7', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ color: '#92400e', fontSize: 12, fontWeight: '700' }}>{startDate}</Text>
                </View>
              ) : null}
              <View style={{ borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '700' }}>{days.length} days</Text>
              </View>
            </View>
            {tripFooter ? (
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{tripFooter}</Text>
            ) : null}
          </View>
        </View>

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
            <View style={{ gap: 10 }}>
              {calendarMonths.months.map(({ year: y, month: m }) => {
                const monthName = new Date(y, m, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
                const firstDay = new Date(y, m, 1).getDay();
                const firstMon = (firstDay + 6) % 7;
                const daysIn = new Date(y, m + 1, 0).getDate();
                const cells = [];
                for (let i = 0; i < firstMon; i += 1) cells.push(null);
                for (let d = 1; d <= daysIn; d += 1) cells.push(d);
                while (cells.length % 7 !== 0) cells.push(null);

                return (
                  <View key={`${y}-${m}`} style={{ gap: 8 }}>
                    <Text style={{ color: '#111827', fontWeight: '700', fontSize: 14 }}>{monthName}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                        <Text key={`${monthName}-${d}`} style={{ width: `${100 / 7}%`, textAlign: 'center', color: '#6b7280', fontSize: 10, fontWeight: '700' }}>{d}</Text>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {cells.map((dayNum, idx) => {
                        if (dayNum === null) {
                          return <View key={`${y}-${m}-blank-${idx}`} style={{ width: '13.2%', aspectRatio: 1 }} />;
                        }
                        const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const dayIndex = calendarMonths.byIso.get(iso);
                        const isActive = typeof dayIndex === 'number';
                        const isSelected = isActive && dayIndex === activeDayIndex;
                        return (
                          <Pressable
                            key={`${y}-${m}-${dayNum}`}
                            onPress={() => isActive && setActiveDayIndex(dayIndex)}
                            disabled={!isActive}
                            style={{
                              width: '13.2%',
                              aspectRatio: 1,
                              borderRadius: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 1,
                              borderColor: isActive ? '#fbcfe8' : '#e5e7eb',
                              backgroundColor: isSelected ? '#c026d3' : (isActive ? '#fdf2f8' : '#ffffff'),
                              opacity: isActive ? 1 : 0.5,
                            }}
                          >
                            <Text style={{ color: isSelected ? '#ffffff' : (isActive ? '#111827' : '#9ca3af'), fontSize: 12, fontWeight: '700' }}>{dayNum}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {flights.length > 0 ? (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, backgroundColor: '#ffffff', padding: 14, gap: 10 }}>
            <Text style={{ color: '#111827', fontWeight: '800', fontSize: 18 }}>Flights</Text>
            {flights.map((f, i) => (
              <View key={`flight-${i}`} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, backgroundColor: '#f8fafc', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="airplane-outline" size={16} color="#111827" />
                    <Text style={{ color: '#111827', fontWeight: '800', fontSize: 16 }}>{flightDisplayTitle(f, i, flights.length)}</Text>
                  </View>
                  <Text style={{ color: '#6b7280', fontSize: 13, fontWeight: '700' }}>{normalizeArrowText(f.num || '')}</Text>
                </View>
                <Text style={{ color: '#374151', fontSize: 15, fontWeight: '600' }}>{normalizeArrowText(f.route || `${f.flightFrom || ''} → ${f.flightTo || ''}`)}</Text>
                {f.date ? <Text style={{ color: '#6b7280', fontSize: 13 }}>{f.date}</Text> : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {f.times ? (
                    <View style={{ borderWidth: 1, borderColor: '#2563eb', borderRadius: 999, backgroundColor: '#2563eb', paddingHorizontal: 11, paddingVertical: 5 }}>
                      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{normalizeArrowText(f.times)}</Text>
                    </View>
                  ) : null}
                  {f.codes ? (
                    <View style={{ borderWidth: 1, borderColor: '#111827', borderRadius: 999, backgroundColor: '#111827', paddingHorizontal: 11, paddingVertical: 5 }}>
                      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{normalizeArrowText(f.codes)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ gap: 12 }}>
          {viewMode === 'cards'
            ? days.map((day, index) => renderDayCard(day, index, true))
            : (selectedDay ? renderDayCard(selectedDay, activeDayIndex, false) : null)}
        </View>
      </ScrollView>
    </View>
  );
}
