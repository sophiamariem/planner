import React from 'react';
import { Pressable, Text, View } from 'react-native';
import S from './uiStyles';

export default function PlanTabSwitcher({ planTab, setPlanTab }) {
  return (
    <View style={S.segmentedRow}>
      <Pressable
        onPress={() => setPlanTab('days')}
        style={[
          S.segmentedButton,
          { borderColor: planTab === 'days' ? '#111827' : '#d1d5db', backgroundColor: planTab === 'days' ? '#111827' : '#ffffff' },
        ]}
      >
        <Text style={[S.segmentedText, { color: planTab === 'days' ? '#ffffff' : '#374151' }]}>Days</Text>
      </Pressable>
      <Pressable
        onPress={() => setPlanTab('flights')}
        style={[
          S.segmentedButton,
          { borderColor: planTab === 'flights' ? '#111827' : '#d1d5db', backgroundColor: planTab === 'flights' ? '#111827' : '#ffffff' },
        ]}
      >
        <Text style={[S.segmentedText, { color: planTab === 'flights' ? '#ffffff' : '#374151' }]}>Flights</Text>
      </Pressable>
    </View>
  );
}
