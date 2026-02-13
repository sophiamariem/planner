import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

const IMAGE_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

export const TEMPLATE_OPTIONS = [
  { id: 'city', emoji: '🏙️', title: 'City Break', description: 'Museums, cafes, neighborhoods', cover: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80' },
  { id: 'beach', emoji: '🏖️', title: 'Beach Week', description: 'Relaxed days by the coast', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80' },
  { id: 'road', emoji: '🚗', title: 'Road Trip', description: 'Multi-stop adventure', cover: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1400&q=80' },
  { id: 'family', emoji: '👨‍👩‍👧‍👦', title: 'Family Trip', description: 'Kid-friendly pace and plans', cover: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80' },
];

const TEMPLATE_DETAILS = {
  city: {
    footer: '48 hours in the city',
    badgeLegend: [{ emoji: '🏛️', label: 'Culture' }, { emoji: '🍽️', label: 'Food' }],
    days: [
      { title: 'Arrival + old town walk', notes: ['Hotel check-in', 'Sunset viewpoint'], badges: ['🏛️'] },
      { title: 'Museums + food market', notes: ['Museum in the morning', 'Market lunch'], badges: ['🍽️'] },
      { title: 'Departure', notes: ['Brunch', 'Airport transfer'], badges: [] },
    ],
  },
  beach: {
    footer: 'Sun, swim, repeat',
    badgeLegend: [{ emoji: '🏖️', label: 'Beach' }, { emoji: '🌅', label: 'Sunset' }],
    days: [
      { title: 'Arrival + beach sunset', notes: ['Check-in', 'Golden hour swim'], badges: ['🏖️'] },
      { title: 'Boat day', notes: ['Snorkel stop', 'Beach dinner'], badges: ['🌅'] },
      { title: 'Departure', notes: ['Slow morning', 'Checkout'], badges: [] },
    ],
  },
  road: {
    footer: 'Drive, stop, explore',
    badgeLegend: [{ emoji: '🚗', label: 'Drive' }, { emoji: '⛰️', label: 'Scenic' }],
    days: [
      { title: 'Pickup + first leg', notes: ['Collect car', 'Scenic stop'], badges: ['🚗'] },
      { title: 'Mountain loop', notes: ['Coffee stop', 'Hike'], badges: ['⛰️'] },
      { title: 'Final city + return', notes: ['City lunch', 'Return car'], badges: [] },
    ],
  },
  family: {
    footer: 'Fun at a comfortable pace',
    badgeLegend: [{ emoji: '🎡', label: 'Activities' }, { emoji: '🍽️', label: 'Family meal' }],
    days: [
      { title: 'Arrival + easy afternoon', notes: ['Hotel pool', 'Early dinner'], badges: [] },
      { title: 'Main activity day', notes: ['Theme park morning', 'Nap break'], badges: ['🎡'] },
      { title: 'Departure', notes: ['Pack slowly', 'Airport'], badges: [] },
    ],
  },
};

function createDraftKey(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shortDow(date) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
}

function shortMonth(date) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
}

export function formatChipLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${shortDow(date)} ${date.getDate()} ${shortMonth(date)}`;
}

export function parseIsoDate(value) {
  const str = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const date = new Date(`${str}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatIsoAsDisplayDate(value) {
  const date = parseIsoDate(value);
  if (!date) return '';
  return `${shortDow(date)}, ${date.getDate()} ${shortMonth(date)} ${date.getFullYear()}`;
}

function formatTimeValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function parseTimeValue(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  const base = new Date();
  base.setHours(hh, mm, 0, 0);
  return base;
}

function parseFlightTimes(times) {
  const raw = String(times || '').trim();
  if (!raw) return { departTime: '', arriveTime: '' };
  const splitByArrow = raw.split('→').map((v) => v.trim()).filter(Boolean);
  if (splitByArrow.length === 2) {
    return { departTime: splitByArrow[0], arriveTime: splitByArrow[1] };
  }
  return { departTime: raw, arriveTime: '' };
}

function splitNotes(value) {
  return String(value || '').split('\n').map((v) => normalizeArrowText(v.trim())).filter(Boolean);
}

function normalizeArrowText(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\s*->\s*/g, ' → ');
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

function defaultDayTitle(index, total) {
  if (!Number.isFinite(index)) return 'Day';
  if (index === 0) return 'Arrival';
  if (Number.isFinite(total) && index === total - 1) return 'Departure';
  return `Day ${index + 1}`;
}

export function normalizeDayTitle(title, index, total) {
  const safeIndex = Number.isFinite(index) ? index : 0;
  const safeTotal = Number.isFinite(total) ? total : 1;
  const raw = String(title || '').trim();
  if (!raw) return defaultDayTitle(safeIndex, safeTotal);
  if (/^day\s+nan\b/i.test(raw)) return defaultDayTitle(safeIndex, safeTotal);
  return raw;
}

function createDayDraft(index, total) {
  return {
    _key: createDraftKey('day'),
    title: defaultDayTitle(index, total),
    notesText: '',
    badgesText: '',
    photos: [],
    photoUrl: '',
    showPhotoUrlInput: false,
    photoQuery: '',
    photoResults: [],
    photoLoading: false,
    photoError: '',
    locationQuery: '',
    locationLoading: false,
    locationError: '',
    pins: [],
    hasMap: false,
  };
}

function hydrateDayDraft(day = {}, dayBadges = {}, index = 0, total = 3) {
  return {
    _key: createDraftKey('day'),
    title: normalizeArrowText(normalizeDayTitle(day.title, index, total)),
    notesText: normalizeArrowText(Array.isArray(day.notes) ? day.notes.join('\n') : ''),
    badgesText: Array.isArray(dayBadges?.[day.id]) ? dayBadges[day.id].join(' ') : '',
    photos: Array.isArray(day.photos) ? day.photos.filter(Boolean) : [],
    photoUrl: '',
    showPhotoUrlInput: false,
    photoQuery: normalizeArrowText(day.title || ''),
    photoResults: [],
    photoLoading: false,
    photoError: '',
    locationQuery: '',
    locationLoading: false,
    locationError: '',
    pins: Array.isArray(day.pins) ? day.pins.filter((p) => Array.isArray(p?.ll) && p.ll.length === 2) : [],
    hasMap: Boolean(day?.hasMap),
  };
}

function hydrateFlight(f = {}) {
  const parsedTimes = parseFlightTimes(f.times);
  return {
    _key: createDraftKey('flight'),
    from: normalizeArrowText(f.flightFrom || (f.route?.split(/→|->/)[0] || '').trim()),
    to: normalizeArrowText(f.flightTo || (f.route?.split(/→|->/)[1] || '').trim()),
    date: f.date || '',
    flightNo: normalizeArrowText(f.num || ''),
    departTime: normalizeArrowText(parsedTimes.departTime),
    arriveTime: normalizeArrowText(parsedTimes.arriveTime),
  };
}

function readInitialState(initialTripData) {
  const days = Array.isArray(initialTripData?.days) ? initialTripData.days : [];
  const firstDate = days.map((d) => d?.isoDate).find(Boolean) || toIso(new Date());
  const dayCount = Math.max(1, Math.min(14, days.length || 3));
  return {
    title: normalizeArrowText(initialTripData?.tripConfig?.title || 'My New Trip'),
    startDate: firstDate,
    daysCount: String(dayCount),
    templateId: initialTripData?.tripConfig?.templateId || '',
    footer: normalizeArrowText(initialTripData?.tripConfig?.footer || 'Planned with PLNR'),
    badgeLegend: Array.isArray(initialTripData?.tripConfig?.badgeLegend) ? initialTripData.tripConfig.badgeLegend : [{ emoji: '', label: '' }],
    coverPhoto: initialTripData?.tripConfig?.cover || '',
    dayDrafts: days.length
      ? days.map((d, i) => hydrateDayDraft(d, initialTripData?.dayBadges || {}, i, dayCount))
      : [createDayDraft(0, dayCount), createDayDraft(1, dayCount), createDayDraft(2, dayCount)],
    flights: Array.isArray(initialTripData?.flights) ? initialTripData.flights.map((f) => hydrateFlight(f)) : [],
  };
}

function fallbackPhotoResults(query, count = 8) {
  const seed = encodeURIComponent(String(query || 'travel').trim() || 'travel');
  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/1200/800`);
}

async function searchPhotos(query, count = 12) {
  const q = String(query || '').trim();
  if (!q) return [];
  if (!IMAGE_ACCESS_KEY) return fallbackPhotoResults(q, count);
  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=${count}&orientation=landscape&content_filter=high`, {
      headers: { Authorization: `Client-ID ${IMAGE_ACCESS_KEY}` },
    });
    if (!response.ok) return fallbackPhotoResults(q, count);
    const data = await response.json();
    const real = (data?.results || []).map((item) => item?.urls?.regular || item?.urls?.small || '').filter(Boolean);
    return real.length ? real : fallbackPhotoResults(q, count);
  } catch {
    return fallbackPhotoResults(q, count);
  }
}

async function searchLocation(query) {
  const q = String(query || '').trim();
  if (!q) return null;
  const providers = [
    async () => {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en',
          'User-Agent': 'plnr.guide-mobile',
        },
      });
      if (!res.ok) throw new Error('nominatim_failed');
      const rows = await res.json();
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row?.lat || !row?.lon) return null;
      return {
        name: String(row.display_name || '').split(',')[0]?.trim() || q,
        q,
        ll: [Number(row.lat), Number(row.lon)],
      };
    },
    async () => {
      const url = `https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('photon_failed');
      const data = await res.json();
      const feature = Array.isArray(data?.features) ? data.features[0] : null;
      const lon = Number(feature?.geometry?.coordinates?.[0]);
      const lat = Number(feature?.geometry?.coordinates?.[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const name = String(feature?.properties?.name || feature?.properties?.city || feature?.properties?.country || '').trim() || q;
      return { name, q, ll: [lat, lon] };
    },
    async () => {
      const url = `https://geocode.maps.co/search?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('mapsco_failed');
      const rows = await res.json();
      const row = Array.isArray(rows) ? rows[0] : null;
      const lat = Number(row?.lat);
      const lon = Number(row?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const name = String(row?.display_name || '').split(',')[0]?.trim() || q;
      return { name, q, ll: [lat, lon] };
    },
  ];

  for (const provider of providers) {
    try {
      const pin = await provider();
      if (pin && Number.isFinite(pin.ll[0]) && Number.isFinite(pin.ll[1])) return pin;
    } catch {
      // try next provider
    }
  }
  return null;
}

