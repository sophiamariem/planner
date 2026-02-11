import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

const IMAGE_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

const TEMPLATE_OPTIONS = [
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

function formatChipLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${shortDow(date)} ${date.getDate()} ${shortMonth(date)}`;
}

function splitNotes(value) {
  return String(value || '').split('\n').map((v) => v.trim()).filter(Boolean);
}

function splitBadges(value) {
  return [...new Set(String(value || '').split(/[\s,]+/).map((v) => v.trim()).filter(Boolean))];
}

function defaultDayTitle(index, total) {
  if (!Number.isFinite(index)) return 'Day';
  if (index === 0) return 'Arrival';
  if (Number.isFinite(total) && index === total - 1) return 'Departure';
  return `Day ${index + 1}`;
}

function normalizeDayTitle(title, index, total) {
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
    photoQuery: '',
    photoResults: [],
    photoLoading: false,
    photoError: '',
    locationQuery: '',
    locationLoading: false,
    locationError: '',
    pins: [],
  };
}

function hydrateDayDraft(day = {}, dayBadges = {}, index = 0, total = 3) {
  return {
    _key: createDraftKey('day'),
    title: normalizeDayTitle(day.title, index, total),
    notesText: Array.isArray(day.notes) ? day.notes.join('\n') : '',
    badgesText: Array.isArray(dayBadges?.[day.id]) ? dayBadges[day.id].join(' ') : '',
    photos: Array.isArray(day.photos) ? day.photos.filter(Boolean) : [],
    photoQuery: day.title || '',
    photoResults: [],
    photoLoading: false,
    photoError: '',
    locationQuery: '',
    locationLoading: false,
    locationError: '',
    pins: Array.isArray(day.pins) ? day.pins.filter((p) => Array.isArray(p?.ll) && p.ll.length === 2) : [],
  };
}

function hydrateFlight(f = {}) {
  return {
    _key: createDraftKey('flight'),
    from: f.flightFrom || (f.route?.split('→')[0] || '').trim(),
    to: f.flightTo || (f.route?.split('→')[1] || '').trim(),
    date: f.date || '',
    flightNo: f.num || '',
  };
}

function readInitialState(initialTripData) {
  const days = Array.isArray(initialTripData?.days) ? initialTripData.days : [];
  const firstDate = days.map((d) => d?.isoDate).find(Boolean) || toIso(new Date());
  const dayCount = Math.max(1, Math.min(14, days.length || 3));
  return {
    title: initialTripData?.tripConfig?.title || 'My New Trip',
    startDate: firstDate,
    daysCount: String(dayCount),
    templateId: initialTripData?.tripConfig?.templateId || '',
    footer: initialTripData?.tripConfig?.footer || 'Planned with plnr.guide',
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
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) throw new Error('location_failed');
  const rows = await res.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row?.lat || !row?.lon) return null;
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const display = String(row.display_name || '').split(',')[0]?.trim() || q;
  return { name: display, q: q, ll: [lat, lon] };
}

function PhotoTile({ uri, onRemove }) {
  return (
    <View style={{ width: 92, height: 92, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#f4f4f5' }}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      <Pressable onPress={onRemove} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 999, backgroundColor: 'rgba(24,24,27,0.84)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>X</Text>
      </Pressable>
    </View>
  );
}

export default function NewTripScreen({ onCancel, onSubmit, submitting = false, mode = 'create', initialTripData = null }) {
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

  const isEditing = mode === 'edit';
  const isCreating = mode === 'create';
  const dayCount = Math.max(1, Math.min(14, Number(daysCount) || 1));
  const stepLabels = ['Basics', 'Plan', 'Review'];
  const canContinueBasics = Boolean(title.trim() && !Number.isNaN(new Date(startDate).getTime()));

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

  const updateDayDraft = (index, patch) => {
    setDayDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const updateLegend = (index, patch) => {
    setBadgeLegend((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const updateFlight = (index, patch) => {
    setFlights((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
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
      return {
        ...prev,
        id: prev.id || `${d.getDate()}-${i + 1}`,
        isoDate: toIso(d),
        dow: shortDow(d),
        date: `${d.getDate()} ${shortMonth(d)}`,
        title: normalizeDayTitle(draft.title, i, dayCount),
        notes: splitNotes(draft.notesText),
        photos: Array.isArray(draft.photos) ? draft.photos.filter(Boolean) : [],
        pins: Array.isArray(draft.pins) ? draft.pins.filter((p) => Array.isArray(p?.ll) && p.ll.length === 2) : [],
      };
    });

    const dayBadges = {};
    days.forEach((day, i) => {
      const badges = splitBadges(dayDrafts[i]?.badgesText);
      if (badges.length) dayBadges[day.id] = badges;
    });

    const ll = { ...(base?.ll || {}) };
    days.forEach((day) => {
      (day.pins || []).forEach((pin) => {
        if (pin?.name && Array.isArray(pin.ll) && pin.ll.length === 2) ll[pin.name] = pin.ll;
      });
    });

    const finalFlights = flights
      .filter((f) => String(f.from || '').trim() || String(f.to || '').trim())
      .map((f) => {
        const from = String(f.from || '').trim();
        const to = String(f.to || '').trim();
        return {
          title: from && to ? `${from} to ${to}` : 'Flight',
          num: String(f.flightNo || '').trim(),
          route: from && to ? `${from} → ${to}` : '',
          date: String(f.date || '').trim(),
          times: '',
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
        title: title.trim() || 'My New Trip',
        footer: tripFooter.trim() || 'Planned with plnr.guide',
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

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={{ gap: 12, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>{isEditing ? 'Edit Trip' : 'New Trip'}</Text>
        <Text style={{ color: '#6b7280' }}>
          {isEditing ? 'Update details and itinerary.' : 'Create quickly here and keep everything cloud-synced.'}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {stepLabels.map((label, index) => (
            <Pressable key={label} onPress={() => setStep(index)} style={{ flex: 1, borderWidth: 1, borderColor: step === index ? '#111827' : '#d1d5db', backgroundColor: step === index ? '#111827' : '#ffffff', borderRadius: 999, paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ color: step === index ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>{index + 1}. {label}</Text>
            </Pressable>
          ))}
        </View>

        {step === 0 ? (
          <View style={{ gap: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 12, backgroundColor: '#ffffff' }}>
            {isCreating ? (
              <View style={{ gap: 8 }}>
                <Text style={{ color: '#111827', fontWeight: '700' }}>Start from template</Text>
                <View style={{ gap: 8 }}>
                  {TEMPLATE_OPTIONS.map((template) => {
                    const active = selectedTemplateId === template.id;
                    return (
                      <Pressable key={template.id} onPress={() => applyTemplate(template.id)} style={{ borderWidth: 1, borderColor: active ? '#111827' : '#d4d4d8', borderRadius: 14, padding: 10, backgroundColor: active ? '#f3f4f6' : '#ffffff', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8' }}>
                          <Image source={{ uri: template.cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#111827', fontWeight: '700' }}>{template.emoji} {template.title}</Text>
                          <Text style={{ color: '#6b7280', fontSize: 12 }}>{template.description}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111827', fontWeight: '700' }}>Trip title</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Summer in Lisbon" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }} />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111827', fontWeight: '700' }}>Start date</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {datePresets.map((preset) => {
                  const iso = toIso(preset);
                  const active = iso === startDate;
                  return (
                    <Pressable key={iso} onPress={() => setStartDate(iso)} style={{ borderWidth: 1, borderColor: active ? '#111827' : '#d4d4d8', backgroundColor: active ? '#111827' : '#ffffff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
                      <Text style={{ color: active ? '#ffffff' : '#111827', fontWeight: '600', fontSize: 12 }}>{formatChipLabel(preset)}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }} />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111827', fontWeight: '700' }}>Duration</Text>
              <TextInput value={daysCount} onChangeText={setDaysCount} placeholder="1-14" keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }} />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111827', fontWeight: '700' }}>Cover photo</Text>
              <TextInput value={coverQuery} onChangeText={setCoverQuery} placeholder="Search cover photo" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff' }} />
              <PrimaryButton title={coverLoading ? 'Finding...' : 'Find Photos'} onPress={runCoverSearch} disabled={coverLoading} variant="outline" />
              {coverError ? <Text style={{ color: '#dc2626', fontSize: 12 }}>{coverError}</Text> : null}
              {coverPhoto ? (
                <View style={{ width: '100%', height: 150, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8' }}>
                  <Image source={{ uri: coverPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              ) : null}
              {coverResults.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {coverResults.map((uri, idx) => (
                    <Pressable key={`${uri}-${idx}`} onPress={() => setCoverPhoto(uri)} style={{ width: 90, height: 90, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: coverPhoto === uri ? '#111827' : '#d4d4d8' }}>
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={{ gap: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 12, backgroundColor: '#ffffff' }}>
            <Text style={{ color: '#111827', fontWeight: '700' }}>Day order</Text>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>Use arrows to reorder.</Text>
            {dayDrafts.map((item, index) => (
              <View key={`order-${item._key || index}`} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12, flex: 1 }}>
                  Day {index + 1} {previewDates[index] ? `(${formatChipLabel(previewDates[index])})` : ''} • {normalizeDayTitle(item.title, index, dayDrafts.length)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable onPress={() => moveDay(index, index - 1)} disabled={index === 0} style={{ opacity: index === 0 ? 0.35 : 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ color: '#374151', fontWeight: '700', fontSize: 14 }}>↑</Text>
                  </Pressable>
                  <Pressable onPress={() => moveDay(index, index + 1)} disabled={index === dayDrafts.length - 1} style={{ opacity: index === dayDrafts.length - 1 ? 0.35 : 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ color: '#374151', fontWeight: '700', fontSize: 14 }}>↓</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Text style={{ color: '#111827', fontWeight: '700' }}>Days</Text>
            {dayDrafts.map((item, index) => (
              <View key={item._key || `day-edit-${index}`} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 10, gap: 8, backgroundColor: '#fff' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>
                    Day {index + 1} {previewDates[index] ? `(${formatChipLabel(previewDates[index])})` : ''}
                  </Text>
                </View>

                <TextInput value={item.title} onChangeText={(value) => updateDayDraft(index, { title: value })} placeholder="Day title" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                <TextInput value={item.notesText} onChangeText={(value) => updateDayDraft(index, { notesText: value })} placeholder="Notes (one per line)" multiline style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', minHeight: 70, textAlignVertical: 'top' }} />

                <View style={{ gap: 6 }}>
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>Photos</Text>
                  <TextInput value={item.photoQuery} onChangeText={(value) => updateDayDraft(index, { photoQuery: value })} placeholder="Search photos for this day" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                  <PrimaryButton title={item.photoLoading ? 'Finding...' : 'Find Photos'} onPress={() => runPhotoSearchForDay(index)} disabled={item.photoLoading} variant="outline" />
                  {item.photoError ? <Text style={{ color: '#dc2626', fontSize: 12 }}>{item.photoError}</Text> : null}
                  {Array.isArray(item.photoResults) && item.photoResults.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {item.photoResults.map((uri, photoIndex) => (
                        <Pressable key={`${uri}-${photoIndex}`} onPress={() => addPhotoToDay(index, uri)} style={{ width: 86, height: 86, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8' }}>
                          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                  {Array.isArray(item.photos) && item.photos.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {item.photos.map((uri, photoIndex) => (
                        <PhotoTile key={`${uri}-${photoIndex}`} uri={uri} onRemove={() => removePhotoFromDay(index, photoIndex)} />
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={{ color: '#71717a', fontSize: 12 }}>No photos added yet.</Text>
                  )}
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>Locations</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TextInput value={item.locationQuery} onChangeText={(value) => updateDayDraft(index, { locationQuery: value })} placeholder="Search place or address" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                    <Pressable onPress={() => addLocationToDay(index)} style={{ marginLeft: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: '#fff' }}>
                      <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>{item.locationLoading ? '...' : 'Add'}</Text>
                    </Pressable>
                  </View>
                  {item.locationError ? <Text style={{ color: '#dc2626', fontSize: 12 }}>{item.locationError}</Text> : null}
                  {(item.pins || []).length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {(item.pins || []).map((pin, pinIndex) => (
                        <View key={`${pin.name}-${pinIndex}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#fafafa' }}>
                          <Text style={{ color: '#374151', fontSize: 12 }}>{pin.name}</Text>
                          <Pressable onPress={() => removeLocationFromDay(index, pinIndex)}>
                            <Text style={{ color: '#b91c1c', fontWeight: '700', fontSize: 12 }}>X</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: '#71717a', fontSize: 12 }}>No locations added yet.</Text>
                  )}
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>Badges</Text>
                  <TextInput value={item.badgesText} onChangeText={(value) => updateDayDraft(index, { badgesText: value })} placeholder="e.g. ✈️ 🍽️ 🏛️" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                </View>
              </View>
            ))}

            <Text style={{ color: '#111827', fontWeight: '700' }}>Flights</Text>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>Use arrows to reorder flights.</Text>
            {flights.length === 0 ? <Text style={{ color: '#71717a', fontSize: 12 }}>No flights yet.</Text> : null}
            {flights.map((item, index) => (
              <View key={item._key || `flight-${index}`} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, gap: 8, backgroundColor: '#fff' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>Flight {index + 1}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable onPress={() => moveFlight(index, index - 1)} disabled={index === 0} style={{ opacity: index === 0 ? 0.35 : 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ color: '#374151', fontWeight: '700', fontSize: 14 }}>↑</Text>
                    </Pressable>
                    <Pressable onPress={() => moveFlight(index, index + 1)} disabled={index === flights.length - 1} style={{ opacity: index === flights.length - 1 ? 0.35 : 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ color: '#374151', fontWeight: '700', fontSize: 14 }}>↓</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput value={item.from} onChangeText={(value) => updateFlight(index, { from: value })} placeholder="From" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                  <TextInput value={item.to} onChangeText={(value) => updateFlight(index, { to: value })} placeholder="To" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput value={item.date} onChangeText={(value) => updateFlight(index, { date: value })} placeholder="Date" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                  <TextInput value={item.flightNo} onChangeText={(value) => updateFlight(index, { flightNo: value })} placeholder="Flight No" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                </View>
                <Pressable onPress={() => setFlights((prev) => prev.filter((_, i) => i !== index))}>
                  <Text style={{ color: '#b91c1c', fontWeight: '700', fontSize: 12 }}>Remove flight</Text>
                </Pressable>
              </View>
            ))}
            <PrimaryButton title="Add Flight" onPress={() => setFlights((prev) => [...prev, { _key: createDraftKey('flight'), from: '', to: '', date: '', flightNo: '' }])} variant="outline" />

            
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 12, backgroundColor: '#ffffff' }}>
            <View style={{ borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 16, padding: 12, backgroundColor: '#fafafa', gap: 4 }}>
              <Text style={{ color: '#111827', fontWeight: '700' }}>Review</Text>
              <Text style={{ color: '#52525b', fontSize: 12 }}>{previewDates[0]?.toDateString()} -> {previewDates[previewDates.length - 1]?.toDateString()} ({previewDates.length} day{previewDates.length > 1 ? 's' : ''})</Text>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>Title: {title || 'Untitled'}</Text>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>Flights: {flights.length}</Text>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>Day photos: {dayDrafts.reduce((acc, d) => acc + (d.photos?.length || 0), 0)}</Text>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>Day locations: {dayDrafts.reduce((acc, d) => acc + (d.pins?.length || 0), 0)}</Text>
            </View>
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111827', fontWeight: '700' }}>Footer</Text>
              <TextInput value={tripFooter} onChangeText={setTripFooter} placeholder="Planned with plnr.guide" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' }} />
            </View>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton title="Close" onPress={onCancel} variant="outline" />
          </View>
          {step > 0 ? (
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Back" onPress={() => setStep((prev) => Math.max(0, prev - 1))} variant="outline" />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={step < 2 ? 'Continue' : (submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Trip')}
              onPress={() => {
                if (step < 2) {
                  if (step === 0 && !canContinueBasics) return;
                  setStep((prev) => Math.min(2, prev + 1));
                  return;
                }
                const tripData = buildTripData();
                if (tripData) onSubmit(tripData);
              }}
              disabled={submitting || (step === 0 && !canContinueBasics)}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
