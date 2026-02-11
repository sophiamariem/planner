import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewTripScreen from './src/screens/NewTripScreen';
import TripViewScreen from './src/screens/TripViewScreen';
import BottomSheet from './src/components/BottomSheet';
import { getCurrentUser, listMyTrips, loadCloudTripById, saveTripToCloud, signOut, updateCloudTripById } from './src/lib/cloudTripsMobile';
import { setSessionFromUrl } from './src/lib/supabaseMobile';

export default function App() {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [editingTrip, setEditingTrip] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState('');

  const pushToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const refreshSessionAndData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const rows = await listMyTrips();
        setTrips(rows || []);
      } else {
        setTrips([]);
      }
    } catch (error) {
      pushToast(error.message || 'Failed to refresh session.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const initialUrl = await Linking.getInitialURL();
      await setSessionFromUrl(initialUrl);
      await refreshSessionAndData();
    };

    init();

    const sub = Linking.addEventListener('url', async ({ url }) => {
      const stored = await setSessionFromUrl(url);
      if (stored) {
        pushToast('Signed in successfully.');
        await refreshSessionAndData();
      }
    });

    return () => {
      sub.remove();
    };
  }, [refreshSessionAndData]);

  const handleOpenTrip = async (id) => {
    try {
      const row = await loadCloudTripById(id);
      setSelectedTrip(row);
    } catch (error) {
      pushToast(error.message || 'Could not open trip.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setTrips([]);
    setSelectedTrip(null);
    pushToast('Signed out.');
  };

  const handleCreateTrip = async (tripData) => {
    setCreateSaving(true);
    try {
      const row = await saveTripToCloud(tripData, 'private');
      pushToast('Trip created.');
      setCreatingTrip(false);
      await refreshSessionAndData();
      setSelectedTrip(row);
    } catch (error) {
      pushToast(error.message || 'Could not create trip.');
    } finally {
      setCreateSaving(false);
    }
  };

  const handleEditTrip = async (tripData) => {
    if (!selectedTrip?.id) return;

    setEditSaving(true);
    try {
      const row = await updateCloudTripById(selectedTrip.id, tripData, selectedTrip.visibility || 'private');
      setSelectedTrip(row);
      setEditingTrip(false);
      pushToast('Trip updated.');
      await refreshSessionAndData();
    } catch (error) {
      pushToast(error.message || 'Could not update trip.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260, backgroundColor: '#dbeafe' }} />
        <View style={{ position: 'absolute', top: 180, left: -80, width: 240, height: 240, borderRadius: 999, backgroundColor: '#e0e7ff' }} />
        <View style={{ position: 'absolute', top: 90, right: -70, width: 210, height: 210, borderRadius: 999, backgroundColor: '#dcfce7' }} />

        <View style={{ flex: 1, padding: 16 }}>
          {user ? (
            selectedTrip ? (
              <TripViewScreen
                tripRow={selectedTrip}
                onBack={() => setSelectedTrip(null)}
                onEdit={() => setEditingTrip(true)}
                onToast={pushToast}
              />
            ) : (
              <HomeScreen
                user={user}
                trips={trips}
                loading={loading}
                onRefresh={refreshSessionAndData}
                onSelectTrip={handleOpenTrip}
                onSignOut={handleSignOut}
                onCreateNew={() => setCreatingTrip(true)}
              />
            )
          ) : (
            <AuthScreen
              onAuthStarted={refreshSessionAndData}
              onToast={pushToast}
            />
          )}
        </View>

      <BottomSheet visible={Boolean(user && creatingTrip)} onClose={() => setCreatingTrip(false)} scrollable>
          <NewTripScreen
            submitting={createSaving}
            onCancel={() => setCreatingTrip(false)}
            onSubmit={handleCreateTrip}
            mode="create"
          />
        </BottomSheet>

      <BottomSheet visible={Boolean(user && editingTrip && selectedTrip)} onClose={() => setEditingTrip(false)} scrollable>
          <NewTripScreen
            submitting={editSaving}
            onCancel={() => setEditingTrip(false)}
            onSubmit={handleEditTrip}
            mode="edit"
            initialTripData={selectedTrip?.trip_data || null}
          />
        </BottomSheet>

        {toast ? (
          <View style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}>
            <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#ffffff', padding: 12, shadowColor: '#111827', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}>
              <Text style={{ color: '#111827', textAlign: 'center', fontWeight: '600' }}>{toast}</Text>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
