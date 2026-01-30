import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import { Sensor } from '../types';
import { StatusBadge } from './StatusBadge';

interface SensorCardProps {
  sensor: Sensor;
  onPress?: () => void;
}

const getSensorIcon = (type: Sensor['type']) => {
  switch (type) {
    case 'co2':
      return 'cloud-outline';
    case 'infrared':
      return 'eye-outline';
    case 'smoke':
      return 'flame-outline';
    case 'temperature':
      return 'thermometer-outline';
    default:
      return 'hardware-chip-outline';
  }
};

const getSensorTypeLabel = (type: Sensor['type']) => {
  switch (type) {
    case 'co2':
      return 'CO₂';
    case 'infrared':
      return 'Infrarouge';
    case 'smoke':
      return 'Fumée';
    case 'temperature':
      return 'Température';
    default:
      return 'Capteur';
  }
};

export const SensorCard: React.FC<SensorCardProps> = ({ sensor, onPress }) => {
  const isWarning = sensor.value >= sensor.threshold * 0.8;
  const isAlert = sensor.value >= sensor.threshold;

  const getValueColor = () => {
    if (isAlert) return colors.danger;
    if (isWarning) return colors.warning;
    return colors.textPrimary;
  };

  const getProgressWidth = () => {
    if (sensor.type === 'infrared') return sensor.value > 0 ? 100 : 0;
    return Math.min((sensor.value / sensor.threshold) * 100, 100);
  };

  const getProgressColor = () => {
    const progress = getProgressWidth();
    if (progress >= 100) return colors.danger;
    if (progress >= 80) return colors.warning;
    return colors.success;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getSensorIcon(sensor.type) as any}
            size={24}
            color={colors.primary}
          />
        </View>
        <StatusBadge status={sensor.status} size="small" />
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {sensor.name}
      </Text>
      <Text style={styles.location}>
        <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
        {' '}{sensor.location}
      </Text>

      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: getValueColor() }]}>
          {sensor.type === 'infrared'
            ? sensor.value > 0
              ? 'Détecté'
              : 'RAS'
            : sensor.value}
        </Text>
        {sensor.unit && <Text style={styles.unit}>{sensor.unit}</Text>}
      </View>

      {sensor.type !== 'infrared' && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${getProgressWidth()}%`,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>
      )}

      {sensor.batteryLevel !== undefined && (
        <View style={styles.batteryContainer}>
          <Ionicons
            name={
              sensor.batteryLevel > 50
                ? 'battery-full'
                : sensor.batteryLevel > 20
                ? 'battery-half'
                : 'battery-dead'
            }
            size={14}
            color={
              sensor.batteryLevel > 50
                ? colors.success
                : sensor.batteryLevel > 20
                ? colors.warning
                : colors.danger
            }
          />
          <Text style={styles.batteryText}>{sensor.batteryLevel}%</Text>
        </View>
      )}

      <Text style={styles.typeLabel}>{getSensorTypeLabel(sensor.type)}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minWidth: 160,
    ...shadows.card,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.infoBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  location: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  unit: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: 4,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  batteryText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  typeLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
