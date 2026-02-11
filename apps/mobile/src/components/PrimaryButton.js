import React from 'react';
import { Pressable, Text } from 'react-native';

export default function PrimaryButton({ title, onPress, disabled = false, variant = 'solid' }) {
  const solid = variant === 'solid';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: solid ? '#111827' : '#ffffff',
        borderColor: solid ? '#111827' : '#d4d4d8',
        borderWidth: 1,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 14,
        opacity: disabled ? 0.45 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        shadowColor: solid ? '#111827' : '#000000',
        shadowOpacity: pressed ? 0.05 : (solid ? 0.2 : 0.06),
        shadowRadius: solid ? 10 : 6,
        shadowOffset: { width: 0, height: solid ? 5 : 2 },
        elevation: solid ? 3 : 1,
      })}
    >
      <Text style={{ color: solid ? '#ffffff' : '#111827', fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 }}>{title}</Text>
    </Pressable>
  );
}
