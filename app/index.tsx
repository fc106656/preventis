// Redirection conditionnelle basée sur le mode et l'authentification
import { Redirect } from 'expo-router';
import { useDataMode } from '../src/context/DataModeContext';
import { useAuth } from '../src/context/AuthContext';

export default function Index() {
  const { isDemo } = useDataMode();
  const { isAuthenticated } = useAuth();

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
