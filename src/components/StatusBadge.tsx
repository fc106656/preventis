import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { SensorStatus, AlertLevel } from '../types';

interface StatusBadgeProps {
  status?: SensorStatus;
  level?: AlertLevel;
  size?: 'small' | 'medium' | 'large';
}

const getStatusColor = (status?: SensorStatus, level?: AlertLevel) => {
  if (level) {
    switch (level) {
      case 'critical':
        return colors.danger;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
    }
  }
  if (status) {
    switch (status) {
      case 'online':
        return colors.success;
      case 'offline':
        return colors.offline;
      case 'warning':
        return colors.warning;
      case 'alert':
        return colors.danger;
    }
  }
  return colors.offline;
};

const getStatusText = (status?: SensorStatus, level?: AlertLevel) => {
  if (level) {
    switch (level) {
      case 'critical':
        return 'CRITIQUE';
      case 'warning':
        return 'ATTENTION';
      case 'info':
        return 'INFO';
    }
  }
  if (status) {
    switch (status) {
      case 'online':
        return 'EN LIGNE';
      case 'offline':
        return 'HORS LIGNE';
      case 'warning':
        return 'ATTENTION';
      case 'alert':
        return 'ALERTE';
    }
  }
  return 'INCONNU';
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  level,
  size = 'medium',
}) => {
  const color = getStatusColor(status, level);
  const text = getStatusText(status, level);

  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 9 },
    medium: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 10 },
    large: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}20`,
          borderColor: color,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[styles.text, { color, fontSize: sizeStyles[size].fontSize }]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
