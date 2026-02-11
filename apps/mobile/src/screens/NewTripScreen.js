import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

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
  return `${shortDow(date)} ${date.getDate()} ${shortMonth(date)}`;
}

function defaultDayTitle(index, total) {
  if (index === 0) return 'Arrival';
  if (index === total - 1) return 'Departure';
  return `Day ${index + 1}`;
}

function createDayDraft(index, total) {
  return { title: defaultDayTitle(index, total), notesText: '', badgesText: '' };
}

function splitNotes(value) {
  return String(value || '')
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
}

function splitBadges(value) {
  return [...new Set(String(value || '').split(/[\s,]+/).map((v) => v.trim()).filter(Boolean))];
}

function readInitialState(initialTripData) {
  const days = Array.isArray(initialTripData?.days) ? initialTripData.days : [];
  const firstDate = days.map((d) => d?.isoDate).find(Boolean) || toIso(new Date());
  const firstDayPhotos = Array.isArray(days[0]?.photos) ? days[0].photos.filter(Boolean) : [];
  return {
    title: initialTripData?.tripConfig?.title || 'My New Trip',
    startDate: firstDate,
    daysCount: String(Math.max(1, Math.min(14, days.length || 3))),
    coverPhoto: initialTripData?.tripConfig?.cover || '',
    dayPhotos: firstDayPhotos,
    badgeLegend: Array.isArray(initialTripData?.tripConfig?.badgeLegend) ? initialTripData.tripConfig.badgeLegend : [],
    footer: initialTripData?.tripConfig?.footer || 'Planned with PLNR',
    templateId: initialTripData?.tripConfig?.templateId || '',
    dayDrafts: days.length
      ? days.map((d) => ({
        title: d.title || '',
        notesText: Array.isArray(d.notes) ? d.notes.join('\n') : '',
        badgesText: Array.isArray(initialTripData?.dayBadges?.[d.id]) ? initialTripData.dayBadges[d.id].join(' ') : '',
      }))
      : [createDayDraft(0, 3), createDayDraft(1, 3), createDayDraft(2, 3)],
    flights: Array.isArray(initialTripData?.flights)
      ? initialTripData.flights.map((f) => ({
        from: f.flightFrom || (f.route?.split('→')[0] || '').trim(),
        to: f.flightTo || (f.route?.split('→')[1] || '').trim(),
        date: f.date || '',
        flightNo: f.num || '',
      }))
      : [],
  };
}

