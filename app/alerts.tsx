import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { AlertCard } from '../src/components';
import { useAlerts } from '../src/hooks/useData';
import { useDataMode } from '../src/context/DataModeContext';
import { AlertType } from '../src/types';

type FilterType = 'all' | 'active' | 'acknowledged';

export default function AlertsScreen() {
  const { isDemo } = useDataMode();
  const { alerts, loading, error, refresh, acknowledgeAlert, acknowledgeAll } = useAlerts();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'active') return !alert.acknowledged;
    if (filter === 'acknowledged') return alert.acknowledged;
    return true;
  });

  const activeCount = alerts.filter((a) => !a.acknowledged).length;
  const acknowledgedCount = alerts.filter((a) => a.acknowledged).length;

  const getAlertTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'FIRE': return 'flame';
      case 'INTRUSION': return 'shield-checkmark';
      case 'SYSTEM': return 'settings';
      default: return 'alert-circle';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'FIRE': return 'Incendie';
      case 'INTRUSION': return 'Intrusion';
      case 'SYSTEM': return 'Système';
      default: return type;
    }
  };

  // Grouper les alertes par type
  const alertsByType = alerts.reduce((acc, alert) => {
    const type = alert.type?.toUpperCase() || 'SYSTEM';
    if (!acc[type]) acc[type] = [];
    acc[type].push(alert);
    return acc;
  }, {} as Record<string, any[]>);

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
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, activeCount > 0 && styles.summaryCardActive]}>
            <Ionicons name="alert-circle" size={24} color={activeCount > 0 ? colors.warning : colors.textMuted} />
            <Text style={styles.summaryValue}>{activeCount}</Text>
            <Text style={styles.summaryLabel}>Actives</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.summaryValue}>{acknowledgedCount}</Text>
            <Text style={styles.summaryLabel}>Acquittées</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="time" size={24} color={colors.info} />
            <Text style={styles.summaryValue}>{alerts.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        {/* Quick Stats by Type */}
        {Object.keys(alertsByType).length > 0 && (
          <View style={styles.typeStats}>
            {Object.keys(alertsByType).map((type) => (
              <View key={type} style={styles.typeStatItem}>
                <View
                  style={[
                    styles.typeIcon,
                    {
                      backgroundColor:
                        type === 'FIRE'
                          ? colors.dangerBg
                          : type === 'INTRUSION'
                          ? colors.warningBg
                          : colors.infoBg,
                    },
                  ]}
                >
                  <Ionicons
                    name={getAlertTypeIcon(type) as any}
                    size={16}
                    color={
                      type === 'FIRE'
                        ? colors.danger
                        : type === 'INTRUSION'
                        ? colors.warning
                        : colors.info
                    }
                  />
                </View>
                <Text style={styles.typeLabel}>{getAlertTypeLabel(type)}</Text>
                <Text style={styles.typeCount}>{alertsByType[type].length}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <Pressable
            onPress={() => setFilter('all')}
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'all' && styles.filterTabTextActive,
              ]}
            >
              Toutes ({alerts.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('active')}
            style={[
              styles.filterTab,
              filter === 'active' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'active' && styles.filterTabTextActive,
              ]}
            >
              Actives ({activeCount})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('acknowledged')}
            style={[
              styles.filterTab,
              filter === 'acknowledged' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'acknowledged' && styles.filterTabTextActive,
              ]}
            >
              Acquittées ({acknowledgedCount})
            </Text>
          </Pressable>
        </View>

        {/* Demo indicator */}
        {isDemo && (
          <View style={styles.demoIndicator}>
            <Ionicons name="flask" size={14} color={colors.warning} />
            <Text style={styles.demoText}>Données de démonstration</Text>
          </View>
        )}

        {/* Acknowledge All Button */}
        {activeCount > 0 && filter !== 'acknowledged' && (
          <Pressable
            onPress={acknowledgeAll}
            style={({ pressed }) => [
              styles.acknowledgeAllButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons name="checkmark-done" size={18} color={colors.primary} />
            <Text style={styles.acknowledgeAllText}>
              Acquitter toutes les alertes actives
            </Text>
          </Pressable>
        )}

        {/* Alerts List */}
        <View style={styles.alertsList}>
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={colors.success}
              />
              <Text style={styles.emptyTitle}>Aucune alerte</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'active'
                  ? 'Toutes les alertes ont été acquittées'
                  : filter === 'acknowledged'
                  ? 'Aucune alerte acquittée'
                  : 'Aucune alerte enregistrée'}
              </Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={{
                  ...alert,
                  type: alert.type?.toLowerCase() as any,
                  level: alert.level?.toLowerCase() as any,
                  timestamp: new Date(alert.timestamp || alert.createdAt || Date.now()),
                }}
                onAcknowledge={() => acknowledgeAlert(alert.id)}
              />
            ))
          )}
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
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  summaryCardActive: {
    borderColor: colors.warning,
    backgroundColor: colors.warningBg,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  typeStats: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  typeStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginRight: 4,
  },
  typeCount: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: colors.backgroundTertiary,
  },
  filterTabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: colors.textPrimary,
  },
  demoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 12,
    gap: 6,
  },
  demoText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '500',
  },
  acknowledgeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.infoBg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  acknowledgeAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  alertsList: {
    gap: 0,
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
