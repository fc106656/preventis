import React from 'react';
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
import { colors } from '../../src/theme/colors';
import { AlarmControl, ZoneCard } from '../../src/components';
import { useAlarm, useZones, useSensors } from '../../src/hooks/useData';
import { useDataMode } from '../../src/context/DataModeContext';

export default function AlarmScreen() {
  const { isDemo } = useDataMode();
  const { alarmState, loading: alarmLoading, setMode, toggleSiren, refresh: refreshAlarm } = useAlarm();
  const { zones, loading: zonesLoading, toggleZoneArm, refresh: refreshZones } = useZones();
  const { sensors } = useSensors();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshAlarm(), refreshZones()]);
    setRefreshing(false);
  };

  const handleAlarmStateChange = (newState: any) => {
    setMode(newState.mode);
    if (newState.sirenActive !== alarmState.sirenActive) {
      toggleSiren(newState.sirenActive);
    }
  };

  const getZoneSensorsCount = (zone: any) => {
    const zoneId = zone.id;
    const zoneSensors = sensors.filter((s) => s.zoneId === zoneId);
    return {
      online: zoneSensors.filter((s) => s.status?.toLowerCase() === 'online').length,
      total: zoneSensors.length || zone.sensors?.length || 0,
    };
  };

  const armedZonesCount = zones.filter((z) => z.isArmed).length;

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
        {/* Demo indicator */}
        {isDemo && (
          <View style={styles.demoIndicator}>
            <Ionicons name="flask" size={14} color={colors.warning} />
            <Text style={styles.demoText}>Mode démonstration</Text>
          </View>
        )}

        {/* Main Alarm Control */}
        <AlarmControl
          initialState={{
            ...alarmState,
            mode: alarmState.mode?.toLowerCase() as any,
          }}
          onStateChange={handleAlarmStateChange}
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="log-in-outline"
              label="Mode Entrée"
              sublabel="30s délai"
              onPress={() => {}}
            />
            <QuickAction
              icon="log-out-outline"
              label="Mode Sortie"
              sublabel="60s délai"
              onPress={() => {}}
            />
            <QuickAction
              icon="warning-outline"
              label="Test Sirène"
              sublabel="3s test"
              onPress={() => toggleSiren(true)}
              variant="danger"
            />
            <QuickAction
              icon="call-outline"
              label="Appel Urgence"
              sublabel="Centrale"
              onPress={() => {}}
              variant="primary"
            />
          </View>
        </View>

        {/* Zones Management */}
        <View style={styles.zonesSection}>
          <View style={styles.zonesHeader}>
            <Text style={styles.sectionTitle}>Zones de surveillance</Text>
            <View style={styles.zonesBadge}>
              <Text style={styles.zonesBadgeText}>
                {armedZonesCount}/{zones.length} armées
              </Text>
            </View>
          </View>

          {zones.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="grid-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucune zone configurée</Text>
            </View>
          ) : (
            zones.map((zone) => (
              <ZoneCard
                key={zone.id}
                zone={{
                  ...zone,
                  status: zone.status?.toLowerCase() as any,
                }}
                sensorsCount={getZoneSensorsCount(zone)}
                onToggleArm={(armed) => toggleZoneArm(zone.id, armed)}
              />
            ))
          )}
        </View>

        {/* System Info */}
        <View style={styles.systemInfo}>
          <Text style={styles.sectionTitle}>Informations système</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="wifi"
              label="Connexion"
              value={isDemo ? 'Démo' : 'En ligne'}
              status={isDemo ? undefined : 'success'}
            />
            <InfoRow
              icon="server"
              label="Centrale"
              value={isDemo ? 'Simulation' : 'Connectée'}
              status={isDemo ? undefined : 'success'}
            />
            <InfoRow
              icon="cellular"
              label="Backup GSM"
              value="Actif"
              status="success"
            />
            <InfoRow
              icon="battery-charging"
              label="Batterie secours"
              value="98%"
              status="success"
            />
            <InfoRow
              icon="time"
              label="Dernière vérification"
              value={new Date().toLocaleTimeString('fr-FR')}
            />
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.emergencySection}>
          <Pressable
            style={({ pressed }) => [
              styles.emergencyButton,
              pressed && styles.emergencyButtonPressed,
            ]}
          >
            <Ionicons name="call" size={24} color="#fff" />
            <View style={styles.emergencyText}>
              <Text style={styles.emergencyTitle}>Contact d'urgence</Text>
              <Text style={styles.emergencyNumber}>+33 1 23 45 67 89</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  sublabel,
  onPress,
  variant = 'default',
}: {
  icon: string;
  label: string;
  sublabel: string;
  onPress: () => void;
  variant?: 'default' | 'danger' | 'primary';
}) {
  const getColors = () => {
    switch (variant) {
      case 'danger':
        return { bg: colors.dangerBg, icon: colors.danger };
      case 'primary':
        return { bg: colors.infoBg, icon: colors.primary };
      default:
        return { bg: colors.backgroundTertiary, icon: colors.textSecondary };
    }
  };

  const { bg, icon: iconColor } = getColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        { backgroundColor: bg },
        pressed && styles.quickActionPressed,
      ]}
    >
      <Ionicons name={icon as any} size={24} color={iconColor} />
      <Text style={styles.quickActionLabel}>{label}</Text>
      <Text style={styles.quickActionSublabel}>{sublabel}</Text>
    </Pressable>
  );
}

function InfoRow({
  icon,
  label,
  value,
  status,
}: {
  icon: string;
  label: string;
  value: string;
  status?: 'success' | 'warning' | 'danger';
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons
          name={icon as any}
          size={18}
          color={colors.textSecondary}
          style={styles.infoIcon}
        />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={styles.infoRowRight}>
        {status && (
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
        )}
        <Text
          style={[
            styles.infoValue,
            status && { color: getStatusColor() },
          ]}
        >
          {value}
        </Text>
      </View>
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
  demoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: colors.warningBg,
    borderRadius: 8,
    gap: 6,
  },
  demoText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActions: {
    marginTop: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickActionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  quickActionLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionSublabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  zonesSection: {
    marginTop: 24,
  },
  zonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  zonesBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zonesBadgeText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  systemInfo: {
    marginTop: 24,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  emergencySection: {
    marginTop: 24,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 12,
    padding: 16,
  },
  emergencyButtonPressed: {
    opacity: 0.9,
  },
  emergencyText: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyNumber: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    height: 20,
  },
});

