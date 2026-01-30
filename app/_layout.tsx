import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { DataModeProvider } from '../src/context/DataModeContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataModeProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </DataModeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
