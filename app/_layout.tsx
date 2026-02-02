import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { DataModeProvider } from '../src/context/DataModeContext';
import { AlertProvider } from '../src/components/AlertModal';

console.log('🔵 _layout.tsx: Rendering RootLayout');

export default function RootLayout() {
  console.log('🔵 _layout.tsx: RootLayout component executing');
  
  try {
    return (
      <SafeAreaProvider>
        <AuthProvider>
          <DataModeProvider>
            <AlertProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }} />
            </AlertProvider>
          </DataModeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    );
  } catch (error) {
    console.error('❌ _layout.tsx: Error in RootLayout:', error);
    throw error;
  }
}
