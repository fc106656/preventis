// Redirection conditionnelle basée sur le mode et l'authentification
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useDataMode } from '../src/context/DataModeContext';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { isDemo, isInitialized } = useDataMode();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Debug: log pour voir ce qui se passe
  useEffect(() => {
    console.log('Index render:', { isDemo, isInitialized, isAuthenticated, loading, segments, hasRedirected });
  }, [isDemo, isInitialized, isAuthenticated, loading, segments, hasRedirected]);

  // Redirection une fois que tout est chargé
  useEffect(() => {
    if (loading || !isInitialized || hasRedirected) return;

    const currentPath = segments.join('/');
    
    // Ne rediriger que si on est sur la route index
    if (currentPath === '' || currentPath === 'index') {
      if (isDemo) {
        console.log('Redirecting to tabs (demo mode)');
        router.replace('/(tabs)');
        setHasRedirected(true);
      } else if (!isAuthenticated) {
        console.log('Redirecting to login (not authenticated)');
        router.replace('/login');
        setHasRedirected(true);
      } else {
        console.log('Redirecting to tabs (authenticated)');
        router.replace('/(tabs)');
        setHasRedirected(true);
      }
    }
  }, [isDemo, isInitialized, isAuthenticated, loading, segments, router, hasRedirected]);

  // Attendre que l'auth et le mode soient chargés avant de rediriger
  if (loading || !isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textPrimary, marginTop: 16 }}>
          Chargement... {loading ? 'Auth' : ''} {!isInitialized ? 'Mode' : ''}
        </Text>
      </View>
    );
  }

  // Afficher quelque chose pendant la redirection
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.textPrimary, marginTop: 16 }}>Redirection...</Text>
    </View>
  );
}
