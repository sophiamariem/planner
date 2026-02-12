import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function TripCalendarPanel({
  calendarMonths,
  activeDayIndex,
  onSelectDayIndex,
}) {
  return (
    <View style={{ gap: 10 }}>
      {calendarMonths.months.map(({ year: y, month: m }) => {
        const monthName = new Date(y, m, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
        const firstDay = new Date(y, m, 1).getDay();
        const firstMon = (firstDay + 6) % 7;
        const daysIn = new Date(y, m + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstMon; i += 1) cells.push(null);
        for (let d = 1; d <= daysIn; d += 1) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);

        return (
          <View key={`${y}-${m}`} style={{ gap: 8 }}>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 14 }}>{monthName}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <Text key={`${monthName}-${d}`} style={{ width: `${100 / 7}%`, textAlign: 'center', color: '#6b7280', fontSize: 10, fontWeight: '700' }}>{d}</Text>
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {cells.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <View key={`${y}-${m}-blank-${idx}`} style={{ width: '13.2%', aspectRatio: 1 }} />;
                }
                const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayIndex = calendarMonths.byIso.get(iso);
                const isActive = typeof dayIndex === 'number';
                const isSelected = isActive && dayIndex === activeDayIndex;
                return (
                  <Pressable
                    key={`${y}-${m}-${dayNum}`}
                    onPress={() => isActive && onSelectDayIndex(dayIndex)}
                    disabled={!isActive}
                    style={{
                      width: '13.2%',
                      aspectRatio: 1,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: isActive ? '#fbcfe8' : '#e5e7eb',
                      backgroundColor: isSelected ? '#c026d3' : (isActive ? '#fdf2f8' : '#ffffff'),
                      opacity: isActive ? 1 : 0.5,
                    }}
                  >
                    <Text style={{ color: isSelected ? '#ffffff' : (isActive ? '#111827' : '#9ca3af'), fontSize: 12, fontWeight: '700' }}>{dayNum}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
