import { StyleSheet } from 'react-native';

const S = StyleSheet.create({
  sectionCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentedButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    color: '#111827',
    fontWeight: '700',
  },
  labelSmall: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
  },
  mutedTextSmall: {
    color: '#6b7280',
    fontSize: 12,
  },
  emptyTextSmall: {
    color: '#71717a',
    fontSize: 12,
  },
  input10: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  input12: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  arrowButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  arrowButtonText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 14,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
  },
});

export default S;