function PhotoTile({ uri, onRemove }) {
  return (
    <View style={{ width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#f4f4f5' }}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      <Pressable onPress={onRemove} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 999, backgroundColor: 'rgba(24,24,27,0.84)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>X</Text>
      </Pressable>
    </View>
  );
}

async function searchUnsplashPhotos(query, count = 12) {
  if (!UNSPLASH_ACCESS_KEY) throw new Error('missing');
  const q = String(query || '').trim();
  if (!q) return [];
  const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=${count}&orientation=landscape&content_filter=high`, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });
  if (!response.ok) throw new Error('fetch_failed');
  const data = await response.json();
  return (data?.results || []).map((item) => item?.urls?.regular || item?.urls?.small || '').filter(Boolean);
}

export default function NewTripScreen({ onCancel, onSubmit, submitting = false, mode = 'create', initialTripData = null }) {
  const initialState = useMemo(() => readInitialState(initialTripData), [initialTripData]);
  const [title, setTitle] = useState(initialState.title);
  const [startDate, setStartDate] = useState(initialState.startDate);
  const [daysCount, setDaysCount] = useState(initialState.daysCount);
  const [coverPhoto, setCoverPhoto] = useState(initialState.coverPhoto);
  const [dayPhotos, setDayPhotos] = useState(initialState.dayPhotos);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialState.templateId || '');
  const [tripFooter, setTripFooter] = useState(initialState.footer);
  const [badgeLegend, setBadgeLegend] = useState(initialState.badgeLegend.length ? initialState.badgeLegend : [{ emoji: '', label: '' }]);
  const [dayDrafts, setDayDrafts] = useState(initialState.dayDrafts);
  const [flights, setFlights] = useState(initialState.flights);
  const [unsplashQuery, setUnsplashQuery] = useState(initialState.title || '');
  const [unsplashResults, setUnsplashResults] = useState([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashError, setUnsplashError] = useState('');
  const [unsplashTarget, setUnsplashTarget] = useState('day');
  const [step, setStep] = useState(0);
  const [dragDayIndex, setDragDayIndex] = useState(null);
  const [dragFlightIndex, setDragFlightIndex] = useState(null);

  const isEditing = mode === 'edit';
  const isCreating = mode === 'create';
  const dayCount = Math.max(1, Math.min(14, Number(daysCount) || 1));
  const stepLabels = ['Basics', 'Photos', 'Plan', 'Review'];
  const canContinueBasics = Boolean(title.trim() && !Number.isNaN(new Date(startDate).getTime()) && dayCount >= 1 && dayCount <= 14);

  useEffect(() => {
    setTitle(initialState.title);
    setStartDate(initialState.startDate);
    setDaysCount(initialState.daysCount);
    setCoverPhoto(initialState.coverPhoto);
    setDayPhotos(initialState.dayPhotos);
    setSelectedTemplateId(initialState.templateId || '');
    setTripFooter(initialState.footer);
    setBadgeLegend(initialState.badgeLegend.length ? initialState.badgeLegend : [{ emoji: '', label: '' }]);
    setDayDrafts(initialState.dayDrafts);
    setFlights(initialState.flights);
    setUnsplashQuery(initialState.title || '');
    setUnsplashResults([]);
    setUnsplashError('');
    setUnsplashLoading(false);
    setUnsplashTarget('day');
    setStep(0);
    setDragDayIndex(null);
    setDragFlightIndex(null);
  }, [initialState]);

  useEffect(() => {
    setDayDrafts((prev) => {
      const next = Array.from({ length: dayCount }, (_, i) => prev[i] || createDayDraft(i, dayCount));
      return next;
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

  const dayCountPresets = ['3', '5', '7', '10'];

  const applyTemplate = (templateId) => {
    const template = TEMPLATE_OPTIONS.find((item) => item.id === templateId);
    const details = TEMPLATE_DETAILS[templateId];
    if (!template || !details) return;
    setSelectedTemplateId(templateId);
    setTitle(template.title);
    setUnsplashQuery(template.title);
    setDaysCount(String(details.days.length));
    setCoverPhoto(template.cover);
    setDayPhotos([template.cover]);
    setTripFooter(details.footer);
    setBadgeLegend(details.badgeLegend);
    setDayDrafts(details.days.map((d) => ({ title: d.title, notesText: (d.notes || []).join('\n'), badgesText: (d.badges || []).join(' ') })));
  };

  const runUnsplashSearch = async () => {
    const query = unsplashQuery.trim() || title.trim();
    if (!query) {
      setUnsplashError('Add a photo search first.');
      return;
    }
    if (!UNSPLASH_ACCESS_KEY) {
      setUnsplashError('Photo search is unavailable right now.');
      return;
    }
    setUnsplashLoading(true);
    setUnsplashError('');
    try {
      const results = await searchUnsplashPhotos(query, 12);
      if (!results.length) {
        setUnsplashResults([]);
        setUnsplashError('No photos found for this search.');
      } else {
        setUnsplashResults(results);
      }
    } catch {
      setUnsplashResults([]);
      setUnsplashError('Could not load photos right now.');
    } finally {
      setUnsplashLoading(false);
    }
  };

  const applyUnsplashPhoto = (url) => {
    if (unsplashTarget === 'cover') {
      setCoverPhoto(url);
      return;
    }
    setDayPhotos((prev) => (prev.includes(url) || prev.length >= 6 ? prev : [...prev, url]));
  };

  const updateDayDraft = (index, patch) => {
    setDayDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const updateLegend = (index, patch) => {
    setBadgeLegend((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const updateFlight = (index, patch) => {
    setFlights((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const moveItem = (list, fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex == null || toIndex == null) return list;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex > list.length) return list;
    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  };

  const moveDayTo = (toIndex) => {
    setDayDrafts((prev) => moveItem(prev, dragDayIndex, toIndex));
    setDragDayIndex(null);
  };

  const moveFlightTo = (toIndex) => {
    setFlights((prev) => moveItem(prev, dragFlightIndex, toIndex));
    setDragFlightIndex(null);
  };

  const buildTripData = () => {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return null;

    const base = initialTripData ? JSON.parse(JSON.stringify(initialTripData)) : {};
    const existingDays = Array.isArray(base?.days) ? base.days : [];
    const days = Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const defaults = {
        id: existingDays[i]?.id || `${d.getDate()}-${i + 1}`,
        isoDate: toIso(d),
        dow: shortDow(d),
        date: `${d.getDate()} ${shortMonth(d)}`,
      };
      const draft = dayDrafts[i] || createDayDraft(i, dayCount);
      return {
        ...(existingDays[i] || {}),
        ...defaults,
        title: draft.title?.trim() || defaultDayTitle(i, dayCount),
        notes: splitNotes(draft.notesText),
        photos: i === 0 ? dayPhotos : Array.isArray(existingDays[i]?.photos) ? existingDays[i].photos : [],
      };
    });

    const dayBadges = {};
    days.forEach((day, i) => {
      const draft = dayDrafts[i];
      const badges = splitBadges(draft?.badgesText);
      if (badges.length) dayBadges[day.id] = badges;
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

    return {
      ...base,
      tripConfig: {
        ...(base?.tripConfig || {}),
        title: title.trim() || 'My New Trip',
        footer: tripFooter.trim() || 'Planned with PLNR',
        favicon: base?.tripConfig?.favicon || null,
        cover: coverPhoto || dayPhotos[0] || null,
        templateId: selectedTemplateId || base?.tripConfig?.templateId || '',
        calendar: { year: start.getFullYear(), month: start.getMonth() },
        badgeLegend: badgeLegend.filter((entry) => String(entry.emoji || '').trim() || String(entry.label || '').trim()),
      },
      flights: finalFlights,
      days,
      dayBadges,
      ll: base?.ll || {},
    };
  };

  return (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>{isEditing ? 'Edit Trip' : 'New Trip'}</Text>
      <Text style={{ color: '#6b7280' }}>
        {isEditing ? 'Update details and itinerary on mobile.' : 'Create quickly here and keep everything cloud-synced.'}
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
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {dayCountPresets.map((preset) => {
                const active = preset === daysCount;
                return (
                  <Pressable key={preset} onPress={() => setDaysCount(preset)} style={{ borderWidth: 1, borderColor: active ? '#111827' : '#d4d4d8', backgroundColor: active ? '#111827' : '#ffffff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ color: active ? '#ffffff' : '#111827', fontWeight: '600', fontSize: 12 }}>{preset} days</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput value={daysCount} onChangeText={setDaysCount} placeholder="1-14" keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }} />
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 12, backgroundColor: '#ffffff' }}>
          <Text style={{ color: '#111827', fontWeight: '700' }}>Unsplash photos</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setUnsplashTarget('day')} style={{ borderWidth: 1, borderColor: unsplashTarget === 'day' ? '#111827' : '#d4d4d8', backgroundColor: unsplashTarget === 'day' ? '#111827' : '#ffffff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: unsplashTarget === 'day' ? '#ffffff' : '#111827', fontWeight: '600', fontSize: 12 }}>Add to Day 1</Text>
            </Pressable>
            <Pressable onPress={() => setUnsplashTarget('cover')} style={{ borderWidth: 1, borderColor: unsplashTarget === 'cover' ? '#111827' : '#d4d4d8', backgroundColor: unsplashTarget === 'cover' ? '#111827' : '#ffffff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: unsplashTarget === 'cover' ? '#ffffff' : '#111827', fontWeight: '600', fontSize: 12 }}>Set Cover</Text>
            </Pressable>
          </View>
          <TextInput value={unsplashQuery} onChangeText={setUnsplashQuery} placeholder="Search photos (e.g. lisbon rooftops)" autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff' }} />
          <PrimaryButton title={unsplashLoading ? 'Finding photos...' : 'Find Photos'} onPress={runUnsplashSearch} disabled={unsplashLoading} variant="outline" />
          {unsplashError ? <Text style={{ color: '#dc2626', fontSize: 12 }}>{unsplashError}</Text> : null}
          {unsplashResults.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {unsplashResults.map((uri, index) => (
                <Pressable key={`${uri}-${index}`} onPress={() => applyUnsplashPhoto(uri)} style={{ width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8' }}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={{ color: '#111827', fontWeight: '700' }}>Cover photo</Text>
          {coverPhoto ? (
            <View style={{ width: '100%', aspectRatio: 1.8, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#f4f4f5' }}>
              <Image source={{ uri: coverPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <Pressable onPress={() => setCoverPhoto('')} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 999, backgroundColor: 'rgba(24,24,27,0.84)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>X</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 12, padding: 10, backgroundColor: '#fafafa' }}>
              <Text style={{ color: '#71717a', fontSize: 12 }}>No cover photo yet.</Text>
            </View>
          )}

          <Text style={{ color: '#111827', fontWeight: '700' }}>Day 1 photo preview</Text>
          {dayPhotos.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {dayPhotos.map((uri, index) => (
                <PhotoTile key={`${uri}-${index}`} uri={uri} onRemove={() => setDayPhotos((prev) => prev.filter((_, i) => i !== index))} />
              ))}
            </View>
          ) : (
            <View style={{ borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 12, padding: 10, backgroundColor: '#fafafa' }}>
              <Text style={{ color: '#71717a', fontSize: 12 }}>No photos added yet.</Text>
            </View>
          )}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 12, backgroundColor: '#ffffff' }}>
          <Text style={{ color: '#111827', fontWeight: '700' }}>Days</Text>
          {dragDayIndex != null ? (
            <View style={{ borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, backgroundColor: '#eff6ff', padding: 10 }}>
              <Text style={{ color: '#1d4ed8', fontWeight: '700', fontSize: 12 }}>Moving Day {dragDayIndex + 1}. Tap a position below.</Text>
            </View>
          ) : null}
          {Array.from({ length: dayDrafts.length + 1 }, (_, slotIndex) => (
            <View key={`day-slot-${slotIndex}`} style={{ gap: 8 }}>
              {dragDayIndex != null ? (
                <Pressable
                  onPress={() => moveDayTo(slotIndex)}
                  style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: '#93c5fd', borderRadius: 10, backgroundColor: '#f8fbff', paddingVertical: 8, alignItems: 'center' }}
                >
                  <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '700' }}>Drop day here</Text>
                </Pressable>
              ) : null}
              {slotIndex < dayDrafts.length ? (
                <View key={`day-${slotIndex}`} style={{ borderWidth: 1, borderColor: dragDayIndex === slotIndex ? '#93c5fd' : '#e5e7eb', borderRadius: 12, padding: 10, gap: 8, backgroundColor: dragDayIndex === slotIndex ? '#f8fbff' : '#fff' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>
                      Day {slotIndex + 1} {previewDates[slotIndex] ? `(${formatChipLabel(previewDates[slotIndex])})` : ''}
                    </Text>
                    <Pressable onLongPress={() => setDragDayIndex(slotIndex)} delayLongPress={180} onPress={() => setDragDayIndex(slotIndex)} style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: '#374151', fontSize: 11, fontWeight: '700' }}>Move</Text>
                    </Pressable>
                  </View>
                  <TextInput value={dayDrafts[slotIndex].title} onChangeText={(value) => updateDayDraft(slotIndex, { title: value })} placeholder="Day title" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                  <TextInput value={dayDrafts[slotIndex].notesText} onChangeText={(value) => updateDayDraft(slotIndex, { notesText: value })} placeholder="Notes (one per line)" multiline style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', minHeight: 70, textAlignVertical: 'top' }} />
                  <TextInput value={dayDrafts[slotIndex].badgesText} onChangeText={(value) => updateDayDraft(slotIndex, { badgesText: value })} placeholder="Badges (e.g. ✈️ 🍽️)" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                </View>
              ) : null}
            </View>
          ))}
          {dragDayIndex != null ? (
            <Pressable onPress={() => setDragDayIndex(null)} style={{ alignSelf: 'flex-start' }}>
              <Text style={{ color: '#1d4ed8', fontWeight: '700', fontSize: 12 }}>Cancel move</Text>
            </Pressable>
          ) : null}

          <Text style={{ color: '#111827', fontWeight: '700' }}>Flights</Text>
          {dragFlightIndex != null ? (
            <View style={{ borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, backgroundColor: '#eff6ff', padding: 10 }}>
              <Text style={{ color: '#1d4ed8', fontWeight: '700', fontSize: 12 }}>Moving flight {dragFlightIndex + 1}. Tap a position below.</Text>
            </View>
          ) : null}
          {Array.from({ length: flights.length + 1 }, (_, slotIndex) => (
            <View key={`flight-slot-${slotIndex}`} style={{ gap: 8 }}>
              {dragFlightIndex != null ? (
                <Pressable
                  onPress={() => moveFlightTo(slotIndex)}
                  style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: '#93c5fd', borderRadius: 10, backgroundColor: '#f8fbff', paddingVertical: 8, alignItems: 'center' }}
                >
                  <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '700' }}>Drop flight here</Text>
                </Pressable>
              ) : null}
              {slotIndex < flights.length ? (
                <View key={`flight-${slotIndex}`} style={{ borderWidth: 1, borderColor: dragFlightIndex === slotIndex ? '#93c5fd' : '#e5e7eb', borderRadius: 12, padding: 10, gap: 8, backgroundColor: dragFlightIndex === slotIndex ? '#f8fbff' : '#fff' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>Flight {slotIndex + 1}</Text>
                    <Pressable onLongPress={() => setDragFlightIndex(slotIndex)} delayLongPress={180} onPress={() => setDragFlightIndex(slotIndex)} style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: '#374151', fontSize: 11, fontWeight: '700' }}>Move</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput value={flights[slotIndex].from} onChangeText={(value) => updateFlight(slotIndex, { from: value })} placeholder="From" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                    <TextInput value={flights[slotIndex].to} onChangeText={(value) => updateFlight(slotIndex, { to: value })} placeholder="To" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput value={flights[slotIndex].date} onChangeText={(value) => updateFlight(slotIndex, { date: value })} placeholder="Date" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                    <TextInput value={flights[slotIndex].flightNo} onChangeText={(value) => updateFlight(slotIndex, { flightNo: value })} placeholder="Flight No" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                  </View>
                  <Pressable onPress={() => setFlights((prev) => prev.filter((_, i) => i !== slotIndex))}>
                    <Text style={{ color: '#b91c1c', fontWeight: '700', fontSize: 12 }}>Remove flight</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
          {dragFlightIndex != null ? (
            <Pressable onPress={() => setDragFlightIndex(null)} style={{ alignSelf: 'flex-start' }}>
              <Text style={{ color: '#1d4ed8', fontWeight: '700', fontSize: 12 }}>Cancel move</Text>
            </Pressable>
          ) : null}
          <PrimaryButton title="Add Flight" onPress={() => setFlights((prev) => [...prev, { from: '', to: '', date: '', flightNo: '' }])} variant="outline" />

          <Text style={{ color: '#111827', fontWeight: '700' }}>Badge legend</Text>
          {badgeLegend.map((entry, index) => (
            <View key={`legend-${index}`} style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={entry.emoji || ''} onChangeText={(value) => updateLegend(index, { emoji: value })} placeholder="Emoji" style={{ width: 90, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
              <TextInput value={entry.label || ''} onChangeText={(value) => updateLegend(index, { label: value })} placeholder="Label" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
              <Pressable onPress={() => setBadgeLegend((prev) => prev.filter((_, i) => i !== index))} style={{ justifyContent: 'center' }}>
                <Text style={{ color: '#b91c1c', fontWeight: '700' }}>X</Text>
              </Pressable>
            </View>
          ))}
          <PrimaryButton title="Add Badge Type" onPress={() => setBadgeLegend((prev) => [...prev, { emoji: '', label: '' }])} variant="outline" />
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ gap: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 12, backgroundColor: '#ffffff' }}>
          <View style={{ borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 16, padding: 12, backgroundColor: '#fafafa', gap: 4 }}>
            <Text style={{ color: '#111827', fontWeight: '700' }}>Review</Text>
            <Text style={{ color: '#52525b', fontSize: 12 }}>{previewDates[0]?.toDateString()} -> {previewDates[previewDates.length - 1]?.toDateString()} ({previewDates.length} day{previewDates.length > 1 ? 's' : ''})</Text>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>Title: {title || 'Untitled'}</Text>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>Cover: {coverPhoto ? 'Added' : 'Not set'}</Text>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>Day 1 photos: {dayPhotos.length}</Text>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>Flights: {flights.length}</Text>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>Badge types: {badgeLegend.filter((b) => b.emoji || b.label).length}</Text>
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ color: '#111827', fontWeight: '700' }}>Footer</Text>
            <TextInput value={tripFooter} onChangeText={setTripFooter} placeholder="Planned with PLNR" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' }} />
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
            title={step < 3 ? 'Continue' : (submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Trip')}
            onPress={() => {
              if (step < 3) {
                if (step === 0 && !canContinueBasics) return;
                setStep((prev) => Math.min(3, prev + 1));
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
  );
}
