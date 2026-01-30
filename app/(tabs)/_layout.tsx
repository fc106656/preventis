// Layout pour les tabs (écrans principaux)
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataModeBadge } from '../../src/components/DataModeToggle';

const colors = {
  background: '#0D1117',
  cardBackground: '#161B22',
  primary: '#58A6FF',
  textMuted: '#6E7681',
  danger: '#F85149',
};

export default function TabsLayout() {
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
        headerTintColor: '#F0F6FC',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
        headerRight: () => <DataModeBadge />,
        headerRightContainerStyle: {
          paddingRight: 16,
        },
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: '#30363D',
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
