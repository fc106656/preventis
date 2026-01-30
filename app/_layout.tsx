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
    // Attendre que les segments soient disponibles (router monté)
    if (segments.length === 0) return;

    // En mode démo, toujours permettre l'accès aux tabs (pas besoin d'attendre l'auth)
    if (isDemo) {
      const inTabsGroup = segments[0] === '(tabs)';
      if (!inTabsGroup) {
        // Utiliser requestAnimationFrame pour s'assurer que le router est prêt
        requestAnimationFrame(() => {
          router.replace('/(tabs)');
        });
      }
      return;
    }

    // En mode réel, attendre le chargement de l'auth
    if (loading) return;

    const inAuthGroup = segments[0] === 'login';
    const inTabsGroup = segments[0] === '(tabs)';

    // En mode réel, rediriger vers login si non authentifié
    if (!isAuthenticated && !inAuthGroup) {
      requestAnimationFrame(() => {
        router.replace('/login');
      });
    } else if (isAuthenticated && inAuthGroup) {
      // Si authentifié et sur login, aller vers les tabs
      if (!inTabsGroup) {
        requestAnimationFrame(() => {
          router.replace('/(tabs)');
        });
      }
    }
  }, [isAuthenticated, loading, isDemo, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataModeProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
          </Stack>
          <NavigationHandler />
        </AuthProvider>
      </DataModeProvider>
    </SafeAreaProvider>
  );
}
