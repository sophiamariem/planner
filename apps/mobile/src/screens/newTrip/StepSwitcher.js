import React from 'react';
import { Pressable, Text, View } from 'react-native';
import S from './uiStyles';

export default function StepSwitcher({ stepLabels, step, setStep }) {
  return (
    <View style={S.segmentedRow}>
      {stepLabels.map((label, index) => (
        <Pressable
          key={label}
          onPress={() => setStep(index)}
          style={[
            S.segmentedButton,
            { borderColor: step === index ? '#111827' : '#d1d5db', backgroundColor: step === index ? '#111827' : '#ffffff' },
          ]}
        >
          <Text style={[S.segmentedText, { color: step === index ? '#ffffff' : '#374151' }]}>{index + 1}. {label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
