import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function TripCalendarPanel({
  calendarMonths,
  activeDayIndex,
  onSelectDayIndex,
}) {
  const months = Array.isArray(calendarMonths?.months) ? calendarMonths.months : [];
  const byIso = calendarMonths?.byIso || new Map();
  const monthScrollRef = useRef(null);
  const [monthIndex, setMonthIndex] = useState(0);
  const [panelWidth, setPanelWidth] = useState(0);

  const activeMonthIndex = useMemo(() => {
    const isoEntry = Array.from(byIso.entries()).find(([, idx]) => idx === activeDayIndex);
    if (!isoEntry) return -1;
    const monthKey = isoEntry[0].slice(0, 7);
    return months.findIndex(({ year, month }) => `${year}-${String(month + 1).padStart(2, '0')}` === monthKey);
  }, [activeDayIndex, byIso, months]);

  useEffect(() => {
    if (!months.length) {
      setMonthIndex(0);
      return;
    }
    if (activeMonthIndex >= 0) {
      setMonthIndex(activeMonthIndex);
      return;
    }
    setMonthIndex((prev) => Math.min(Math.max(prev, 0), months.length - 1));
  }, [activeMonthIndex, months.length]);

  useEffect(() => {
    if (!monthScrollRef.current || panelWidth <= 0) return;
    monthScrollRef.current.scrollTo({ x: monthIndex * panelWidth, animated: false });
  }, [monthIndex, panelWidth]);

  const monthToRender = months[monthIndex];
  const monthName = monthToRender
    ? new Date(monthToRender.year, monthToRender.month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
    : '';

  if (!months.length) return null;

  return (
    <View
      style={{ gap: 10 }}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (width > 0 && width !== panelWidth) setPanelWidth(width);
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => setMonthIndex((prev) => Math.max(0, prev - 1))}
          disabled={monthIndex === 0}
          style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, opacity: monthIndex === 0 ? 0.35 : 1 }}
        >
          <Text style={{ color: '#374151', fontWeight: '700', fontSize: 11 }}>Prev</Text>
        </Pressable>
        <Text style={{ color: '#111827', fontWeight: '700', fontSize: 14 }}>{monthName}</Text>
        <Pressable
          onPress={() => setMonthIndex((prev) => Math.min(months.length - 1, prev + 1))}
          disabled={monthIndex === months.length - 1}
          style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, opacity: monthIndex === months.length - 1 ? 0.35 : 1 }}
        >
          <Text style={{ color: '#374151', fontWeight: '700', fontSize: 11 }}>Next</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <Text key={`${monthName}-${d}`} style={{ width: `${100 / 7}%`, textAlign: 'center', color: '#6b7280', fontSize: 10, fontWeight: '700' }}>{d}</Text>
        ))}
      </View>
      <ScrollView
        ref={monthScrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          if (panelWidth <= 0) return;
          const next = Math.round(event.nativeEvent.contentOffset.x / panelWidth);
          setMonthIndex(Math.min(months.length - 1, Math.max(0, next)));
        }}
      >
        {months.map(({ year: y, month: m }) => {
          const firstDay = new Date(y, m, 1).getDay();
          const firstMon = (firstDay + 6) % 7;
          const daysIn = new Date(y, m + 1, 0).getDate();
          const cells = [];
          for (let i = 0; i < firstMon; i += 1) cells.push(null);
          for (let d = 1; d <= daysIn; d += 1) cells.push(d);
          while (cells.length % 7 !== 0) cells.push(null);

          return (
            <View key={`${y}-${m}`} style={{ width: panelWidth || 320, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {cells.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <View key={`${y}-${m}-blank-${idx}`} style={{ width: '13.2%', aspectRatio: 1 }} />;
                }
                const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayIndex = byIso.get(iso);
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
                    <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <Text
                        style={{
                          color: isSelected ? '#ffffff' : (isActive ? '#111827' : '#9ca3af'),
                          fontSize: 12,
                          fontWeight: '700',
                          textAlign: 'center',
                          includeFontPadding: false,
                          textAlignVertical: 'center',
                          transform: [{ translateY: -1 }],
                        }}
                      >
                        {dayNum}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
