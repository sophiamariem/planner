import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import { getCurrentUser, listMyTrips, loadCloudTripById, signOut } from './src/lib/cloudTripsMobile';
import { setSessionFromUrl } from './src/lib/supabaseMobile';

export default function App() {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(false);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f5' }}>
      <View style={{ flex: 1, padding: 16 }}>
        {user ? (
          <HomeScreen
            user={user}
            trips={trips}
            selectedTrip={selectedTrip}
            loading={loading}
            onRefresh={refreshSessionAndData}
            onSelectTrip={handleOpenTrip}
            onSignOut={handleSignOut}
          />
        ) : (
          <AuthScreen
            onAuthStarted={refreshSessionAndData}
            onToast={pushToast}
          />
        )}
      </View>

      {toast ? (
        <View style={{ position: 'absolute', bottom: 22, left: 20, right: 20 }}>
          <View style={{ borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 12, backgroundColor: '#ffffff', padding: 12 }}>
            <Text style={{ color: '#18181b', textAlign: 'center' }}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
