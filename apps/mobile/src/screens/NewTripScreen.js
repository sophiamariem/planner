import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

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

function isHttpUrl(value) {
  return /^https?:\/\//i.test((value || '').trim());
}

function buildDefaultDay(date, index, total) {
  return {
    id: `${date.getDate()}-${index + 1}`,
    isoDate: toIso(date),
    dow: shortDow(date),
    date: `${date.getDate()} ${shortMonth(date)}`,
    title: index === 0 ? 'Arrival' : index === total - 1 ? 'Departure' : `Day ${index + 1}`,
    photos: [],
    hasMap: false,
    route: '',
    pins: [],
    notes: [],
  };
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
  };
}

function PhotoTile({ uri, onRemove }) {
  return (
    <View style={{ width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#f4f4f5' }}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      <Pressable
        onPress={onRemove}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 24,
          height: 24,
          borderRadius: 999,
          backgroundColor: 'rgba(24,24,27,0.84)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>X</Text>
      </Pressable>
    </View>
  );
}

export default function NewTripScreen({
  onCancel,
  onSubmit,
  submitting = false,
  mode = 'create',
  initialTripData = null,
}) {
  const initialState = useMemo(() => readInitialState(initialTripData), [initialTripData]);
  const [title, setTitle] = useState(initialState.title);
  const [startDate, setStartDate] = useState(initialState.startDate);
  const [daysCount, setDaysCount] = useState(initialState.daysCount);
  const [coverInput, setCoverInput] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(initialState.coverPhoto);
  const [dayPhotoInput, setDayPhotoInput] = useState('');
  const [dayPhotos, setDayPhotos] = useState(initialState.dayPhotos);

  useEffect(() => {
    setTitle(initialState.title);
    setStartDate(initialState.startDate);
    setDaysCount(initialState.daysCount);
    setCoverPhoto(initialState.coverPhoto);
    setDayPhotos(initialState.dayPhotos);
    setCoverInput('');
    setDayPhotoInput('');
  }, [initialState]);

  const datePresets = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return [today, tomorrow, nextWeek];
  }, []);

  const dayCountPresets = ['3', '5', '7', '10'];

  const previewDates = useMemo(() => {
    const count = Math.max(1, Math.min(14, Number(daysCount) || 1));
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return [];
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d);
    }
    return out;
  }, [startDate, daysCount]);

  const buildTripData = () => {
    const count = Math.max(1, Math.min(14, Number(daysCount) || 1));
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return null;

    const base = initialTripData ? JSON.parse(JSON.stringify(initialTripData)) : null;
    const existingDays = Array.isArray(base?.days) ? base.days : [];

    const days = Array.from({ length: count }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const defaults = buildDefaultDay(date, i, count);
      const existing = existingDays[i] || {};

      return {
        ...defaults,
        ...existing,
        id: existing.id || defaults.id,
        isoDate: defaults.isoDate,
        dow: defaults.dow,
        date: defaults.date,
        photos: i === 0 ? dayPhotos : Array.isArray(existing.photos) ? existing.photos : defaults.photos,
      };
    });

    const tripConfig = {
      ...(base?.tripConfig || {}),
      title: title.trim() || 'My New Trip',
      footer: base?.tripConfig?.footer || 'Planned with PLNR',
      favicon: base?.tripConfig?.favicon || null,
      cover: coverPhoto || dayPhotos[0] || null,
      calendar: {
        year: start.getFullYear(),
        month: start.getMonth(),
      },
      badgeLegend: Array.isArray(base?.tripConfig?.badgeLegend) ? base.tripConfig.badgeLegend : [],
    };

    return {
      ...(base || {}),
      tripConfig,
      flights: Array.isArray(base?.flights) ? base.flights : [],
      days,
      dayBadges: base?.dayBadges || {},
      ll: base?.ll || {},
    };
  };

  const addCoverPhoto = () => {
    const value = coverInput.trim();
    if (!isHttpUrl(value)) return;
    setCoverPhoto(value);
    setCoverInput('');
  };

  const addDayPhoto = () => {
    const value = dayPhotoInput.trim();
    if (!isHttpUrl(value)) return;
    setDayPhotos((prev) => (prev.includes(value) || prev.length >= 6 ? prev : [...prev, value]));
    setDayPhotoInput('');
  };

  const isEditing = mode === 'edit';

  return (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#18181b' }}>{isEditing ? 'Edit Trip' : 'New Trip'}</Text>
      <Text style={{ color: '#52525b' }}>
        {isEditing ? 'Update the core details and keep the trip visual.' : 'Create quickly here, then expand details later on web or mobile.'}
      </Text>

      <View style={{ gap: 8 }}>
        <Text style={{ color: '#27272a', fontWeight: '600' }}>Trip title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Summer in Lisbon"
          style={{ borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: '#27272a', fontWeight: '600' }}>Start date</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {datePresets.map((preset) => {
            const iso = toIso(preset);
            const active = iso === startDate;
            return (
              <Pressable
                key={iso}
                onPress={() => setStartDate(iso)}
                style={{
                  borderWidth: 1,
                  borderColor: active ? '#18181b' : '#d4d4d8',
                  backgroundColor: active ? '#18181b' : '#ffffff',
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: active ? '#ffffff' : '#18181b', fontWeight: '600', fontSize: 12 }}>
                  {formatChipLabel(preset)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: '#27272a', fontWeight: '600' }}>Duration</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {dayCountPresets.map((preset) => {
            const active = preset === daysCount;
            return (
              <Pressable
                key={preset}
                onPress={() => setDaysCount(preset)}
                style={{
                  borderWidth: 1,
                  borderColor: active ? '#18181b' : '#d4d4d8',
                  backgroundColor: active ? '#18181b' : '#ffffff',
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: active ? '#ffffff' : '#18181b', fontWeight: '600', fontSize: 12 }}>
                  {preset} days
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={daysCount}
          onChangeText={setDaysCount}
          placeholder="1-14"
          keyboardType="numeric"
          style={{ borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: '#27272a', fontWeight: '600' }}>Cover photo</Text>
        {!coverPhoto ? (
          <>
            <TextInput
              value={coverInput}
              onChangeText={setCoverInput}
              placeholder="Paste image URL"
              autoCapitalize="none"
              style={{ borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff' }}
            />
            <PrimaryButton title="Add Cover Photo" onPress={addCoverPhoto} variant="outline" />
          </>
        ) : (
          <View style={{ width: '100%', aspectRatio: 1.8, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#f4f4f5' }}>
            <Image source={{ uri: coverPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <Pressable
              onPress={() => setCoverPhoto('')}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: 999,
                backgroundColor: 'rgba(24,24,27,0.84)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>X</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: '#27272a', fontWeight: '600' }}>Day 1 photo preview</Text>
        <TextInput
          value={dayPhotoInput}
          onChangeText={setDayPhotoInput}
          placeholder="Paste image URL"
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff' }}
        />
        <PrimaryButton title="Add Photo" onPress={addDayPhoto} variant="outline" />
        {dayPhotos.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {dayPhotos.map((uri, index) => (
              <PhotoTile
                key={`${uri}-${index}`}
                uri={uri}
                onRemove={() => setDayPhotos((prev) => prev.filter((_, i) => i !== index))}
              />
            ))}
          </View>
        ) : (
          <View style={{ borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 12, padding: 10, backgroundColor: '#fafafa' }}>
            <Text style={{ color: '#71717a', fontSize: 12 }}>No photos added yet.</Text>
          </View>
        )}
      </View>

      {previewDates.length > 0 && (
        <View style={{ borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 16, padding: 12, backgroundColor: '#fafafa', gap: 4 }}>
          <Text style={{ color: '#27272a', fontWeight: '700' }}>Trip preview</Text>
          <Text style={{ color: '#52525b', fontSize: 12 }}>
            {previewDates[0].toDateString()} -> {previewDates[previewDates.length - 1].toDateString()} ({previewDates.length} day{previewDates.length > 1 ? 's' : ''})
          </Text>
        </View>
      )}

      <PrimaryButton
        title={submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Trip'}
        onPress={() => {
          const tripData = buildTripData();
          if (tripData) onSubmit(tripData);
        }}
        disabled={submitting}
      />
      <PrimaryButton title="Close" onPress={onCancel} variant="outline" />
    </View>
  );
}
