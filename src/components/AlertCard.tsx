import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Alert } from '../types';
import { StatusBadge } from './StatusBadge';

interface AlertCardProps {
  alert: Alert;
  onPress?: () => void;
  onAcknowledge?: () => void;
}

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'fire':
      return 'flame';
    case 'intrusion':
      return 'shield-checkmark';
    case 'system':
      return 'settings';
    default:
      return 'alert-circle';
  }
};

const getAlertColor = (level: Alert['level']) => {
  switch (level) {
    case 'critical':
      return colors.danger;
    case 'warning':
      return colors.warning;
    case 'info':
      return colors.info;
    default:
      return colors.textSecondary;
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
};

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onPress,
  onAcknowledge,
}) => {
  const alertColor = getAlertColor(alert.level);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: alertColor },
        alert.acknowledged && styles.cardAcknowledged,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View
            style={[styles.iconContainer, { backgroundColor: `${alertColor}20` }]}
          >
            <Ionicons
              name={getAlertIcon(alert.type) as any}
              size={20}
              color={alertColor}
            />
          </View>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  alert.acknowledged && styles.titleAcknowledged,
                ]}
                numberOfLines={1}
              >
                {alert.title}
              </Text>
              <StatusBadge level={alert.level} size="small" />
            </View>
            <Text style={styles.timestamp}>{formatTimestamp(alert.timestamp)}</Text>
          </View>
        </View>

        <Text
          style={[styles.message, alert.acknowledged && styles.messageAcknowledged]}
          numberOfLines={2}
        >
          {alert.message}
        </Text>

        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.location}>{alert.location}</Text>
          </View>

          {!alert.acknowledged && onAcknowledge && (
            <Pressable
              onPress={onAcknowledge}
              style={({ pressed }) => [
                styles.ackButton,
                pressed && styles.ackButtonPressed,
              ]}
            >
              <Ionicons name="checkmark" size={16} color={colors.primary} />
              <Text style={styles.ackButtonText}>Acquitter</Text>
            </Pressable>
          )}

          {alert.acknowledged && (
            <View style={styles.acknowledgedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.acknowledgedText}>Acquitté</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderLeftWidth: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardAcknowledged: {
    opacity: 0.7,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  titleAcknowledged: {
    color: colors.textSecondary,
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 12,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  messageAcknowledged: {
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.infoBg,
  },
  ackButtonPressed: {
    opacity: 0.8,
  },
  ackButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acknowledgedText: {
    color: colors.success,
    fontSize: 12,
    marginLeft: 4,
  },
});
