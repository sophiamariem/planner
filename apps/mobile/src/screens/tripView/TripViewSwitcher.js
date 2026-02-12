import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import TripCalendarPanel from './TripCalendarPanel';

export default function TripViewSwitcher({
  viewMode,
  onChangeViewMode,
  days,
  activeDayIndex,
  onJumpToDay,
  calendarMonths,
  dayBadges,
  onSelectDayIndex,
  getDayNavLabel,
}) {
  return (
    <View style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 16, backgroundColor: '#ffffff', padding: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => onChangeViewMode('cards')}
          style={{
            borderWidth: 1,
            borderColor: viewMode === 'cards' ? '#111827' : '#d1d5db',
            backgroundColor: viewMode === 'cards' ? '#111827' : '#ffffff',
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
          }}
        >
          <Text style={{ color: viewMode === 'cards' ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>Cards</Text>
        </Pressable>
        <Pressable
          onPress={() => onChangeViewMode('calendar')}
          style={{
            borderWidth: 1,
            borderColor: viewMode === 'calendar' ? '#111827' : '#d1d5db',
            backgroundColor: viewMode === 'calendar' ? '#111827' : '#ffffff',
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
          }}
        >
          <Text style={{ color: viewMode === 'calendar' ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>Calendar</Text>
        </Pressable>
      </View>

      {viewMode === 'cards' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {days.map((day, index) => (
            <Pressable
              key={`jump-${day.id || index}`}
              onPress={() => onJumpToDay(index)}
              style={{
                borderWidth: 1,
                borderColor: activeDayIndex === index ? '#111827' : '#d1d5db',
                backgroundColor: activeDayIndex === index ? '#111827' : '#ffffff',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: activeDayIndex === index ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>
                {getDayNavLabel(day, index)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <TripCalendarPanel
          calendarMonths={calendarMonths}
          activeDayIndex={activeDayIndex}
          dayBadges={dayBadges}
          onSelectDayIndex={onSelectDayIndex}
        />
      )}
    </View>
  );
}
