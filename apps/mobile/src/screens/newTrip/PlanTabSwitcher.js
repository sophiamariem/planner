import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function PlanTabSwitcher({ planTab, setPlanTab }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable onPress={() => setPlanTab('days')} style={{ flex: 1, borderWidth: 1, borderColor: planTab === 'days' ? '#111827' : '#d1d5db', backgroundColor: planTab === 'days' ? '#111827' : '#ffffff', borderRadius: 999, paddingVertical: 8, alignItems: 'center' }}>
        <Text style={{ color: planTab === 'days' ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>Days</Text>
      </Pressable>
      <Pressable onPress={() => setPlanTab('flights')} style={{ flex: 1, borderWidth: 1, borderColor: planTab === 'flights' ? '#111827' : '#d1d5db', backgroundColor: planTab === 'flights' ? '#111827' : '#ffffff', borderRadius: 999, paddingVertical: 8, alignItems: 'center' }}>
        <Text style={{ color: planTab === 'flights' ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>Flights</Text>
      </Pressable>
    </View>
  );
}
