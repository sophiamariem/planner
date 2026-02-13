import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Share } from 'react-native';
import { formatStartDate, normalizeDaysWithInferredDates, parseIsoDate } from './dateUtils';

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

function buildDrivingRouteUrlFromPins(pins = []) {
  const list = Array.isArray(pins) ? pins : [];
  const toPoint = (pin) => {
    if (Array.isArray(pin?.ll) && pin.ll.length === 2) {
      const lat = Number(pin.ll[0]);
      const lon = Number(pin.ll[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) return `${lat},${lon}`;
    }
    const q = String(pin?.q || pin?.name || '').trim();
    return q || '';
  };

  const points = list.map(toPoint).filter(Boolean).slice(0, 10);
  if (points.length < 2) return '';
  const origin = points[0];
  const destination = points[points.length - 1];
  const waypoints = points.slice(1, -1);

  const base = 'https://www.google.com/maps/dir/?api=1&travelmode=driving';
  const o = `&origin=${encodeURIComponent(origin)}`;
  const d = `&destination=${encodeURIComponent(destination)}`;
  const w = waypoints.length ? `&waypoints=${encodeURIComponent(waypoints.join('|'))}` : '';
  return `${base}${o}${d}${w}`;
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

export default function useTripViewController({ tripRow, currentUserId, onToast }) {
  const scrollRef = useRef(null);
  const dayOffsetsRef = useRef({});
  const dayListOffsetRef = useRef(0);
  const stickyHeaderHeightRef = useRef(0);
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
  const dayBadges = (tripData?.dayBadges && typeof tripData.dayBadges === 'object') ? tripData.dayBadges : {};
  const badgeLegend = Array.isArray(tripData?.tripConfig?.badgeLegend) ? tripData.tripConfig.badgeLegend : [];
  const [hasOfflineCopy, setHasOfflineCopy] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState('cards');
  const shareUrl = buildShareUrl(tripRow);
  const isSharedNotOwned = Boolean(tripRow?.owner_id && currentUserId && tripRow.owner_id !== currentUserId);
  const copiedFrom = tripData?.tripConfig?.copiedFrom || null;

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

  const handleJumpToDay = (index, attempt = 0) => {
    setActiveDayIndex(index);
    const y = dayOffsetsRef.current[index];
    if (typeof y !== 'number' || !scrollRef.current) {
      if (attempt < 8) {
        setTimeout(() => handleJumpToDay(index, attempt + 1), 45);
      }
      return;
    }
    const targetY = Math.max(0, dayListOffsetRef.current + y - stickyHeaderHeightRef.current - 8);
    scrollRef.current.scrollTo({ y: targetY, animated: true });
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

  const openDrivingRoute = async (day) => {
    const url = String(day?.route || '').trim() || buildDrivingRouteUrlFromPins(day?.pins);
    if (!url) {
      onToast?.('Add at least 2 locations to create a driving route.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      onToast?.('Could not open route right now.');
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

  return {
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
    openDrivingRoute,
    handleShareTrip,
  };
}
