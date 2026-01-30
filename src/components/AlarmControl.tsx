import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import { AlarmState } from '../types';

interface AlarmControlProps {
  initialState: AlarmState;
  onStateChange?: (state: AlarmState) => void;
}

type AlarmMode = 'off' | 'home' | 'away' | 'night';

const modeConfig: Record<AlarmMode, { icon: string; label: string; color: string }> = {
  off: { icon: 'shield-outline', label: 'Désactivé', color: colors.textMuted },
  home: { icon: 'home', label: 'Maison', color: colors.success },
  away: { icon: 'airplane', label: 'Absent', color: colors.primary },
  night: { icon: 'moon', label: 'Nuit', color: colors.warning },
};

export const AlarmControl: React.FC<AlarmControlProps> = ({
  initialState,
  onStateChange,
}) => {
  const [state, setState] = useState<AlarmState>(initialState);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleModeChange = (mode: AlarmMode) => {
    const newState: AlarmState = {
      ...state,
      mode,
      isArmed: mode !== 'off',
      lastArmedAt: mode !== 'off' ? new Date() : state.lastArmedAt,
    };
    setState(newState);
    onStateChange?.(newState);

    // Animation feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleSiren = () => {
    const newState = { ...state, sirenActive: !state.sirenActive };
    setState(newState);
    onStateChange?.(newState);
  };

  const currentConfig = modeConfig[state.mode];

  return (
    <View style={styles.container}>
      {/* Main Status Display */}
      <Animated.View
        style={[styles.statusDisplay, { transform: [{ scale: scaleAnim }] }]}
      >
        <View
          style={[
            styles.statusIcon,
            { backgroundColor: `${currentConfig.color}20` },
          ]}
        >
          <Ionicons
            name={currentConfig.icon as any}
            size={48}
            color={currentConfig.color}
          />
        </View>
        <Text style={styles.statusLabel}>{currentConfig.label}</Text>
        <Text style={styles.statusSubtext}>
          {state.isArmed ? 'Système armé' : 'Système désarmé'}
        </Text>
        {state.lastArmedAt && state.isArmed && (
          <Text style={styles.armedSince}>
            Depuis {formatTime(state.lastArmedAt)}
          </Text>
        )}
      </Animated.View>

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        {(Object.keys(modeConfig) as AlarmMode[]).map((mode) => {
          const config = modeConfig[mode];
          const isActive = state.mode === mode;

          return (
            <Pressable
              key={mode}
              onPress={() => handleModeChange(mode)}
              style={({ pressed }) => [
                styles.modeButton,
                isActive && styles.modeButtonActive,
                isActive && { borderColor: config.color },
                pressed && styles.modeButtonPressed,
              ]}
            >
              <Ionicons
                name={config.icon as any}
                size={24}
                color={isActive ? config.color : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  isActive && { color: config.color },
                ]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Siren Control */}
      <Pressable
        onPress={toggleSiren}
        style={({ pressed }) => [
          styles.sirenButton,
          state.sirenActive && styles.sirenButtonActive,
          pressed && styles.sirenButtonPressed,
        ]}
      >
        <Ionicons
          name={state.sirenActive ? 'volume-high' : 'volume-mute'}
          size={24}
          color={state.sirenActive ? colors.danger : colors.textSecondary}
        />
        <Text
          style={[
            styles.sirenButtonText,
            state.sirenActive && styles.sirenButtonTextActive,
          ]}
        >
          {state.sirenActive ? 'Sirène ACTIVE' : 'Sirène désactivée'}
        </Text>
        {state.sirenActive && (
          <View style={styles.sirenPulse} />
        )}
      </Pressable>
    </View>
  );
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  statusDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  armedSince: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: colors.background,
  },
  modeButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  modeButtonText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  sirenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  sirenButtonActive: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
  },
  sirenButtonPressed: {
    opacity: 0.9,
  },
  sirenButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sirenButtonTextActive: {
    color: colors.danger,
  },
  sirenPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.danger,
    opacity: 0.1,
  },
});
