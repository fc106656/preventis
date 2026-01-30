import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { SensorCard, StatusBadge } from '../src/components';
import { useSensors } from '../src/hooks/useData';
import { useDataMode } from '../src/context/DataModeContext';
import { Sensor } from '../src/types';

const { width } = Dimensions.get('window');
const cardWidth = width > 600 ? (width - 64) / 3 : (width - 48) / 2;

type FilterType = 'all' | 'co2' | 'infrared' | 'smoke' | 'temperature';

const filterOptions: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'Tous', icon: 'apps' },
  { key: 'co2', label: 'CO₂', icon: 'cloud-outline' },
  { key: 'infrared', label: 'IR', icon: 'eye-outline' },
  { key: 'smoke', label: 'Fumée', icon: 'flame-outline' },
  { key: 'temperature', label: 'Temp', icon: 'thermometer-outline' },
];

export default function SensorsScreen() {
  const { isDemo } = useDataMode();
  const { sensors, loading, error, refresh } = useSensors();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedSensor, setSelectedSensor] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filteredSensors = filter === 'all'
    ? sensors
    : sensors.filter((s) => s.type?.toLowerCase() === filter);

  const onlineSensors = sensors.filter(
    (s) => s.status?.toLowerCase() === 'online'
  ).length;
  const offlineSensors = sensors.filter(
    (s) => s.status?.toLowerCase() === 'offline'
  ).length;
  const warningSensors = sensors.filter(
    (s) => s.status?.toLowerCase() === 'warning' || s.status?.toLowerCase() === 'alert'
  ).length;

  const getSensorTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'co2': return 'Capteur CO₂';
      case 'infrared': return 'Détecteur infrarouge';
      case 'smoke': return 'Détecteur de fumée';
      case 'temperature': return 'Capteur de température';
      default: return 'Capteur';
    }
  };

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
        {/* Stats rapides */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: colors.success }]} />
            <Text style={styles.statValue}>{onlineSensors}</Text>
            <Text style={styles.statLabel}>En ligne</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: colors.textMuted }]} />
            <Text style={styles.statValue}>{offlineSensors}</Text>
            <Text style={styles.statLabel}>Hors ligne</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.statValue}>{warningSensors}</Text>
            <Text style={styles.statLabel}>Attention</Text>
          </View>
        </View>

        {/* Filtres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filterOptions.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setFilter(option.key)}
              style={({ pressed }) => [
                styles.filterButton,
                filter === option.key && styles.filterButtonActive,
                pressed && styles.filterButtonPressed,
              ]}
            >
              <Ionicons
                name={option.icon as any}
                size={16}
                color={filter === option.key ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterText,
                  filter === option.key && styles.filterTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Liste des capteurs */}
        <View style={styles.sensorsHeader}>
          <Text style={styles.sectionTitle}>
            {filteredSensors.length} capteur{filteredSensors.length > 1 ? 's' : ''}
          </Text>
          {isDemo && (
            <Text style={styles.demoLabel}>Données démo</Text>
          )}
        </View>

        {/* Empty State */}
        {filteredSensors.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="hardware-chip-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun capteur</Text>
            <Text style={styles.emptySubtitle}>
              {filter !== 'all' 
                ? `Aucun capteur de type "${filter}" trouvé`
                : 'Aucun capteur disponible'}
            </Text>
          </View>
        )}

        <View style={styles.sensorsGrid}>
          {filteredSensors.map((sensor) => (
            <View key={sensor.id} style={[styles.sensorWrapper, { width: cardWidth }]}>
              <SensorCard
                sensor={{
                  ...sensor,
                  status: sensor.status?.toLowerCase() as any,
                  type: sensor.type?.toLowerCase() as any,
                  lastUpdate: new Date(sensor.lastUpdate || sensor.updatedAt || Date.now()),
                }}
                onPress={() => setSelectedSensor(sensor)}
              />
            </View>
          ))}
        </View>

        {/* Modal de détail */}
        {selectedSensor && (
          <View style={styles.detailOverlay}>
            <Pressable
              style={styles.detailBackdrop}
              onPress={() => setSelectedSensor(null)}
            />
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selectedSensor.name}</Text>
                <Pressable onPress={() => setSelectedSensor(null)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.detailContent}>
                <DetailRow
                  label="Type"
                  value={getSensorTypeLabel(selectedSensor.type)}
                />
                <DetailRow label="Localisation" value={selectedSensor.location} />
                <DetailRow
                  label="Valeur actuelle"
                  value={`${selectedSensor.value} ${selectedSensor.unit || ''}`}
                />
                <DetailRow
                  label="Seuil d'alerte"
                  value={`${selectedSensor.threshold} ${selectedSensor.unit || ''}`}
                />
                {selectedSensor.batteryLevel !== undefined && (
                  <DetailRow
                    label="Batterie"
                    value={`${selectedSensor.batteryLevel}%`}
                  />
                )}

                <View style={styles.detailStatus}>
                  <Text style={styles.detailStatusLabel}>État</Text>
                  <StatusBadge status={selectedSensor.status?.toLowerCase() as any} />
                </View>
              </View>

              <View style={styles.detailActions}>
                <Pressable style={styles.actionButton} onPress={refresh}>
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Rafraîchir</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.cardBorder,
    marginHorizontal: 8,
  },
  filterContainer: {
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterButtonActive: {
    backgroundColor: colors.infoBg,
    borderColor: colors.primary,
  },
  filterButtonPressed: {
    opacity: 0.8,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  filterTextActive: {
    color: colors.primary,
  },
  sensorsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  demoLabel: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: colors.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sensorWrapper: {
    marginBottom: 4,
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
  // Detail modal
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  detailBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  detailCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  detailContent: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  detailStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  detailStatusLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.infoBg,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
