import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { getMapPreviewUrls, DayPhotoLayout, RemoteImage } from './media';
import { normalizeDayTitle } from './dateUtils';

export default function TripDayCard({
  day,
  index,
  totalDays,
  isActive,
  onLayout,
  onOpenPin,
  normalizeArrowText,
}) {
  return (
    <View
      onLayout={onLayout}
      style={{
        borderWidth: 1,
        borderColor: isActive ? '#bfdbfe' : '#e5e7eb',
        borderRadius: 18,
        backgroundColor: isActive ? '#f8fbff' : '#ffffff',
        padding: 16,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ borderRadius: 999, backgroundColor: '#2563eb', paddingHorizontal: 11, paddingVertical: 5 }}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{day?.dow || 'Day'}</Text>
              </View>
              <View style={{ borderRadius: 999, backgroundColor: '#c026d3', paddingHorizontal: 11, paddingVertical: 5 }}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{day?.date || day?.isoDate || ''}</Text>
              </View>
            </View>
          </View>
          <Text style={{ color: '#111827', fontWeight: '800', fontSize: 28, lineHeight: 34 }}>
            {normalizeArrowText(normalizeDayTitle(day?.title, index, totalDays))}
          </Text>
        </View>
      </View>

      {(day?.notes || []).length > 0 ? (
        <LinearGradient
          colors={['#fef3c7', '#fce7f3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
        >
          <Text style={{ color: '#7c2d12', fontWeight: '700', fontSize: 13 }}>Plan</Text>
          {(day?.notes || []).map((note, i) => (
            <View key={`note-${i}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <Text style={{ color: '#374151', fontSize: 14, flex: 1, lineHeight: 20 }}>{normalizeArrowText(note)}</Text>
            </View>
          ))}
        </LinearGradient>
      ) : (
        <Text style={{ color: '#9ca3af', fontSize: 13 }}>No notes for this day.</Text>
      )}

      <DayPhotoLayout photos={day?.photos || []} query={day?.photoQ || day?.title} />

      {day?.route ? (
        <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fafafa', paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: '#374151', fontSize: 13, fontWeight: '600' }}>Route: {normalizeArrowText(day.route)}</Text>
        </View>
      ) : null}

      {Array.isArray(day?.pins) && day.pins.length > 0 ? (
        <View style={{ gap: 6 }}>
          {String(day.route || '').trim() && getMapPreviewUrls(day.pins).length > 0 ? (
            <Pressable onPress={() => onOpenPin(day.pins[0])} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', backgroundColor: '#f8fafc' }}>
              <RemoteImage
                uri={getMapPreviewUrls(day.pins)[0]}
                fallbackUris={getMapPreviewUrls(day.pins).slice(1)}
                fallbackUri=""
                style={{ width: '100%', height: 156, backgroundColor: '#f1f5f9' }}
                resizeMode="cover"
              />
            </Pressable>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {day.pins.map((pin, pinIndex) => (
              <Pressable key={`${pin?.name || 'pin'}-${pinIndex}`} onPress={() => onOpenPin(pin)} style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 999, backgroundColor: '#eff6ff', paddingHorizontal: 11, paddingVertical: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="location-sharp" size={13} color="#1e3a8a" />
                  <Text style={{ color: '#1e3a8a', fontSize: 13 }}>{pin?.name || 'Location'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