export default function useNewTripController({ mode, initialTripData }) {
  const initialState = useMemo(() => readInitialState(initialTripData), [initialTripData]);
  const [title, setTitle] = useState(initialState.title);
  const [startDate, setStartDate] = useState(initialState.startDate);
  const [daysCount, setDaysCount] = useState(initialState.daysCount);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialState.templateId);
  const [tripFooter, setTripFooter] = useState(initialState.footer);
  const [badgeLegend, setBadgeLegend] = useState(initialState.badgeLegend);
  const [coverPhoto, setCoverPhoto] = useState(initialState.coverPhoto);
  const [coverQuery, setCoverQuery] = useState(initialState.title || '');
  const [coverResults, setCoverResults] = useState([]);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [dayDrafts, setDayDrafts] = useState(initialState.dayDrafts);
  const [flights, setFlights] = useState(initialState.flights);
  const [step, setStep] = useState(0);
  const [planTab, setPlanTab] = useState('days');

  const isEditing = mode === 'edit';
  const isCreating = mode === 'create';
  const dayCount = Math.max(1, Math.min(14, Number(daysCount) || 1));
  const stepLabels = ['Basics', 'Plan', 'Review'];
  const canContinueBasics = Boolean(title.trim() && !Number.isNaN(new Date(startDate).getTime()));

  const openNativeDatePicker = (value, onPick) => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      mode: 'date',
      value: value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) onPick(selectedDate);
      },
    });
  };

  const openNativeTimePicker = (value, onPick) => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      mode: 'time',
      is24Hour: true,
      value: value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) onPick(selectedDate);
      },
    });
  };

  useEffect(() => {
    setTitle(initialState.title);
    setStartDate(initialState.startDate);
    setDaysCount(initialState.daysCount);
    setSelectedTemplateId(initialState.templateId);
    setTripFooter(initialState.footer);
    setBadgeLegend(initialState.badgeLegend);
    setCoverPhoto(initialState.coverPhoto);
    setCoverQuery(initialState.title || '');
    setCoverResults([]);
    setCoverLoading(false);
    setCoverError('');
    setDayDrafts(initialState.dayDrafts);
    setFlights(initialState.flights);
    setStep(0);
    setPlanTab('days');
  }, [initialState]);

  useEffect(() => {
    setDayDrafts((prev) => {
      const next = Array.from({ length: dayCount }, (_, i) => prev[i] || createDayDraft(i, dayCount));
      return next.map((day, i) => ({
        ...day,
        title: normalizeDayTitle(day.title, i, dayCount),
      }));
    });
  }, [dayCount]);

  const datePresets = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return [today, tomorrow, nextWeek];
  }, []);

  const previewDates = useMemo(() => {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return [];
    return Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [startDate, dayCount]);

  const reviewCoverPhoto = useMemo(() => {
    if (coverPhoto) return coverPhoto;
    const dayPhoto = dayDrafts.find((day) => Array.isArray(day?.photos) && day.photos.length > 0)?.photos?.[0];
    return dayPhoto || '';
  }, [coverPhoto, dayDrafts]);

  const updateDayDraft = (index, patch) => {
    const normalizedPatch = Object.fromEntries(
      Object.entries(patch || {}).map(([key, value]) => [key, typeof value === 'string' ? normalizeArrowText(value) : value]),
    );
    setDayDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...normalizedPatch } : d)));
  };

  const updateFlight = (index, patch) => {
    const normalizedPatch = Object.fromEntries(
      Object.entries(patch || {}).map(([key, value]) => [key, typeof value === 'string' ? normalizeArrowText(value) : value]),
    );
    setFlights((prev) => prev.map((f, i) => (i === index ? { ...f, ...normalizedPatch } : f)));
  };

  const updateTitle = (value) => setTitle(normalizeArrowText(value));
  const updateFooter = (value) => setTripFooter(normalizeArrowText(value));

  const openStartDatePicker = () => {
    const initial = parseIsoDate(startDate) || new Date();
    openNativeDatePicker(initial, (selectedDate) => {
      setStartDate(toIso(selectedDate));
    });
  };

  const openFlightDatePicker = (index) => {
    const initial = parseIsoDate(flights[index]?.date) || parseIsoDate(startDate) || new Date();
    openNativeDatePicker(initial, (selectedDate) => {
      updateFlight(index, { date: toIso(selectedDate) });
    });
  };

  const openFlightTimePicker = (index, key) => {
    const initial = parseTimeValue(flights[index]?.[key]) || new Date();
    openNativeTimePicker(initial, (selectedDate) => {
      updateFlight(index, { [key]: formatTimeValue(selectedDate) });
    });
  };

  const moveDay = (from, to) => {
    setDayDrafts((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const moveFlight = (from, to) => {
    setFlights((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const applyTemplate = (templateId) => {
    const template = TEMPLATE_OPTIONS.find((item) => item.id === templateId);
    const details = TEMPLATE_DETAILS[templateId];
    if (!template || !details) return;
    setSelectedTemplateId(templateId);
    setTitle(template.title);
    setDaysCount(String(details.days.length));
    setTripFooter(details.footer);
    setBadgeLegend(details.badgeLegend);
    setCoverPhoto(template.cover);
    setDayDrafts(details.days.map((d, i) => ({
      ...createDayDraft(i, details.days.length),
      title: normalizeDayTitle(d.title, i, details.days.length),
      notesText: (d.notes || []).join('\n'),
      badgesText: (d.badges || []).join(' '),
      photoQuery: d.title,
      photos: i === 0 ? [template.cover] : [],
    })));
  };

  const runPhotoSearchForDay = async (index) => {
    const day = dayDrafts[index];
    const query = String(day?.photoQuery || day?.title || title).trim();
    if (!query) {
      updateDayDraft(index, { photoError: 'Add a search first.' });
      return;
    }
    updateDayDraft(index, { photoLoading: true, photoError: '', photoResults: [] });
    try {
      const results = await searchPhotos(query, 10);
      updateDayDraft(index, {
        photoLoading: false,
        photoResults: results,
        photoError: results.length ? '' : 'No photos found.',
      });
    } catch {
      updateDayDraft(index, { photoLoading: false, photoError: 'Could not load photos right now.' });
    }
  };

  const runCoverSearch = async () => {
    const query = String(coverQuery || title || '').trim();
    if (!query) {
      setCoverError('Add a search first.');
      return;
    }
    setCoverLoading(true);
    setCoverError('');
    try {
      const results = await searchPhotos(query, 10);
      setCoverResults(results);
      if (!results.length) setCoverError('No photos found.');
    } catch {
      setCoverResults([]);
      setCoverError('Could not load photos right now.');
    } finally {
      setCoverLoading(false);
    }
  };

  const addPhotoToDay = (index, url) => {
    const day = dayDrafts[index];
    const next = Array.isArray(day?.photos) ? day.photos : [];
    if (next.includes(url) || next.length >= 6) return;
    updateDayDraft(index, { photos: [...next, url] });
  };

  const addPhotoUrlToDay = (index) => {
    const day = dayDrafts[index];
    const url = String(day?.photoUrl || '').trim();
    if (!url) {
      updateDayDraft(index, { photoError: 'Paste an image URL first.' });
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      updateDayDraft(index, { photoError: 'Use a full image URL starting with http:// or https://.' });
      return;
    }
    const photos = Array.isArray(day?.photos) ? day.photos : [];
    if (photos.includes(url)) {
      updateDayDraft(index, { photoError: '', photoUrl: '' });
      return;
    }
    if (photos.length >= 6) {
      updateDayDraft(index, { photoError: 'You can add up to 6 photos per day.' });
      return;
    }
    updateDayDraft(index, { photos: [...photos, url], photoUrl: '', photoError: '', showPhotoUrlInput: false });
  };

  const removePhotoFromDay = (index, photoIndex) => {
    const day = dayDrafts[index];
    const next = Array.isArray(day?.photos) ? day.photos.filter((_, i) => i !== photoIndex) : [];
    updateDayDraft(index, { photos: next });
  };

  const addLocationToDay = async (index) => {
    const day = dayDrafts[index];
    const query = String(day?.locationQuery || '').trim();
    if (!query) {
      updateDayDraft(index, { locationError: 'Enter a place first.' });
      return;
    }
    updateDayDraft(index, { locationLoading: true, locationError: '' });
    try {
      const pin = await searchLocation(query);
      if (!pin) {
        updateDayDraft(index, { locationLoading: false, locationError: 'Could not find that place.' });
        return;
      }
      const pins = Array.isArray(day?.pins) ? day.pins : [];
      if (pins.some((p) => p.name === pin.name && String(p.q || '').toLowerCase() === String(pin.q || '').toLowerCase())) {
        updateDayDraft(index, { locationLoading: false, locationQuery: '', locationError: '' });
        return;
      }
      updateDayDraft(index, { locationLoading: false, locationQuery: '', locationError: '', pins: [...pins, pin] });
    } catch {
      updateDayDraft(index, { locationLoading: false, locationError: 'Could not find that place right now.' });
    }
  };

  const removeLocationFromDay = (index, pinIndex) => {
    const day = dayDrafts[index];
    const pins = Array.isArray(day?.pins) ? day.pins.filter((_, i) => i !== pinIndex) : [];
    updateDayDraft(index, { pins });
  };

  const addFlight = () => {
    setFlights((prev) => [...prev, { _key: createDraftKey('flight'), from: '', to: '', date: '', flightNo: '', departTime: '', arriveTime: '' }]);
  };

  const buildTripData = () => {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return null;

    const base = initialTripData ? JSON.parse(JSON.stringify(initialTripData)) : {};
    const existingDays = Array.isArray(base?.days) ? base.days : [];
    const days = Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const prev = existingDays[i] || {};
      const draft = dayDrafts[i] || createDayDraft(i, dayCount);
      const hasMap = Boolean(draft?.hasMap);
      const nextPins = Array.isArray(draft.pins) ? draft.pins.filter((p) => Array.isArray(p?.ll) && p.ll.length === 2) : [];
      const preservedRoute = typeof prev?.route === 'string' && /^https?:\/\//i.test(prev.route) ? prev.route : '';
      const route = hasMap ? (preservedRoute || buildDrivingRouteUrlFromPins(nextPins)) : '';
      return {
        ...prev,
        id: prev.id || `${d.getDate()}-${i + 1}`,
        isoDate: toIso(d),
        dow: shortDow(d),
        date: `${d.getDate()} ${shortMonth(d)}`,
        title: normalizeDayTitle(draft.title, i, dayCount),
        notes: splitNotes(draft.notesText),
        photos: Array.isArray(draft.photos) ? draft.photos.filter(Boolean) : [],
        pins: nextPins,
        hasMap,
        route,
      };
    });

    const dayBadges = (base?.dayBadges && typeof base.dayBadges === 'object') ? base.dayBadges : {};

    const ll = { ...(base?.ll || {}) };
    days.forEach((day) => {
      (day.pins || []).forEach((pin) => {
        if (pin?.name && Array.isArray(pin.ll) && pin.ll.length === 2) ll[pin.name] = pin.ll;
      });
    });

    const finalFlights = flights
      .filter((f) => String(f.from || '').trim() || String(f.to || '').trim())
      .map((f) => {
        const from = normalizeArrowText(String(f.from || '').trim());
        const to = normalizeArrowText(String(f.to || '').trim());
        const departTime = String(f.departTime || '').trim();
        const arriveTime = String(f.arriveTime || '').trim();
        const times = departTime && arriveTime ? `${departTime} → ${arriveTime}` : (departTime || arriveTime || '');
        return {
          title: normalizeArrowText(from && to ? `${from} to ${to}` : 'Flight'),
          num: normalizeArrowText(String(f.flightNo || '').trim()),
          route: from && to ? `${from} → ${to}` : '',
          date: String(f.date || '').trim(),
          times,
          codes: '',
          flightFrom: from,
          flightTo: to,
        };
      });

    const coverFromDays = days.find((d) => (d.photos || []).length > 0)?.photos?.[0] || null;
    return {
      ...base,
      tripConfig: {
        ...(base?.tripConfig || {}),
        title: normalizeArrowText(title.trim() || 'My New Trip'),
        footer: normalizeArrowText(tripFooter.trim() || 'Planned with PLNR'),
        favicon: base?.tripConfig?.favicon || null,
        cover: coverPhoto || coverFromDays || null,
        templateId: selectedTemplateId || base?.tripConfig?.templateId || '',
        calendar: { year: start.getFullYear(), month: start.getMonth() },
        badgeLegend: badgeLegend.filter((entry) => String(entry.emoji || '').trim() || String(entry.label || '').trim()),
      },
      flights: finalFlights,
      days,
      dayBadges,
      ll,
    };
  };

  return {
    isEditing,
    isCreating,
    title,
    updateTitle,
    startDate,
    setStartDate,
    daysCount,
    setDaysCount,
    selectedTemplateId,
    tripFooter,
    updateFooter,
    coverPhoto,
    setCoverPhoto,
    coverQuery,
    setCoverQuery,
    coverResults,
    coverLoading,
    coverError,
    dayDrafts,
    flights,
    setFlights,
    step,
    setStep,
    planTab,
    setPlanTab,
    dayCount,
    stepLabels,
    canContinueBasics,
    datePresets,
    previewDates,
    reviewCoverPhoto,
    openStartDatePicker,
    openFlightDatePicker,
    openFlightTimePicker,
    moveDay,
    moveFlight,
    applyTemplate,
    runPhotoSearchForDay,
    runCoverSearch,
    addPhotoToDay,
    addPhotoUrlToDay,
    removePhotoFromDay,
    addLocationToDay,
    removeLocationFromDay,
    addFlight,
    buildTripData,
    updateDayDraft,
    updateFlight,
  };
}
