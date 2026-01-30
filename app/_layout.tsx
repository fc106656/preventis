import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DataModeProvider, useDataMode } from '../src/context/DataModeContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';

// Composant pour gérer la navigation conditionnelle
function NavigationHandler() {
  const { isAuthenticated, loading } = useAuth();
  const { isDemo } = useDataMode();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Attendre le chargement de l'auth

    const inAuthGroup = segments[0] === 'login';
    const inTabsGroup = segments[0] === '(tabs)';

    // En mode démo, toujours permettre l'accès aux tabs
    if (isDemo) {
      if (!inTabsGroup) {
        router.replace('/(tabs)');
      }
      return;
    }

    // En mode réel, rediriger vers login si non authentifié
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Si authentifié et sur login, aller vers les tabs
      if (!inTabsGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, loading, isDemo, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataModeProvider>
          <NavigationHandler />
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </DataModeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
