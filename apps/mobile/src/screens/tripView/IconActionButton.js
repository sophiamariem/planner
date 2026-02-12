import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function IconActionButton({
  iconName,
  onPress,
  tone = 'default',
  accessibilityLabel,
  compact = false,
  disabled = false,
}) {
  const palette = tone === 'danger'
    ? { bg: '#fef2f2', border: '#fecaca', fg: '#b91c1c' }
    : tone === 'primary'
      ? { bg: '#eff6ff', border: '#bfdbfe', fg: '#1d4ed8' }
      : { bg: '#ffffff', border: '#d1d5db', fg: '#111827' };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: compact ? 36 : 42,
        height: compact ? 36 : 42,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Ionicons name={iconName} size={compact ? 16 : 18} color={palette.fg} />
    </Pressable>
  );
}
