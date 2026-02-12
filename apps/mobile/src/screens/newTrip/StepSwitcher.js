import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function StepSwitcher({ stepLabels, step, setStep }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {stepLabels.map((label, index) => (
        <Pressable key={label} onPress={() => setStep(index)} style={{ flex: 1, borderWidth: 1, borderColor: step === index ? '#111827' : '#d1d5db', backgroundColor: step === index ? '#111827' : '#ffffff', borderRadius: 999, paddingVertical: 8, alignItems: 'center' }}>
          <Text style={{ color: step === index ? '#ffffff' : '#374151', fontSize: 12, fontWeight: '700' }}>{index + 1}. {label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
