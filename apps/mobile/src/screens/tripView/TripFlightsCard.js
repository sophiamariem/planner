import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

function flightDisplayTitle(flight, index, total, normalizeArrowText) {
  if (String(flight?.title || '').trim()) return normalizeArrowText(String(flight.title).trim());
  if (total <= 1) return 'Flight Out';
  if (index === 0) return 'Flight Out';
  if (index === total - 1) return 'Flight Home';
  return 'Domestic Flight';
}

export default function TripFlightsCard({ flights, normalizeArrowText }) {
  if (!Array.isArray(flights) || !flights.length) return null;

  return (
    <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, backgroundColor: '#ffffff', padding: 14, gap: 10 }}>
      <Text style={{ color: '#111827', fontWeight: '800', fontSize: 18 }}>Flights</Text>
      {flights.map((flight, index) => (
        <View key={`flight-${index}`} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, backgroundColor: '#f8fafc', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="airplane-outline" size={16} color="#111827" />
              <Text style={{ color: '#111827', fontWeight: '800', fontSize: 16 }}>
                {flightDisplayTitle(flight, index, flights.length, normalizeArrowText)}
              </Text>
            </View>
            <Text style={{ color: '#6b7280', fontSize: 13, fontWeight: '700' }}>{normalizeArrowText(flight.num || '')}</Text>
          </View>
          <Text style={{ color: '#374151', fontSize: 15, fontWeight: '600' }}>
            {normalizeArrowText(flight.route || `${flight.flightFrom || ''} → ${flight.flightTo || ''}`)}
          </Text>
          {flight.date ? <Text style={{ color: '#6b7280', fontSize: 13 }}>{flight.date}</Text> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {flight.times ? (
              <View style={{ borderWidth: 1, borderColor: '#2563eb', borderRadius: 999, backgroundColor: '#2563eb', paddingHorizontal: 11, paddingVertical: 5 }}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{normalizeArrowText(flight.times)}</Text>
              </View>
            ) : null}
            {flight.codes ? (
              <View style={{ borderWidth: 1, borderColor: '#111827', borderRadius: 999, backgroundColor: '#111827', paddingHorizontal: 11, paddingVertical: 5 }}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{normalizeArrowText(flight.codes)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
