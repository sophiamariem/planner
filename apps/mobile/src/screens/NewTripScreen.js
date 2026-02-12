import React from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import PlanDaysSection from './newTrip/PlanDaysSection';
import PlanFlightsSection from './newTrip/PlanFlightsSection';
import useNewTripController, {
  TEMPLATE_OPTIONS,
  formatChipLabel,
  formatIsoAsDisplayDate,
  normalizeDayTitle,
} from './newTrip/useNewTripController';

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
            <PlanDaysSection
              dayDrafts={dayDrafts}
              previewDates={previewDates}
              formatChipLabel={formatChipLabel}
              moveDay={moveDay}
              updateDayDraft={updateDayDraft}
              runPhotoSearchForDay={runPhotoSearchForDay}
              addPhotoUrlToDay={addPhotoUrlToDay}
              addPhotoToDay={addPhotoToDay}
              removePhotoFromDay={removePhotoFromDay}
              addLocationToDay={addLocationToDay}
              removeLocationFromDay={removeLocationFromDay}
            />
          ) : null}

          {planTab === 'flights' ? (
            <PlanFlightsSection
              flights={flights}
              moveFlight={moveFlight}
              updateFlight={updateFlight}
              setFlights={setFlights}
              openFlightDatePicker={openFlightDatePicker}
              openFlightTimePicker={openFlightTimePicker}
              addFlight={addFlight}
              formatIsoAsDisplayDate={formatIsoAsDisplayDate}
            />
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
