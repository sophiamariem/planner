import React from 'react';
import { Image, ScrollView, Text, TextInput, View } from 'react-native';
import { normalizeDayTitle } from './useNewTripController';

export default function ReviewSection({ reviewCoverPhoto, title, previewDates, flights, tripFooter, dayDrafts, updateFooter }) {
  return (
    <View style={{ gap: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 12, backgroundColor: '#ffffff' }}>
      <View style={{ borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 16, backgroundColor: '#fafafa', overflow: 'hidden' }}>
        {reviewCoverPhoto ? (
          <View style={{ width: '100%', height: 170 }}>
            <Image source={{ uri: reviewCoverPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(17,24,39,0.62)' }}>
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 17 }}>{title || 'Untitled Trip'}</Text>
              <Text style={{ color: '#e5e7eb', fontSize: 12 }}>{previewDates[0]?.toDateString()} -> {previewDates[previewDates.length - 1]?.toDateString()}</Text>
            </View>
          </View>
        ) : (
          <View style={{ padding: 12, gap: 4 }}>
            <Text style={{ color: '#111827', fontWeight: '800', fontSize: 16 }}>{title || 'Untitled Trip'}</Text>
            <Text style={{ color: '#52525b', fontSize: 12 }}>{previewDates[0]?.toDateString()} -> {previewDates[previewDates.length - 1]?.toDateString()}</Text>
          </View>
        )}
        <View style={{ padding: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '700' }}>{previewDates.length} days</Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: '#dcfce7', backgroundColor: '#f0fdf4', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#166534', fontSize: 12, fontWeight: '700' }}>{flights.length} flights</Text>
            </View>
            {tripFooter ? (
              <View style={{ borderWidth: 1, borderColor: '#fbcfe8', backgroundColor: '#fdf2f8', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#9d174d', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>{tripFooter}</Text>
              </View>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {dayDrafts.map((day, index) => {
              const photo = Array.isArray(day?.photos) && day.photos.length > 0 ? day.photos[0] : '';
              const pinsCount = Array.isArray(day?.pins) ? day.pins.length : 0;
              return (
                <View key={day._key || `review-day-${index}`} style={{ width: 190, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={{ width: '100%', height: 92 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: '100%', height: 92, backgroundColor: '#f4f4f5', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#71717a', fontSize: 12 }}>No photo</Text>
                    </View>
                  )}
                  <View style={{ padding: 8, gap: 3 }}>
                    <Text style={{ color: '#111827', fontSize: 12, fontWeight: '700' }}>Day {index + 1}</Text>
                    <Text style={{ color: '#374151', fontSize: 12 }} numberOfLines={1}>{normalizeDayTitle(day.title, index, dayDrafts.length)}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 11 }}>{pinsCount} locations</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={{ color: '#111827', fontWeight: '700' }}>Footer</Text>
        <TextInput value={tripFooter} onChangeText={updateFooter} placeholder="Planned with PLNR" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' }} />
      </View>
    </View>
  );
}
