// Layout pour les tabs (écrans principaux)
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, Linking } from 'react-native';
import { useDataMode } from '../../src/context/DataModeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';

console.log('📑 (tabs)/_layout.tsx: Loading');

// Composant DataModeBadge simplifié pour éviter les erreurs
function DataModeBadge() {
  console.log('📑 DataModeBadge: Rendering');
  try {
    const { isDemo, toggleMode } = useDataMode();
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    const handleToggle = () => {
      console.log('🟣 DataModeBadge (tabs): handleToggle called, isDemo:', isDemo, 'isAuthenticated:', isAuthenticated);
      if (isDemo && !isAuthenticated) {
        console.log('🟣 DataModeBadge (tabs): Not authenticated, redirecting to login');
        // Utiliser replace pour éviter que index.tsx n'intercepte la navigation
        router.replace('/login');
        return;
      }
      console.log('🟣 DataModeBadge (tabs): Toggling mode');
      toggleMode();
    };

    return (
      <Pressable onPress={handleToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.backgroundTertiary }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isDemo ? colors.warning : colors.success }} />
        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
          {isDemo ? 'DÉMO' : 'LIVE'}
        </Text>
      </Pressable>
    );
  } catch (error) {
    console.error('❌ DataModeBadge: Error:', error);
    return (
      <View style={{ padding: 8 }}>
        <Text style={{ color: colors.danger, fontSize: 10 }}>Error</Text>
      </View>
    );
  }
}

export default function TabsLayout() {
  console.log('📑 (tabs)/_layout.tsx: Rendering');
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => Linking.openURL('https://preventis.stark-server.fr/documentation/')}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: colors.backgroundTertiary,
              }}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
            </Pressable>
            <DataModeBadge />
          </View>
        ),
        headerRightContainerStyle: {
          paddingRight: 16,
        },
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerTitle: 'Preventis',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sensors"
        options={{
          title: 'Capteurs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertes',
          tabBarIcon: ({ color, size }) => (
            <TabBarIconWithBadge
              name="notifications"
              size={size}
              color={color}
              badgeCount={2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="alarm"
        options={{
          title: 'Alarme',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Composant pour l'icône avec badge
function TabBarIconWithBadge({
  name,
  size,
  color,
  badgeCount,
}: {
  name: any;
  size: number;
  color: string;
  badgeCount: number;
}) {
  const { View } = require('react-native');
  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name={name} size={size} color={color} />
      {badgeCount > 0 && (
        <View style={{ position: 'absolute', top: -2, right: -6 }}>
          <Ionicons name="ellipse" size={10} color={colors.danger} />
        </View>
      )}
    </View>
  );
}
