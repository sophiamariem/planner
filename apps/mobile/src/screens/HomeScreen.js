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
  return dates[0] || null;
}

function getEndDate(row) {
  const days = row?.trip_data?.days || [];
  const dates = days.map((d) => d.isoDate).filter(Boolean).sort();
  return dates[dates.length - 1] || null;
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
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
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
              <Text style={{ color: '#6b7280', fontSize: 13, fontWeight: '800' }}>Past ({pastTrips.length})</Text>
              {pastTrips.length ? (
                pastTrips.map((trip) => <TripCard key={trip.id} trip={trip} onSelectTrip={onSelectTrip} />)
              ) : (
                <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#fff' }}>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>No past trips yet.</Text>
                </View>
              )}
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
