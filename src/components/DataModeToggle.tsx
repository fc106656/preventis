import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDataMode } from '../context/DataModeContext';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

interface DataModeToggleProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function DataModeToggle({ showLabel = true, size = 'medium' }: DataModeToggleProps) {
  const { mode, toggleMode, isDemo, setMode } = useDataMode();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleToggle = () => {
    // Si on passe en mode réel et qu'on n'est pas connecté, rediriger vers login
    if (isDemo && !isAuthenticated) {
      router.push('/login');
      return;
    }
    toggleMode();
  };

  const sizes = {
    small: { padding: 8, icon: 16, font: 10 },
    medium: { padding: 12, icon: 20, font: 12 },
    large: { padding: 16, icon: 24, font: 14 },
  };

  const s = sizes[size];

  return (
    <Pressable
      onPress={handleToggle}
      style={({ pressed }) => [
        styles.container,
        isDemo ? styles.demoMode : styles.realMode,
        { padding: s.padding },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={isDemo ? 'flask' : 'cloud'}
        size={s.icon}
        color={isDemo ? colors.warning : colors.success}
      />
      {showLabel && (
        <Text
          style={[
            styles.label,
            { fontSize: s.font },
            isDemo ? styles.demoLabel : styles.realLabel,
          ]}
        >
          {isDemo ? 'DÉMO' : 'RÉEL'}
        </Text>
      )}
      <Ionicons
        name="swap-horizontal"
        size={s.icon - 4}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

// Version compacte pour le header
export function DataModeBadge() {
  const { isDemo, toggleMode, setMode } = useDataMode();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleToggle = () => {
    // Si on passe en mode réel et qu'on n'est pas connecté, rediriger vers login
    if (isDemo && !isAuthenticated) {
      router.push('/login');
      return;
    }
    toggleMode();
  };

  return (
    <Pressable onPress={handleToggle} style={styles.badge}>
      <View
        style={[
          styles.badgeDot,
          { backgroundColor: isDemo ? colors.warning : colors.success },
        ]}
      />
      <Text style={styles.badgeText}>{isDemo ? 'DÉMO' : 'LIVE'}</Text>
    </Pressable>
  );
}

// Carte complète pour les paramètres
export function DataModeCard() {
  const { mode, setMode, isDemo } = useDataMode();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSetReal = () => {
    // Si on passe en mode réel et qu'on n'est pas connecté, rediriger vers login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setMode('real');
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons
          name="server"
          size={24}
          color={colors.primary}
        />
        <Text style={styles.cardTitle}>Source des données</Text>
      </View>

      <Text style={styles.cardDescription}>
        {isDemo
          ? 'Mode démonstration avec données fictives. Parfait pour tester l\'interface.'
          : 'Mode réel connecté à l\'API. Les données proviennent des vrais capteurs.'}
      </Text>

      <View style={styles.modeSelector}>
        <Pressable
          onPress={() => setMode('demo')}
          style={[
            styles.modeButton,
            mode === 'demo' && styles.modeButtonActive,
            mode === 'demo' && styles.modeButtonDemo,
          ]}
        >
          <Ionicons
            name="flask"
            size={24}
            color={mode === 'demo' ? colors.warning : colors.textMuted}
          />
          <Text
            style={[
              styles.modeButtonText,
              mode === 'demo' && styles.modeButtonTextActive,
            ]}
          >
            Démonstration
          </Text>
          <Text style={styles.modeButtonSubtext}>Données fictives</Text>
        </Pressable>

        <Pressable
          onPress={handleSetReal}
          style={[
            styles.modeButton,
            mode === 'real' && styles.modeButtonActive,
            mode === 'real' && styles.modeButtonReal,
          ]}
        >
          <Ionicons
            name="cloud"
            size={24}
            color={mode === 'real' ? colors.success : colors.textMuted}
          />
          <Text
            style={[
              styles.modeButtonText,
              mode === 'real' && styles.modeButtonTextActive,
            ]}
          >
            Mode Réel
          </Text>
          <Text style={styles.modeButtonSubtext}>API connectée</Text>
        </Pressable>
      </View>

      {!isDemo && (
        <View style={styles.apiInfo}>
          <Ionicons name="link" size={14} color={colors.textMuted} />
          <Text style={styles.apiInfoText}>
            api-preventis.stark-server.fr
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    gap: 8,
  },
  demoMode: {
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  realMode: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  demoLabel: {
    color: colors.warning,
  },
  realLabel: {
    color: colors.success,
  },
  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Card
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: colors.background,
  },
  modeButtonDemo: {
    borderColor: colors.warning,
  },
  modeButtonReal: {
    borderColor: colors.success,
  },
  modeButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  modeButtonTextActive: {
    color: colors.textPrimary,
  },
  modeButtonSubtext: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  apiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  apiInfoText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
