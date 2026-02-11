import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

const TEMPLATE_LABELS = {
  city: 'City Break',
  beach: 'Beach Week',
  road: 'Road Trip',
  family: 'Family Trip',
};

function getStartDate(row) {
  const days = row?.trip_data?.days || [];
  const dates = days.map((d) => d.isoDate).filter(Boolean).sort();
  if (dates[0]) return dates[0];
  return inferDatesFromTrip(row)?.startIso || null;
}

function getEndDate(row) {
  const days = row?.trip_data?.days || [];
  const dates = days.map((d) => d.isoDate).filter(Boolean).sort();
  if (dates[dates.length - 1]) return dates[dates.length - 1];
  return inferDatesFromTrip(row)?.endIso || null;
}

function getTemplateLabel(row) {
  const templateId = row?.trip_data?.tripConfig?.templateId;
  return TEMPLATE_LABELS[templateId] || null;
}

function getCoverPhoto(row) {
  const cover = row?.trip_data?.tripConfig?.cover;
  if (cover) return cover;
  const days = Array.isArray(row?.trip_data?.days) ? row.trip_data.days : [];
  const fromDay = days.find((day) => Array.isArray(day?.photos) && day.photos.length > 0)?.photos?.[0];
  return fromDay || null;
}

function parseFlightDateCandidates(text, fallbackYear) {
  const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const src = String(text || '');
  const out = [];
  const withYear = [...src.matchAll(/(\d{1,2})\s*([A-Za-z]{3,9})\s*(20\d{2})/g)];
  for (const m of withYear) {
    const day = Number(m[1]);
    const month = monthMap[m[2].slice(0, 3).toLowerCase()];
    const year = Number(m[3]);
    if (month === undefined || !Number.isFinite(day) || !Number.isFinite(year)) continue;
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) out.push(d);
  }
  if (out.length) return out;
  const year = Number.isFinite(fallbackYear) ? fallbackYear : new Date().getFullYear();
  const withoutYear = [...src.matchAll(/(\d{1,2})\s*([A-Za-z]{3,9})/g)];
  for (const m of withoutYear) {
    const day = Number(m[1]);
    const month = monthMap[m[2].slice(0, 3).toLowerCase()];
    if (month === undefined || !Number.isFinite(day)) continue;
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) out.push(d);
  }
  return out;
}

