import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DataModeProvider } from '../src/context/DataModeContext';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataModeProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
          </Stack>
        </AuthProvider>
      </DataModeProvider>
    </SafeAreaProvider>
  );
}
