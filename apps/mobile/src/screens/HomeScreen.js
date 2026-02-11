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

function getPreviewPhotos(row) {
  const cover = row?.trip_data?.tripConfig?.cover;
  const dayPhotos = (row?.trip_data?.days || []).flatMap((d) => d.photos || []).filter(Boolean);
  const merged = [cover, ...dayPhotos].filter(Boolean);
  return [...new Set(merged)].slice(0, 4);
}

function getTemplateLabel(row) {
  const templateId = row?.trip_data?.tripConfig?.templateId;
  return TEMPLATE_LABELS[templateId] || null;
}

export default function HomeScreen({ user, trips, selectedTrip, loading, onRefresh, onSelectTrip, onSignOut, onCreateNew, onEditSelected }) {
  return (
    <View style={{ flex: 1, gap: 14 }}>
      <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 14, backgroundColor: '#ffffff', gap: 6, shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827' }}>Saved Trips</Text>
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
          trips.map((trip) => {
            const start = getStartDate(trip);
            const templateLabel = getTemplateLabel(trip);
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
          })
        )}
      </ScrollView>

      {selectedTrip && (
        <View style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 16, padding: 12, backgroundColor: '#eff6ff', gap: 4 }}>
          <Text style={{ fontWeight: '700', color: '#111827' }}>{selectedTrip?.trip_data?.tripConfig?.title || selectedTrip.title}</Text>
          <Text style={{ color: '#374151', fontSize: 12 }}>
            {(selectedTrip?.trip_data?.days || []).length} day(s) • {(selectedTrip?.trip_data?.flights || []).length} flight(s)
          </Text>
          {getPreviewPhotos(selectedTrip).length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              {getPreviewPhotos(selectedTrip).map((uri, index) => (
                <View key={`${uri}-${index}`} style={{ width: 68, height: 68, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#e4e4e7' }}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              ))}
            </View>
          ) : null}
          <View style={{ marginTop: 8 }}>
            <PrimaryButton title="Edit Trip" onPress={onEditSelected} />
          </View>
        </View>
      )}

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
