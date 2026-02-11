import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';

export default function BottomSheet({ visible, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.42)' }} />
          <View
            style={{
              backgroundColor: '#fcfcfd',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 18,
              paddingTop: 12,
              paddingBottom: 24,
              maxHeight: '90%',
              borderWidth: 1.2,
              borderColor: '#e5e7eb',
              shadowColor: '#0f172a',
              shadowOpacity: 0.16,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: -6 },
              elevation: 12,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <View style={{ width: 46, height: 5, borderRadius: 999, backgroundColor: '#cbd5e1' }} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
