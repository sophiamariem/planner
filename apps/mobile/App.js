import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, StatusBar, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewTripScreen from './src/screens/NewTripScreen';
import TripViewScreen from './src/screens/TripViewScreen';
import BottomSheet from './src/components/BottomSheet';
import { deleteCloudTripById, getCurrentUser, listMyTrips, loadCloudTripById, saveTripToCloud, signOut, updateCloudTripById } from './src/lib/cloudTripsMobile';
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
  const [toast, setToast] = useState({ message: '', tone: 'info' });

  const toSafeUserMessage = (message, fallback = 'Something went wrong. Please try again.') => {
    const raw = String(message || '').trim();
    if (!raw) return fallback;
    const lower = raw.toLowerCase();
    if (
      lower.includes('supabase') ||
      lower.includes('expo_public_') ||
      lower.includes('react_app_') ||
      lower.includes('jwt') ||
      lower.includes('token') ||
      lower.includes('postgres') ||
      lower.includes('sql') ||
      lower.includes('schema') ||
      lower.includes('relation') ||
      lower.includes('policy') ||
      lower.includes('unsupported provider') ||
      lower.includes('provider is not enabled')
    ) {
      return fallback;
    }
    return raw;
  };

  const pushToast = (msg, tone = 'info') => {
    setToast({ message: toSafeUserMessage(msg), tone });
    setTimeout(() => setToast({ message: '', tone: 'info' }), 2600);
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
      pushToast(error.message || 'Failed to refresh session.', 'error');
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
        pushToast('Signed in successfully.', 'success');
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
      pushToast(error.message || 'Could not open trip.', 'error');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setTrips([]);
    setSelectedTrip(null);
    pushToast('Signed out.', 'success');
  };

  const handleCreateTrip = async (tripData) => {
    setCreateSaving(true);
    try {
      const row = await saveTripToCloud(tripData, 'private');
      pushToast('Trip created.', 'success');
      setCreatingTrip(false);
      await refreshSessionAndData();
      setSelectedTrip(row);
    } catch (error) {
      pushToast(error.message || 'Could not create trip.', 'error');
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
      pushToast('Trip updated.', 'success');
      await refreshSessionAndData();
    } catch (error) {
      pushToast(error.message || 'Could not update trip.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteTrip = () => {
    if (!selectedTrip?.id) return;
    Alert.alert(
      'Delete Trip',
      'This will permanently delete this trip from your saved trips.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCloudTripById(selectedTrip.id);
              setSelectedTrip(null);
              await refreshSessionAndData();
              pushToast('Trip deleted.', 'success');
            } catch (error) {
              pushToast(error.message || 'Could not delete trip.', 'error');
            }
          },
        },
      ],
    );
  };

  const handleDeleteTripFromList = (trip) => {
    const tripId = trip?.id;
    if (!tripId) return;
    Alert.alert(
      'Delete Trip',
      'This will permanently delete this trip from your saved trips.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCloudTripById(tripId);
              if (selectedTrip?.id === tripId) {
                setSelectedTrip(null);
              }
              await refreshSessionAndData();
              pushToast('Trip deleted.', 'success');
            } catch (error) {
              pushToast(error.message || 'Could not delete trip.', 'error');
            }
          },
        },
      ],
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#eff6ff" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#eff6ff' }}>
        <LinearGradient
          colors={['#eff6ff', '#f3e8ff', '#fce7f3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <View style={{ flex: 1, padding: 16 }}>
          {user ? (
            selectedTrip ? (
              <TripViewScreen
                tripRow={selectedTrip}
                onBack={() => setSelectedTrip(null)}
                onEdit={() => setEditingTrip(true)}
                onDelete={handleDeleteTrip}
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
                onDeleteTrip={handleDeleteTripFromList}
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

        {toast.message ? (
          <View style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: toast.tone === 'success' ? '#a7f3d0' : toast.tone === 'error' ? '#fecaca' : '#e5e7eb',
                borderRadius: 14,
                backgroundColor: toast.tone === 'success' ? '#ecfdf5' : toast.tone === 'error' ? '#fef2f2' : '#ffffff',
                padding: 12,
                shadowColor: '#111827',
                shadowOpacity: 0.14,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 3 },
                elevation: 4,
              }}
            >
              <Text style={{ color: toast.tone === 'success' ? '#065f46' : toast.tone === 'error' ? '#991b1b' : '#111827', textAlign: 'center', fontWeight: '600' }}>
                {toast.message}
              </Text>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