function inferDatesFromTrip(row) {
  const trip = row?.trip_data || {};
  const days = Array.isArray(trip?.days) ? trip.days : [];
  const flights = Array.isArray(trip?.flights) ? trip.flights : [];
  const fallbackYear = Number(trip?.tripConfig?.calendar?.year);
  const candidates = flights.flatMap((f) => parseFlightDateCandidates(f?.date, Number.isFinite(fallbackYear) ? fallbackYear : undefined));
  candidates.sort((a, b) => a.getTime() - b.getTime());
  let cursor = candidates[0] ? new Date(candidates[0]) : null;
  const isoDates = [];

  for (let i = 0; i < days.length; i += 1) {
    const day = days[i] || {};
    if (day.isoDate) {
      isoDates.push(day.isoDate);
      const explicit = new Date(`${day.isoDate}T00:00:00`);
      if (!Number.isNaN(explicit.getTime())) {
        cursor = new Date(explicit);
        cursor.setDate(cursor.getDate() + 1);
      }
      continue;
    }

    const parsedLabel = String(day.date || '').match(/(\d{1,2})\s+([A-Za-z]{3,9})/);
    let resolved = null;
    if (parsedLabel) {
      const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
      const dayNum = Number(parsedLabel[1]);
      const month = monthMap[parsedLabel[2].slice(0, 3).toLowerCase()];
      const year = Number.isFinite(fallbackYear) ? fallbackYear : (cursor ? cursor.getFullYear() : new Date().getFullYear());
      if (month !== undefined && Number.isFinite(dayNum)) {
        let date = new Date(year, month, dayNum);
        if (cursor && date < cursor) date = new Date(year + 1, month, dayNum);
        resolved = date;
      }
    }
    if (!resolved && cursor) resolved = new Date(cursor);
    if (!resolved && candidates[0]) {
      resolved = new Date(candidates[0]);
      resolved.setDate(resolved.getDate() + i);
    }
    if (resolved && !Number.isNaN(resolved.getTime())) {
      const y = resolved.getFullYear();
      const m = String(resolved.getMonth() + 1).padStart(2, '0');
      const d = String(resolved.getDate()).padStart(2, '0');
      isoDates.push(`${y}-${m}-${d}`);
      cursor = new Date(resolved);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return { startIso: isoDates[0] || null, endIso: isoDates[isoDates.length - 1] || null };
}

function fallbackPhotoUri(query, index = 0) {
  const seed = encodeURIComponent(String(query || 'travel').trim() || 'travel');
  return `https://picsum.photos/seed/${seed}-${index}/1200/800`;
}

function RemoteImage({ uri, fallbackUri, style }) {
  const [currentUri, setCurrentUri] = React.useState(uri || fallbackUri || '');
  React.useEffect(() => {
    setCurrentUri(uri || fallbackUri || '');
  }, [uri, fallbackUri]);
  if (!currentUri) return <View style={[style, { backgroundColor: '#e5e7eb' }]} />;
  return (
    <Image
      source={{ uri: currentUri }}
      style={style}
      resizeMode="cover"
      onError={() => {
        if (currentUri !== fallbackUri && fallbackUri) setCurrentUri(fallbackUri);
      }}
    />
  );
}

function isPastTrip(row, todayIso) {
  const end = getEndDate(row);
  if (!end) return false;
  return end < todayIso;
}

function compareIsoAsc(a, b) {
  const aa = String(a || '9999-12-31');
  const bb = String(b || '9999-12-31');
  return aa.localeCompare(bb);
}

function compareIsoDesc(a, b) {
  const aa = String(a || '0000-01-01');
  const bb = String(b || '0000-01-01');
  return bb.localeCompare(aa);
}

function TripCard({ trip, onSelectTrip }) {
  const start = getStartDate(trip);
  const templateLabel = getTemplateLabel(trip);
  const cover = getCoverPhoto(trip);

  return (
    <Pressable
      key={trip.id}
      onPress={() => onSelectTrip(trip.id)}
      style={{
        borderWidth: 1.2,
        borderColor: '#e5e7eb',
        borderRadius: 16,
        padding: 14,
        backgroundColor: '#ffffff',
        gap: 5,
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      {cover ? (
        <View style={{ width: '100%', height: 130, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 4 }}>
          <RemoteImage uri={cover} fallbackUri={fallbackPhotoUri(trip?.title || trip?.slug)} style={{ width: '100%', height: '100%' }} />
        </View>
      ) : null}
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{trip.title || 'Untitled Trip'}</Text>
      <Text style={{ color: '#6b7280', fontSize: 12 }}>
        {trip.slug || 'no-slug'} • {trip.visibility}
      </Text>
      {templateLabel ? (
        <View style={{ alignSelf: 'flex-start', marginTop: 2, borderRadius: 999, borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: '700' }}>{templateLabel}</Text>
        </View>
      ) : null}
      {start ? <Text style={{ color: '#4b5563', fontSize: 12 }}>Starts {start}</Text> : null}
      <Text style={{ color: '#111827', fontSize: 12, fontWeight: '700', marginTop: 4 }}>Tap to open</Text>
    </Pressable>
  );
}

export default function HomeScreen({ user, trips, loading, onRefresh, onSelectTrip, onSignOut, onCreateNew }) {
  const [showPast, setShowPast] = React.useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcomingTrips = trips
    .filter((trip) => !isPastTrip(trip, todayIso))
    .sort((a, b) => compareIsoAsc(getStartDate(a), getStartDate(b)));
  const pastTrips = trips
    .filter((trip) => isPastTrip(trip, todayIso))
    .sort((a, b) => compareIsoDesc(getEndDate(a), getEndDate(b)));

  return (
    <View style={{ flex: 1, gap: 14 }}>
      <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 14, backgroundColor: '#ffffff', gap: 6, shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#f8fafc' }}>
            <Image source={require('../../assets/icon.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#1d4ed8', fontWeight: '800', fontSize: 18, letterSpacing: 0.3 }}>plnr.guide</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>Saved Trips</Text>
          </View>
        </View>
        <Text style={{ color: '#6b7280' }}>{user?.email}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <View style={{ borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '700' }}>{trips.length} total</Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: '#dcfce7', backgroundColor: '#f0fdf4', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#166534', fontSize: 12, fontWeight: '700' }}>Cloud synced</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title={loading ? 'Refreshing...' : 'Refresh'} onPress={onRefresh} disabled={loading} variant="outline" />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Sign Out" onPress={onSignOut} variant="outline" />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
        {!trips.length ? (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, padding: 14, backgroundColor: '#ffffff' }}>
            <Text style={{ color: '#6b7280' }}>No saved trips yet. Tap New Trip to create your first one.</Text>
          </View>
        ) : (
          <>
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111827', fontSize: 15, fontWeight: '800' }}>Upcoming ({upcomingTrips.length})</Text>
              {upcomingTrips.length ? (
                upcomingTrips.map((trip) => <TripCard key={trip.id} trip={trip} onSelectTrip={onSelectTrip} />)
              ) : (
                <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#fff' }}>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>No upcoming trips.</Text>
                </View>
              )}
            </View>

            <View style={{ gap: 8, marginTop: 6 }}>
              <Pressable onPress={() => setShowPast((prev) => !prev)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 8 }}>
                <Text style={{ color: '#6b7280', fontSize: 13, fontWeight: '800' }}>Past ({pastTrips.length})</Text>
                <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '700' }}>{showPast ? 'Hide' : 'Show'}</Text>
              </Pressable>
              {showPast ? (
                pastTrips.length ? (
                  pastTrips.map((trip) => <TripCard key={trip.id} trip={trip} onSelectTrip={onSelectTrip} />)
                ) : (
                  <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#fff' }}>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>No past trips yet.</Text>
                  </View>
                )
              ) : null}
            </View>
          </>
        )}
      </ScrollView>

      <Pressable
        onPress={onCreateNew}
        style={{
          position: 'absolute',
          right: 6,
          bottom: 6,
          backgroundColor: '#111827',
          borderRadius: 999,
          paddingHorizontal: 19,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: '#1f2937',
          shadowColor: '#111827',
          shadowOpacity: 0.28,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 5 },
          elevation: 6,
        }}
      >
        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>+ New Trip</Text>
      </Pressable>
    </View>
  );
}
