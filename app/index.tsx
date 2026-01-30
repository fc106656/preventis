// Redirection conditionnelle basée sur le mode et l'authentification
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useDataMode } from '../src/context/DataModeContext';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { isDemo, isInitialized } = useDataMode();
  const { isAuthenticated, loading } = useAuth();

  // Attendre que l'auth et le mode soient chargés avant de rediriger
  if (loading || !isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // En mode démo, toujours rediriger vers les tabs
  if (isDemo) {
    return <Redirect href="/(tabs)" />;
  }

  // En mode réel, rediriger vers login si non authentifié
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Sinon, rediriger vers les tabs
  return <Redirect href="/(tabs)" />;
}
