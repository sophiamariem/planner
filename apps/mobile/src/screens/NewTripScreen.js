import React from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import useNewTripController, {
  TEMPLATE_OPTIONS,
  formatChipLabel,
  formatIsoAsDisplayDate,
  normalizeDayTitle,
} from './newTrip/useNewTripController';

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

export default function NewTripScreen({ onCancel, onSubmit, submitting = false, mode = 'create', initialTripData = null }) {
  const {
    isEditing,
    isCreating,
    title,
    updateTitle,
    startDate,
    setStartDate,
    daysCount,
    setDaysCount,
    selectedTemplateId,
    tripFooter,
    updateFooter,
    coverPhoto,
    setCoverPhoto,
    coverQuery,
    setCoverQuery,
    coverResults,
    coverLoading,
    coverError,
    dayDrafts,
    flights,
    setFlights,
    step,
    setStep,
    planTab,
    setPlanTab,
    stepLabels,
    canContinueBasics,
    datePresets,
    previewDates,
    reviewCoverPhoto,
    openStartDatePicker,
    openFlightDatePicker,
    openFlightTimePicker,
    moveDay,
    moveFlight,
    applyTemplate,
    runPhotoSearchForDay,
    runCoverSearch,
    addPhotoToDay,
    addPhotoUrlToDay,
    removePhotoFromDay,
    addLocationToDay,
    removeLocationFromDay,
    addFlight,
    buildTripData,
    updateDayDraft,
    updateFlight,
  } = useNewTripController({ mode, initialTripData });

  return (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>{isEditing ? 'Edit Trip' : 'New Trip'}</Text>
      <Text style={{ color: '#6b7280' }}>
        {isEditing ? 'Update details and itinerary.' : 'Create quickly here and keep everything cloud-synced.'}
      </Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {stepLabels.map((label, index) => (
          <Pressable key={label} onPress={() => setStep(index)} style={{ flex: 1, borderWidth: 1, borderColor: step === index ? '#111827' : '#d1d5db', backgroundColor: step === index ? '#111827' : '#ffffff', borderRadius: 999, paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ color: step === index ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>{index + 1}. {label}</Text>
          </Pressable>
        ))}
      </View>

      {step === 0 ? (
        <View style={{ gap: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 12, backgroundColor: '#ffffff' }}>
          {isCreating ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111827', fontWeight: '700' }}>Start from template</Text>
              <View style={{ gap: 8 }}>
                {TEMPLATE_OPTIONS.map((template) => {
                  const active = selectedTemplateId === template.id;
                  return (
                    <Pressable key={template.id} onPress={() => applyTemplate(template.id)} style={{ borderWidth: 1, borderColor: active ? '#111827' : '#d4d4d8', borderRadius: 14, padding: 10, backgroundColor: active ? '#f3f4f6' : '#ffffff', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8' }}>
                        <Image source={{ uri: template.cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#111827', fontWeight: '700' }}>{template.emoji} {template.title}</Text>
                        <Text style={{ color: '#6b7280', fontSize: 12 }}>{template.description}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#111827', fontWeight: '700' }}>Trip title</Text>
            <TextInput value={title} onChangeText={updateTitle} placeholder="Summer in Lisbon" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#111827', fontWeight: '700' }}>Start date</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {datePresets.map((preset) => {
                const iso = `${preset.getFullYear()}-${String(preset.getMonth() + 1).padStart(2, '0')}-${String(preset.getDate()).padStart(2, '0')}`;
                const active = iso === startDate;
                return (
                  <Pressable key={iso} onPress={() => setStartDate(iso)} style={{ borderWidth: 1, borderColor: active ? '#111827' : '#d4d4d8', backgroundColor: active ? '#111827' : '#ffffff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ color: active ? '#ffffff' : '#111827', fontWeight: '600', fontSize: 12 }}>{formatChipLabel(preset)}</Text>
                  </Pressable>
                );
              })}
            </View>
            {Platform.OS === 'android' ? (
              <Pressable onPress={openStartDatePicker} style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' }}>
                <Text style={{ color: '#111827', fontSize: 16 }}>{formatIsoAsDisplayDate(startDate) || 'Select start date'}</Text>
                <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{startDate || 'YYYY-MM-DD'}</Text>
              </Pressable>
            ) : (
              <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }} />
            )}
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#111827', fontWeight: '700' }}>Duration</Text>
            <TextInput value={daysCount} onChangeText={setDaysCount} placeholder="1-14" keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#111827', fontWeight: '700' }}>Cover photo</Text>
            <TextInput value={coverQuery} onChangeText={setCoverQuery} placeholder="Search cover photo" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff' }} />
            <PrimaryButton title={coverLoading ? 'Finding...' : 'Find Photos'} onPress={runCoverSearch} disabled={coverLoading} variant="outline" />
            {coverError ? <Text style={{ color: '#dc2626', fontSize: 12 }}>{coverError}</Text> : null}
            {coverPhoto ? (
              <View style={{ width: '100%', height: 150, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8' }}>
                <Image source={{ uri: coverPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            ) : null}
            {coverResults.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {coverResults.map((uri, idx) => (
                  <Pressable key={`${uri}-${idx}`} onPress={() => setCoverPhoto(uri)} style={{ width: 90, height: 90, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: coverPhoto === uri ? '#111827' : '#d4d4d8' }}>
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 12, backgroundColor: '#ffffff' }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setPlanTab('days')} style={{ flex: 1, borderWidth: 1, borderColor: planTab === 'days' ? '#111827' : '#d1d5db', backgroundColor: planTab === 'days' ? '#111827' : '#ffffff', borderRadius: 999, paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ color: planTab === 'days' ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>Days</Text>
            </Pressable>
            <Pressable onPress={() => setPlanTab('flights')} style={{ flex: 1, borderWidth: 1, borderColor: planTab === 'flights' ? '#111827' : '#d1d5db', backgroundColor: planTab === 'flights' ? '#111827' : '#ffffff', borderRadius: 999, paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ color: planTab === 'flights' ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>Flights</Text>
            </Pressable>
          </View>

          {planTab === 'days' ? (
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
          ) : null}

          {planTab === 'flights' ? (
            <>
              <Text style={{ color: '#111827', fontWeight: '700' }}>Flights</Text>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>Use arrows to reorder flights.</Text>
              {flights.length === 0 ? <Text style={{ color: '#71717a', fontSize: 12 }}>No flights yet.</Text> : null}
              {flights.map((item, index) => (
                <View key={item._key || `flight-${index}`} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, gap: 8, backgroundColor: '#fff' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>Flight {index + 1}</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Pressable onPress={() => moveFlight(index, index - 1)} disabled={index === 0} style={{ opacity: index === 0 ? 0.35 : 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                        <Text style={{ color: '#374151', fontWeight: '700', fontSize: 14 }}>↑</Text>
                      </Pressable>
                      <Pressable onPress={() => moveFlight(index, index + 1)} disabled={index === flights.length - 1} style={{ opacity: index === flights.length - 1 ? 0.35 : 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                        <Text style={{ color: '#374151', fontWeight: '700', fontSize: 14 }}>↓</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput value={item.from} onChangeText={(value) => updateFlight(index, { from: value })} placeholder="From" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                    <TextInput value={item.to} onChangeText={(value) => updateFlight(index, { to: value })} placeholder="To" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {Platform.OS === 'android' ? (
                      <Pressable onPress={() => openFlightDatePicker(index)} style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', justifyContent: 'center' }}>
                        <Text style={{ color: '#111827', fontSize: 14 }}>{formatIsoAsDisplayDate(item.date) || 'Flight date'}</Text>
                        <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{item.date || 'YYYY-MM-DD'}</Text>
                      </Pressable>
                    ) : (
                      <TextInput value={item.date} onChangeText={(value) => updateFlight(index, { date: value })} placeholder="Date (YYYY-MM-DD)" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                    )}
                    <TextInput value={item.flightNo} onChangeText={(value) => updateFlight(index, { flightNo: value })} placeholder="Flight No" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {Platform.OS === 'android' ? (
                      <>
                        <Pressable onPress={() => openFlightTimePicker(index, 'departTime')} style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', justifyContent: 'center' }}>
                          <Text style={{ color: '#111827', fontSize: 14 }}>{item.departTime || 'Departure time'}</Text>
                        </Pressable>
                        <Pressable onPress={() => openFlightTimePicker(index, 'arriveTime')} style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', justifyContent: 'center' }}>
                          <Text style={{ color: '#111827', fontSize: 14 }}>{item.arriveTime || 'Arrival time'}</Text>
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <TextInput value={item.departTime} onChangeText={(value) => updateFlight(index, { departTime: value })} placeholder="Depart (HH:mm)" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                        <TextInput value={item.arriveTime} onChangeText={(value) => updateFlight(index, { arriveTime: value })} placeholder="Arrive (HH:mm)" style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' }} />
                      </>
                    )}
                  </View>
                  <Pressable onPress={() => setFlights((prev) => prev.filter((_, i) => i !== index))}>
                    <Text style={{ color: '#b91c1c', fontWeight: '700', fontSize: 12 }}>Remove flight</Text>
                  </Pressable>
                </View>
              ))}
              <PrimaryButton title="Add Flight" onPress={addFlight} variant="outline" />
            </>
          ) : null}
        </View>
      ) : null}

      {step === 2 ? (
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
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Close" onPress={onCancel} variant="outline" />
        </View>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <PrimaryButton title="Back" onPress={() => setStep((prev) => Math.max(0, prev - 1))} variant="outline" />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <PrimaryButton
            title={step < 2 ? 'Continue' : (submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Trip')}
            onPress={() => {
              if (step < 2) {
                if (step === 0 && !canContinueBasics) return;
                setStep((prev) => Math.min(2, prev + 1));
                return;
              }
              const tripData = buildTripData();
              if (tripData) onSubmit(tripData);
            }}
            disabled={submitting || (step === 0 && !canContinueBasics)}
          />
        </View>
      </View>
    </View>
  );
}
