import React from 'react';
import { Pressable, Text } from 'react-native';

export default function PrimaryButton({ title, onPress, disabled = false, variant = 'solid' }) {
  const solid = variant === 'solid';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: solid ? '#18181b' : '#ffffff',
        borderColor: '#d4d4d8',
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: solid ? '#ffffff' : '#18181b', fontWeight: '600', textAlign: 'center' }}>{title}</Text>
    </Pressable>
  );
}
