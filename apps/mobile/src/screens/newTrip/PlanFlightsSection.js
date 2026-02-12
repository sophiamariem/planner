import React from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import S from './uiStyles';

export default function PlanFlightsSection({
  flights,
  moveFlight,
  updateFlight,
  setFlights,
  openFlightDatePicker,
  openFlightTimePicker,
  addFlight,
  formatIsoAsDisplayDate,
}) {
  return (
    <>
      <Text style={S.label}>Flights</Text>
      <Text style={S.mutedTextSmall}>Use arrows to reorder flights.</Text>
      {flights.length === 0 ? <Text style={S.emptyTextSmall}>No flights yet.</Text> : null}
      {flights.map((item, index) => (
        <View key={item._key || `flight-${index}`} style={S.itemCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={S.labelSmall}>Flight {index + 1}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable onPress={() => moveFlight(index, index - 1)} disabled={index === 0} style={[S.arrowButton, { opacity: index === 0 ? 0.35 : 1 }]}>
                <Text style={S.arrowButtonText}>↑</Text>
              </Pressable>
              <Pressable onPress={() => moveFlight(index, index + 1)} disabled={index === flights.length - 1} style={[S.arrowButton, { opacity: index === flights.length - 1 ? 0.35 : 1 }]}>
                <Text style={S.arrowButtonText}>↓</Text>
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput value={item.from} onChangeText={(value) => updateFlight(index, { from: value })} placeholder="From" style={[S.input10, { flex: 1 }]} />
            <TextInput value={item.to} onChangeText={(value) => updateFlight(index, { to: value })} placeholder="To" style={[S.input10, { flex: 1 }]} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Platform.OS === 'android' ? (
              <Pressable onPress={() => openFlightDatePicker(index)} style={[S.input10, { flex: 1, justifyContent: 'center' }]}>
                <Text style={{ color: '#111827', fontSize: 14 }}>{formatIsoAsDisplayDate(item.date) || 'Flight date'}</Text>
                <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{item.date || 'YYYY-MM-DD'}</Text>
              </Pressable>
            ) : (
              <TextInput value={item.date} onChangeText={(value) => updateFlight(index, { date: value })} placeholder="Date (YYYY-MM-DD)" style={[S.input10, { flex: 1 }]} />
            )}
            <TextInput value={item.flightNo} onChangeText={(value) => updateFlight(index, { flightNo: value })} placeholder="Flight No" style={[S.input10, { flex: 1 }]} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Platform.OS === 'android' ? (
              <>
                <Pressable onPress={() => openFlightTimePicker(index, 'departTime')} style={[S.input10, { flex: 1, justifyContent: 'center' }]}>
                  <Text style={{ color: '#111827', fontSize: 14 }}>{item.departTime || 'Departure time'}</Text>
                </Pressable>
                <Pressable onPress={() => openFlightTimePicker(index, 'arriveTime')} style={[S.input10, { flex: 1, justifyContent: 'center' }]}>
                  <Text style={{ color: '#111827', fontSize: 14 }}>{item.arriveTime || 'Arrival time'}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <TextInput value={item.departTime} onChangeText={(value) => updateFlight(index, { departTime: value })} placeholder="Depart (HH:mm)" style={[S.input10, { flex: 1 }]} />
                <TextInput value={item.arriveTime} onChangeText={(value) => updateFlight(index, { arriveTime: value })} placeholder="Arrive (HH:mm)" style={[S.input10, { flex: 1 }]} />
              </>
            )}
          </View>
          <Pressable onPress={() => setFlights((prev) => prev.filter((_, i) => i !== index))}>
            <Text style={{ color: '#b91c1c', fontWeight: '700', fontSize: 12 }}>Remove flight</Text>
          </Pressable>
        </View>
      ))}
      <PrimaryButton title="Add Flight" onPress={addFlight} variant="outline" />
    </>
  );
}
