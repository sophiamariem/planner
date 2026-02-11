import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

function getStartDate(row) {
  const days = row?.trip_data?.days || [];
  const dates = days.map((d) => d.isoDate).filter(Boolean).sort();
  return dates[0] || null;
}

export default function HomeScreen({ user, trips, selectedTrip, loading, onRefresh, onSelectTrip, onSignOut }) {
  return (
    <View style={{ flex: 1, gap: 14 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#18181b' }}>My Trips</Text>
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
            <Text style={{ color: '#52525b' }}>No cloud trips yet. Save a trip from web first, then refresh.</Text>
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
        </View>
      )}
    </View>
  );
}
