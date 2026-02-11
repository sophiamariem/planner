import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

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

export default function HomeScreen({ user, trips, selectedTrip, loading, onRefresh, onSelectTrip, onSignOut, onCreateNew, onEditSelected }) {
  return (
    <View style={{ flex: 1, gap: 14 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#18181b' }}>Saved Trips</Text>
        <Text style={{ color: '#52525b' }}>{user?.email}</Text>
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
          <View style={{ borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 12, padding: 14, backgroundColor: '#fafafa' }}>
            <Text style={{ color: '#52525b' }}>No saved trips yet. Tap New Trip to create one here.</Text>
          </View>
        ) : (
          trips.map((trip) => {
            const start = getStartDate(trip);
            return (
              <Pressable
                key={trip.id}
                onPress={() => onSelectTrip(trip.id)}
                style={{
                  borderWidth: 1,
                  borderColor: '#e4e4e7',
                  borderRadius: 14,
                  padding: 14,
                  backgroundColor: '#ffffff',
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#18181b' }}>{trip.title || 'Untitled Trip'}</Text>
                <Text style={{ color: '#71717a', fontSize: 12 }}>
                  {trip.slug || 'no-slug'} • {trip.visibility}
                </Text>
                {start ? <Text style={{ color: '#52525b', fontSize: 12 }}>Starts {start}</Text> : null}
                <Text style={{ color: '#27272a', fontSize: 12, fontWeight: '600', marginTop: 4 }}>Tap to open</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {selectedTrip && (
        <View style={{ borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 12, padding: 12, backgroundColor: '#fafafa', gap: 4 }}>
          <Text style={{ fontWeight: '700', color: '#18181b' }}>{selectedTrip?.trip_data?.tripConfig?.title || selectedTrip.title}</Text>
          <Text style={{ color: '#52525b', fontSize: 12 }}>
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
          right: 4,
          bottom: 4,
          backgroundColor: '#18181b',
          borderRadius: 999,
          paddingHorizontal: 18,
          paddingVertical: 13,
          borderWidth: 1,
          borderColor: '#3f3f46',
        }}
      >
        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>+ New Trip</Text>
      </Pressable>
    </View>
  );
}
