import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { StatCard, SensorCard, AlertCard, StatusBadge } from '../src/components';
import { useSensors, useAlerts, useStats, useAlarm } from '../src/hooks/useData';
import { useDataMode } from '../src/context/DataModeContext';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 400;

export default function DashboardScreen() {
  const { isDemo } = useDataMode();
  const { sensors, loading: sensorsLoading, refresh: refreshSensors } = useSensors();
  const { alerts, loading: alertsLoading, refresh: refreshAlerts } = useAlerts();
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats();
  const { alarmState, refresh: refreshAlarm } = useAlarm();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshSensors(),
      refreshAlerts(),
      refreshStats(),
      refreshAlarm(),
    ]);
    setRefreshing(false);
  };

  // Filtrer les alertes non acquittées
  const activeAlerts = alerts.filter((a) => !a.acknowledged);

  // Capteurs critiques (warning ou alert)
  const criticalSensors = sensors.filter(
    (s) => s.status === 'warning' || s.status === 'WARNING' || 
           s.status === 'alert' || s.status === 'ALERT'
  );

  const getModeLabel = (mode: string) => {
    const m = mode?.toLowerCase();
    switch (m) {
      case 'off': return 'Désactivé';
      case 'home': return 'Maison';
      case 'away': return 'Absent';
      case 'night': return 'Nuit';
      default: return mode;
    }
  };

  // Compter les capteurs par statut
  const onlineSensors = sensors.filter(
    (s) => s.status === 'online' || s.status === 'ONLINE'
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Status */}
        <View style={styles.headerStatus}>
          <View style={styles.systemStatus}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: alarmState.isArmed ? colors.success : colors.textMuted },
              ]}
            />
            <Text style={styles.systemStatusText}>
              {alarmState.isArmed ? 'Système armé' : 'Système désarmé'}
            </Text>
            <StatusBadge
              status={alarmState.isArmed ? 'online' : 'offline'}
              size="small"
            />
          </View>
          <Text style={styles.lastUpdate}>
            Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
            {isDemo && ' (démo)'}
          </Text>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          <StatCard
            title="Capteurs actifs"
            value={`${onlineSensors}/${sensors.length}`}
            subtitle="En ligne"
            icon="hardware-chip"
            color={colors.success}
          />
          <StatCard
            title="Alertes actives"
            value={activeAlerts.length}
            subtitle="Non acquittées"
            icon="warning"
            color={activeAlerts.length > 0 ? colors.warning : colors.success}
            trend={activeAlerts.length > 0 ? 'up' : 'stable'}
          />
          <StatCard
            title="Mode actuel"
            value={getModeLabel(alarmState.mode)}
            subtitle="Alarme"
            icon="shield-checkmark"
            color={colors.primary}
          />
          <StatCard
            title="Dernier incident"
            value={stats.lastIncident ? '1j' : '-'}
            subtitle={stats.lastIncident ? 'Il y a' : 'Aucun'}
            icon="time"
            color={colors.info}
          />
        </ScrollView>

        {/* Empty State */}
        {sensors.length === 0 && !sensorsLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune donnée</Text>
            <Text style={styles.emptySubtitle}>
              {isDemo ? 'Données de démonstration non disponibles' : 'Impossible de charger les données depuis l\'API'}
            </Text>
          </View>
        )}

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="warning" size={18} color={colors.warning} /> Alertes
                actives
              </Text>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{activeAlerts.length}</Text>
              </View>
            </View>
            {activeAlerts.slice(0, 3).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={{
                  ...alert,
                  timestamp: new Date(alert.timestamp || alert.createdAt),
                }}
              />
            ))}
          </>
        )}

        {/* Critical Sensors */}
        {criticalSensors.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />{' '}
              Capteurs à surveiller
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sensorsContainer}
            >
              {criticalSensors.map((sensor) => (
                <View key={sensor.id} style={styles.sensorWrapper}>
                  <SensorCard sensor={{
                    ...sensor,
                    status: sensor.status?.toLowerCase() as any,
                    type: sensor.type?.toLowerCase() as any,
                    lastUpdate: new Date(sensor.lastUpdate || sensor.updatedAt),
                  }} />
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Quick Status */}
        {sensors.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>État des capteurs</Text>
            <View style={styles.zonesGrid}>
              {sensors.slice(0, 4).map((sensor) => (
                <QuickSensorStatus
                  key={sensor.id}
                  name={sensor.name}
                  location={sensor.location}
                  status={sensor.status?.toLowerCase() as any}
                />
              ))}
            </View>
          </>
        )}

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant pour le statut rapide des capteurs
function QuickSensorStatus({
  name,
  location,
  status,
}: {
  name: string;
  location: string;
  status: 'online' | 'offline' | 'warning' | 'alert';
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'alert':
        return colors.danger;
      case 'offline':
      default:
        return colors.textMuted;
    }
  };

  return (
    <View style={styles.zoneCard}>
      <View style={[styles.zoneIndicator, { backgroundColor: getStatusColor() }]} />
      <View style={styles.zoneInfo}>
        <Text style={styles.zoneName} numberOfLines={1}>{name}</Text>
        <Text style={styles.zoneSensors}>{location}</Text>
      </View>
      <Ionicons
        name={status === 'online' ? 'checkmark-circle' : 'alert-circle'}
        size={20}
        color={getStatusColor()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerStatus: {
    marginBottom: 24,
  },
  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  systemStatusText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  lastUpdate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  alertBadge: {
    backgroundColor: colors.warningBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  alertBadgeText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  statsContainer: {
    gap: 12,
    paddingRight: 16,
    marginBottom: 8,
  },
  sensorsContainer: {
    gap: 12,
    paddingRight: 16,
    marginBottom: 8,
  },
  sensorWrapper: {
    width: isSmallScreen ? 160 : 180,
  },
  zonesGrid: {
    gap: 8,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  zoneIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  zoneSensors: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    height: 20,
  },
});
