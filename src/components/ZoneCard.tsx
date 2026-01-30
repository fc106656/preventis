import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Zone } from '../types';
import { StatusBadge } from './StatusBadge';

interface ZoneCardProps {
  zone: Zone;
  sensorsCount: { online: number; total: number };
  onToggleArm?: (armed: boolean) => void;
  onPress?: () => void;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({
  zone,
  sensorsCount,
  onToggleArm,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name="grid-outline"
            size={20}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={styles.title}>{zone.name}</Text>
        </View>
        <StatusBadge status={zone.status} size="small" />
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons
            name="hardware-chip-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.statText}>
            {sensorsCount.online}/{sensorsCount.total} capteurs
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.armLabel}>
          {zone.isArmed ? 'Zone armée' : 'Zone désarmée'}
        </Text>
        <Switch
          value={zone.isArmed}
          onValueChange={onToggleArm}
          trackColor={{ false: colors.backgroundTertiary, true: colors.successBg }}
          thumbColor={zone.isArmed ? colors.success : colors.textMuted}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  stats: {
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  armLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
