import React from 'react';
import { View } from 'react-native';
import IconActionButton from './IconActionButton';

export default function TripTopBar({
  onBack,
  onDelete,
  onEdit,
  onShare,
  shareDisabled,
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2 }}>
      <IconActionButton iconName="chevron-back-outline" onPress={onBack} accessibilityLabel="Back to saved trips" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconActionButton iconName="trash-outline" onPress={onDelete} tone="danger" accessibilityLabel="Delete trip" />
        <IconActionButton iconName="create-outline" onPress={onEdit} tone="primary" accessibilityLabel="Edit trip" />
        <IconActionButton iconName="share-social-outline" onPress={onShare} accessibilityLabel="Share trip" disabled={shareDisabled} />
      </View>
    </View>
  );
}
