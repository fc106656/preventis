// Dashboard - Écran principal
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatCard, AlertCard, SensorCard } from '../../src/components';
import { useDataMode } from '../../src/context/DataModeContext';
import { useStats, useSensors, useAlerts, useAlarm } from '../../src/hooks/useData';
import { colors } from '../../src/theme/colors';

console.log('📊 (tabs)/index.tsx: Loading');

export default function DashboardScreen() {
  console.log('📊 (tabs)/index.tsx: Rendering');
  const { isDemo } = useDataMode();
  const router = useRouter();
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats();
  const { sensors, loading: sensorsLoading, refresh: refreshSensors } = useSensors();
  const { alerts, loading: alertsLoading, refresh: refreshAlerts } = useAlerts();
  const { alarmState } = useAlarm();
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshStats(), refreshSensors(), refreshAlerts()]);
    setRefreshing(false);
  };

  const loading = statsLoading || sensorsLoading || alertsLoading;

  // Capteurs en alerte ou avec warning
  const criticalSensors = sensors.filter(
    (s) => s.status?.toLowerCase() === 'alert' || s.status?.toLowerCase() === 'warning'
  ).slice(0, 3);

  // Alertes récentes non acquittées
  const recentAlerts = alerts
    .filter((a) => !a.acknowledged)
    .sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt || 0);
      const dateB = new Date(b.timestamp || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);

  // Calculer le pourcentage de capteurs en ligne
  const onlinePercentage =
    stats.totalSensors > 0
      ? Math.round((stats.onlineSensors / stats.totalSensors) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header avec état de l'alarme */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>
              {isDemo ? 'Mode démonstration' : 'Système en ligne'}
            </Text>
          </View>
          <View style={styles.alarmStatus}>
            <View
              style={[
                styles.alarmDot,
                {
                  backgroundColor: alarmState.isArmed
                    ? colors.danger
                    : colors.success,
                },
              ]}
            />
            <Text style={styles.alarmText}>
              {alarmState.isArmed ? 'ARMÉ' : 'DÉSARMÉ'}
            </Text>
          </View>
        </View>

        {/* Stats principales */}
        {loading && !stats.totalSensors ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement des statistiques...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              title="Capteurs"
              value={stats.totalSensors.toString()}
              subtitle={`${stats.onlineSensors} en ligne (${onlinePercentage}%)`}
              icon="hardware-chip"
              color={colors.primary}
              trend={stats.onlineSensors === stats.totalSensors ? 'stable' : 'down'}
            />
            <StatCard
              title="Alertes actives"
              value={stats.activeAlerts.toString()}
              subtitle={stats.activeAlerts > 0 ? 'Action requise' : 'Aucune alerte'}
              icon="notifications"
              color={stats.activeAlerts > 0 ? colors.danger : colors.success}
              trend={stats.activeAlerts > 0 ? 'up' : 'stable'}
            />
            <StatCard
              title="Système"
              value={alarmState.isArmed ? 'ARMÉ' : 'OK'}
              subtitle={
                alarmState.mode
                  ? `Mode ${alarmState.mode.toUpperCase()}`
                  : 'Système opérationnel'
              }
              icon="shield-checkmark"
              color={alarmState.isArmed ? colors.danger : colors.success}
            />
            {stats.lastIncident && (
              <StatCard
                title="Dernier incident"
                value={new Date(stats.lastIncident).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                })}
                subtitle={new Date(stats.lastIncident).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                icon="time"
                color={colors.warning}
              />
            )}
          </View>
        )}

        {/* Capteurs critiques */}
        {criticalSensors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Capteurs en alerte</Text>
              <Pressable onPress={() => router.push('/(tabs)/sensors')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </Pressable>
            </View>
            <View style={styles.sensorsList}>
              {criticalSensors.map((sensor) => (
                <SensorCard
                  key={sensor.id}
                  sensor={{
                    ...sensor,
                    status: sensor.status?.toLowerCase() as any,
                    type: sensor.type?.toLowerCase() as any,
                    lastUpdate: new Date(sensor.lastUpdate || sensor.updatedAt || Date.now()),
                  }}
                  onPress={() => router.push('/(tabs)/sensors')}
                />
              ))}
            </View>
          </View>
        )}

        {/* Alertes récentes */}
        {recentAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alertes récentes</Text>
              <Pressable onPress={() => router.push('/(tabs)/alerts')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </Pressable>
            </View>
            <View style={styles.alertsList}>
              {recentAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={{
                    ...alert,
                    type: alert.type?.toLowerCase() as any,
                    level: alert.level?.toLowerCase() as any,
                    timestamp: new Date(alert.timestamp || alert.createdAt || Date.now()),
                  }}
                  onAcknowledge={() => {}}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty state si pas d'alertes ni de capteurs critiques */}
        {!loading &&
          criticalSensors.length === 0 &&
          recentAlerts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={colors.success}
              />
              <Text style={styles.emptyTitle}>Tout est normal</Text>
              <Text style={styles.emptySubtitle}>
                Aucun capteur en alerte et aucune alerte active
              </Text>
            </View>
          )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/alarm')}
            >
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={styles.quickActionText}>Alarme</Text>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/sensors')}
            >
              <Ionicons name="hardware-chip" size={24} color={colors.primary} />
              <Text style={styles.quickActionText}>Capteurs</Text>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/alerts')}
            >
              <Ionicons name="notifications" size={24} color={colors.primary} />
              <Text style={styles.quickActionText}>Alertes</Text>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Ionicons name="settings" size={24} color={colors.primary} />
              <Text style={styles.quickActionText}>Réglages</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: Platform.OS === 'web' ? 90 : 16, // Espace pour le tab bar sur web
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  alarmStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  alarmDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alarmText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  sensorsList: {
    gap: 12,
  },
  alertsList: {
    gap: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    marginVertical: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  footer: {
    height: 20,
  },
});
