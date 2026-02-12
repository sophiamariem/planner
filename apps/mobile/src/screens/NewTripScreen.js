import React from 'react';
import { Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import BasicsSection from './newTrip/BasicsSection';
import PlanDaysSection from './newTrip/PlanDaysSection';
import PlanFlightsSection from './newTrip/PlanFlightsSection';
import PlanTabSwitcher from './newTrip/PlanTabSwitcher';
import ReviewSection from './newTrip/ReviewSection';
import StepSwitcher from './newTrip/StepSwitcher';
import S from './newTrip/uiStyles';
import useNewTripController, {
  TEMPLATE_OPTIONS,
  formatChipLabel,
  formatIsoAsDisplayDate,
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
        {isEditing ? 'Update details and itinerary.' : 'Create quickly here and keep everything synced.'}
      </Text>

      <StepSwitcher stepLabels={stepLabels} step={step} setStep={setStep} />

      {step === 0 ? (
        <BasicsSection
          isCreating={isCreating}
          templateOptions={TEMPLATE_OPTIONS}
          selectedTemplateId={selectedTemplateId}
          applyTemplate={applyTemplate}
          title={title}
          updateTitle={updateTitle}
          datePresets={datePresets}
          startDate={startDate}
          setStartDate={setStartDate}
          openStartDatePicker={openStartDatePicker}
          formatChipLabel={formatChipLabel}
          formatIsoAsDisplayDate={formatIsoAsDisplayDate}
          daysCount={daysCount}
          setDaysCount={setDaysCount}
          coverQuery={coverQuery}
          setCoverQuery={setCoverQuery}
          coverLoading={coverLoading}
          runCoverSearch={runCoverSearch}
          coverError={coverError}
          coverPhoto={coverPhoto}
          coverResults={coverResults}
          setCoverPhoto={setCoverPhoto}
        />
      ) : null}

      {step === 1 ? (
        <View style={S.sectionCard}>
          <PlanTabSwitcher planTab={planTab} setPlanTab={setPlanTab} />

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
        <ReviewSection
          reviewCoverPhoto={reviewCoverPhoto}
          title={title}
          previewDates={previewDates}
          flights={flights}
          tripFooter={tripFooter}
          dayDrafts={dayDrafts}
          updateFooter={updateFooter}
        />
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
