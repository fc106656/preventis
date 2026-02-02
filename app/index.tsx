// Redirection conditionnelle basée sur le mode et l'authentification
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useDataMode } from '../src/context/DataModeContext';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

console.log('🟢 index.tsx: Module loaded');

export default function Index() {
  console.log('🟢 index.tsx: Component rendering');
  
  let isDemo = false;
  let isInitialized = false;
  let isAuthenticated = false;
  let loading = true;
  
  try {
    const dataMode = useDataMode();
    const auth = useAuth();
    
    isDemo = dataMode.isDemo;
    isInitialized = dataMode.isInitialized;
    isAuthenticated = auth.isAuthenticated;
    loading = auth.loading;
    
    console.log('🟢 index.tsx: State:', {
      isDemo,
      isInitialized,
      isAuthenticated,
      loading,
    });
  } catch (error) {
    console.error('❌ index.tsx: Error getting context:', error);
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>Erreur de chargement</Text>
        <Text style={{ color: '#f00', fontSize: 12 }}>{String(error)}</Text>
      </View>
    );
  }

  // Attendre que l'auth et le mode soient chargés avant de rediriger
  if (loading || !isInitialized) {
    console.log('🟢 index.tsx: Showing loader');
    return (
      <View style={{ flex: 1, backgroundColor: colors?.background || '#0D1117', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors?.primary || '#007AFF'} />
        <Text style={{ color: colors?.textPrimary || '#fff', marginTop: 16 }}>
          {loading ? 'Chargement...' : 'Initialisation...'}
        </Text>
      </View>
    );
  }

  // En mode démo, toujours rediriger vers les tabs
  if (isDemo) {
    console.log('🟢 index.tsx: Redirecting to /(tabs) (demo mode)');
    return <Redirect href="/(tabs)" />;
  }

  // En mode réel, rediriger vers login si non authentifié
  if (!isAuthenticated) {
    console.log('🟢 index.tsx: Mode réel mais non authentifié, redirecting to /login');
    return <Redirect href="/login" />;
  }

  // En mode réel et authentifié, rediriger vers les tabs
  console.log('🟢 index.tsx: Redirecting to /(tabs) (real mode, authenticated)');
  return <Redirect href="/(tabs)" />;
}
