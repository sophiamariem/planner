import React from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';

function PhotoTile({ uri, onRemove }) {
  return (
    <View style={{ width: 92, height: 92, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8', backgroundColor: '#f4f4f5' }}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      <Pressable onPress={onRemove} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 999, backgroundColor: 'rgba(24,24,27,0.84)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>X</Text>
      </Pressable>
    </View>
  );
}

export default function PlanDaysSection({
  dayDrafts,
  previewDates,
  formatChipLabel,
  moveDay,
  updateDayDraft,
  runPhotoSearchForDay,
  addPhotoUrlToDay,
  addPhotoToDay,
  removePhotoFromDay,
  addLocationToDay,
  removeLocationFromDay,
}) {
  return (
    <>
      <Text style={{ color: '#111827', fontWeight: '700' }}>Days</Text>
      {dayDrafts.map((item, index) => (
        <View key={item._key || `day-edit-${index}`} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 10, gap: 8, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>
              Day {index + 1} {previewDates[index] ? `(${formatChipLabel(previewDates[index])})` : ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable onPress={() => moveDay(index, index - 1)} disabled={index === 0} style={{ opacity: index === 0 ? 0.35 : 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#374151', fontWeight: '700', fontSize: 14 }}>↑</Text>
              </Pressable>
              <Pressable onPress={() => moveDay(index, index + 1)} disabled={index === dayDrafts.length - 1} style={{ opacity: index === dayDrafts.length - 1 ? 0.35 : 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#374151', fontWeight: '700', fontSize: 14 }}>↓</Text>
              </Pressable>
            </View>
          </View>

          <TextInput value={item.title} onChangeText={(value) => updateDayDraft(index, { title: value })} placeholder="Day title" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
          <TextInput value={item.notesText} onChangeText={(value) => updateDayDraft(index, { notesText: value })} placeholder="Notes (one per line)" multiline style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', minHeight: 70, textAlignVertical: 'top' }} />

          <View style={{ gap: 6, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fafafa', padding: 10 }}>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>Photos</Text>
            <TextInput value={item.photoQuery} onChangeText={(value) => updateDayDraft(index, { photoQuery: value })} placeholder="Search photos for this day" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton title={item.photoLoading ? 'Finding...' : 'Find Photos'} onPress={() => runPhotoSearchForDay(index)} disabled={item.photoLoading} variant="outline" />
              </View>
              <Pressable
                onPress={() => updateDayDraft(index, { showPhotoUrlInput: !item.showPhotoUrlInput, photoError: '' })}
                style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#fff' }}
              >
                <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>{item.showPhotoUrlInput ? 'Close URL' : 'Add URL'}</Text>
              </Pressable>
            </View>
            {item.showPhotoUrlInput ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={item.photoUrl || ''}
                  onChangeText={(value) => updateDayDraft(index, { photoUrl: value })}
                  placeholder="Paste photo URL"
                  autoCapitalize="none"
                  style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }}
                />
                <Pressable
                  onPress={() => addPhotoUrlToDay(index)}
                  style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#fff' }}
                >
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>Add</Text>
                </Pressable>
              </View>
            ) : null}
            {item.photoError ? <Text style={{ color: '#dc2626', fontSize: 12 }}>{item.photoError}</Text> : null}
            {Array.isArray(item.photoResults) && item.photoResults.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {item.photoResults.map((uri, photoIndex) => (
                  <Pressable key={`${uri}-${photoIndex}`} onPress={() => addPhotoToDay(index, uri)} style={{ width: 86, height: 86, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8' }}>
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
            {Array.isArray(item.photos) && item.photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {item.photos.map((uri, photoIndex) => (
                  <PhotoTile key={`${uri}-${photoIndex}`} uri={uri} onRemove={() => removePhotoFromDay(index, photoIndex)} />
                ))}
              </ScrollView>
            ) : (
              <Text style={{ color: '#71717a', fontSize: 12 }}>No photos added yet.</Text>
            )}
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>Locations</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TextInput value={item.locationQuery} onChangeText={(value) => updateDayDraft(index, { locationQuery: value })} placeholder="Search place or address" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
              <Pressable onPress={() => addLocationToDay(index)} style={{ marginLeft: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: '#fff' }}>
                <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>{item.locationLoading ? '...' : 'Add'}</Text>
              </Pressable>
            </View>
            {item.locationError ? <Text style={{ color: '#dc2626', fontSize: 12 }}>{item.locationError}</Text> : null}
            {(item.pins || []).length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(item.pins || []).map((pin, pinIndex) => (
                  <View key={`${pin.name}-${pinIndex}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#fafafa' }}>
                    <Text style={{ color: '#374151', fontSize: 12 }}>{pin.name}</Text>
                    <Pressable onPress={() => removeLocationFromDay(index, pinIndex)}>
                      <Text style={{ color: '#b91c1c', fontWeight: '700', fontSize: 12 }}>X</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: '#71717a', fontSize: 12 }}>No locations added yet.</Text>
            )}
          </View>
        </View>
      ))}
    </>
  );
}
