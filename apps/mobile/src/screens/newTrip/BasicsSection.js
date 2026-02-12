import React from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';

export default function BasicsSection({
  isCreating,
  templateOptions,
  selectedTemplateId,
  applyTemplate,
  title,
  updateTitle,
  datePresets,
  startDate,
  setStartDate,
  openStartDatePicker,
  formatChipLabel,
  formatIsoAsDisplayDate,
  daysCount,
  setDaysCount,
  coverQuery,
  setCoverQuery,
  coverLoading,
  runCoverSearch,
  coverError,
  coverPhoto,
  coverResults,
  setCoverPhoto,
}) {
  return (
    <View style={{ gap: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, padding: 12, backgroundColor: '#ffffff' }}>
      {isCreating ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: '#111827', fontWeight: '700' }}>Start from template</Text>
          <View style={{ gap: 8 }}>
            {templateOptions.map((template) => {
              const active = selectedTemplateId === template.id;
              return (
                <Pressable key={template.id} onPress={() => applyTemplate(template.id)} style={{ borderWidth: 1, borderColor: active ? '#111827' : '#d4d4d8', borderRadius: 14, padding: 10, backgroundColor: active ? '#f3f4f6' : '#ffffff', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8' }}>
                    <Image source={{ uri: template.cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#111827', fontWeight: '700' }}>{template.emoji} {template.title}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>{template.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text style={{ color: '#111827', fontWeight: '700' }}>Trip title</Text>
        <TextInput value={title} onChangeText={updateTitle} placeholder="Summer in Lisbon" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: '#111827', fontWeight: '700' }}>Start date</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {datePresets.map((preset) => {
            const iso = `${preset.getFullYear()}-${String(preset.getMonth() + 1).padStart(2, '0')}-${String(preset.getDate()).padStart(2, '0')}`;
            const active = iso === startDate;
            return (
              <Pressable key={iso} onPress={() => setStartDate(iso)} style={{ borderWidth: 1, borderColor: active ? '#111827' : '#d4d4d8', backgroundColor: active ? '#111827' : '#ffffff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ color: active ? '#ffffff' : '#111827', fontWeight: '600', fontSize: 12 }}>{formatChipLabel(preset)}</Text>
              </Pressable>
            );
          })}
        </View>
        {Platform.OS === 'android' ? (
          <Pressable onPress={openStartDatePicker} style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' }}>
            <Text style={{ color: '#111827', fontSize: 16 }}>{formatIsoAsDisplayDate(startDate) || 'Select start date'}</Text>
            <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{startDate || 'YYYY-MM-DD'}</Text>
          </Pressable>
        ) : (
          <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }} />
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: '#111827', fontWeight: '700' }}>Duration</Text>
        <TextInput value={daysCount} onChangeText={setDaysCount} placeholder="1-14" keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: '#111827', fontWeight: '700' }}>Cover photo</Text>
        <TextInput value={coverQuery} onChangeText={setCoverQuery} placeholder="Search cover photo" style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff' }} />
        <PrimaryButton title={coverLoading ? 'Finding...' : 'Find Photos'} onPress={runCoverSearch} disabled={coverLoading} variant="outline" />
        {coverError ? <Text style={{ color: '#dc2626', fontSize: 12 }}>{coverError}</Text> : null}
        {coverPhoto ? (
          <View style={{ width: '100%', height: 150, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#d4d4d8' }}>
            <Image source={{ uri: coverPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ) : null}
        {coverResults.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {coverResults.map((uri, idx) => (
              <Pressable key={`${uri}-${idx}`} onPress={() => setCoverPhoto(uri)} style={{ width: 90, height: 90, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: coverPhoto === uri ? '#111827' : '#d4d4d8' }}>
                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}
