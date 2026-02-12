import React from 'react';
import { Pressable, Text, View } from 'react-native';
import IconActionButton from './IconActionButton';
import { RemoteImage, fallbackPhotoUri, proxyImageUris } from './media';

export default function TripHeaderCard({
  cover,
  title,
  hasOfflineCopy,
  onToggleOffline,
  isSharedNotOwned,
  onSaveSharedCopy,
  savingSharedCopy,
  copiedFrom,
  startDate,
  daysCount,
  tripFooter,
}) {
  return (
    <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, backgroundColor: '#ffffff', overflow: 'hidden' }}>
      {cover ? (
        <View style={{ width: '100%', height: 240 }}>
          <RemoteImage
            uri={cover}
            fallbackUris={proxyImageUris(cover)}
            fallbackUri={fallbackPhotoUri(title)}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      ) : null}
      <View style={{ padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ flex: 1, fontSize: 31, fontWeight: '800', color: '#111827' }}>{title}</Text>
          <IconActionButton
            iconName={hasOfflineCopy ? 'checkmark-done-outline' : 'download-outline'}
            onPress={onToggleOffline}
            tone={hasOfflineCopy ? 'primary' : 'default'}
            compact
            accessibilityLabel={hasOfflineCopy ? 'Offline saved' : 'Save for offline'}
          />
        </View>
        {isSharedNotOwned ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#fffbeb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#92400e', fontSize: 12, fontWeight: '700' }}>Shared (read-only)</Text>
            </View>
            <Pressable
              onPress={onSaveSharedCopy}
              disabled={savingSharedCopy}
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                backgroundColor: '#ffffff',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
                opacity: savingSharedCopy ? 0.55 : 1,
              }}
            >
              <Text style={{ color: '#111827', fontSize: 12, fontWeight: '700' }}>
                {savingSharedCopy ? 'Saving...' : 'Save to My Trips'}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {!isSharedNotOwned && copiedFrom?.ownerId ? (
          <View style={{ borderWidth: 1, borderColor: '#ddd6fe', backgroundColor: '#f5f3ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
            <Text style={{ color: '#6d28d9', fontSize: 12, fontWeight: '700' }}>Copied from shared trip</Text>
          </View>
        ) : null}
        <Text style={{ color: '#6b7280', fontSize: 14 }}>
          {startDate ? `Starts ${startDate}` : 'Add dates in edit mode'} • {daysCount} day(s)
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {startDate ? (
            <View style={{ borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#fef3c7', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ color: '#92400e', fontSize: 12, fontWeight: '700' }}>{startDate}</Text>
            </View>
          ) : null}
          <View style={{ borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '700' }}>{daysCount} days</Text>
          </View>
        </View>
        {tripFooter ? (
          <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{tripFooter}</Text>
        ) : null}
      </View>
    </View>
  );
}
