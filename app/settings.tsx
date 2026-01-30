import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { DataModeCard } from '../src/components/DataModeToggle';
import { useDataMode } from '../src/context/DataModeContext';
import { useApiStatus } from '../src/hooks/useApiStatus';
import { API_CONFIG } from '../src/config/api';

export default function SettingsScreen() {
  const { isDemo, isReal } = useDataMode();
  const apiStatus = useApiStatus();

  const getConnectionStatus = () => {
    if (isDemo) {
      return { text: 'Mode démonstration', status: 'neutral' as const };
    }
    if (apiStatus.isChecking) {
      return { text: 'Vérification...', status: 'checking' as const };
    }
    if (apiStatus.isConnected) {
      return { text: 'Connecté', status: 'success' as const };
    }
    return { text: apiStatus.error || 'Non connecté', status: 'danger' as const };
  };

  const getLatencyDisplay = () => {
    if (isDemo) return '-';
    if (apiStatus.isChecking) return '...';
    if (!apiStatus.isConnected) return '-';
    if (apiStatus.latency === null) return '-';
    return `${apiStatus.latency}ms`;
  };

  const connectionStatus = getConnectionStatus();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Data Mode Card */}
        <DataModeCard />

        {/* Connection Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>État de la connexion</Text>
            {isReal && (
              <Pressable
                onPress={apiStatus.refresh}
                style={styles.refreshButton}
                disabled={apiStatus.isChecking}
              >
                {apiStatus.isChecking ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                )}
              </Pressable>
            )}
          </View>

          <View style={styles.card}>
            <StatusRow
              icon="server"
              label="API"
              value={connectionStatus.text}
              status={connectionStatus.status}
              isLoading={apiStatus.isChecking}
            />
            <StatusRow
              icon="link"
              label="URL API"
              value={isDemo ? '-' : API_CONFIG.baseUrl.replace('/api', '')}
            />
            <StatusRow
              icon="speedometer"
              label="Latence"
              value={getLatencyDisplay()}
              status={
                !isDemo && apiStatus.isConnected
                  ? apiStatus.latency! < 200
                    ? 'success'
                    : apiStatus.latency! < 500
                    ? 'warning'
                    : 'danger'
                  : undefined
              }
            />
            {apiStatus.lastCheck && isReal && (
              <StatusRow
                icon="time"
                label="Dernière vérif."
                value={apiStatus.lastCheck.toLocaleTimeString('fr-FR')}
              />
            )}
          </View>

          {/* Error Banner */}
          {isReal && !apiStatus.isConnected && !apiStatus.isChecking && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning" size={20} color={colors.danger} />
              <View style={styles.errorContent}>
                <Text style={styles.errorTitle}>Connexion impossible</Text>
                <Text style={styles.errorText}>
                  {apiStatus.error || 'L\'API ne répond pas'}
                </Text>
                <Text style={styles.errorHint}>
                  Vérifiez que l'API est démarrée et accessible.
                </Text>
              </View>
            </View>
          )}

          {/* Success Banner */}
          {isReal && apiStatus.isConnected && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.successText}>
                API connectée • Les données sont synchronisées
              </Text>
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <View style={styles.card}>
            <InfoRow icon="shield-checkmark" label="Application" value="Preventis" />
            <InfoRow icon="code-slash" label="Version" value="1.0.0 (POC)" />
            <InfoRow icon="school" label="Projet" value="CESI A4 - IoT" />
            <InfoRow icon="person" label="Auteur" value="Clément Faux" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              icon="refresh"
              label="Tester la connexion"
              onPress={apiStatus.refresh}
              disabled={isDemo}
            />
            <ActionButton
              icon="open-outline"
              label="Ouvrir l'API"
              onPress={() => {
                const url = API_CONFIG.baseUrl.replace('/api', '');
                Linking.openURL(url);
              }}
              disabled={isDemo}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Preventis © 2026 - Projet IoT CESI
          </Text>
          <Text style={styles.footerSubtext}>
            Système de sécurité avec capteurs CO2 et infrarouge
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusRow({
  icon,
  label,
  value,
  status,
  isLoading,
}: {
  icon: string;
  label: string;
  value: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral' | 'checking';
  isLoading?: boolean;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.danger;
      case 'neutral':
        return colors.textMuted;
      case 'checking':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons
          name={icon as any}
          size={18}
          color={colors.textSecondary}
          style={styles.rowIcon}
        />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            {status && status !== 'neutral' && (
              <View
                style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
              />
            )}
            <Text
              style={[
                styles.rowValue,
                status && { color: getStatusColor() },
              ]}
              numberOfLines={1}
            >
              {value}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons
          name={icon as any}
          size={18}
          color={colors.textSecondary}
          style={styles.rowIcon}
        />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        pressed && !disabled && styles.actionButtonPressed,
        disabled && styles.actionButtonDisabled,
      ]}
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={disabled ? colors.textMuted : colors.primary}
      />
      <Text
        style={[
          styles.actionButtonText,
          disabled && styles.actionButtonTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
  section: {
    marginTop: 24,
  },
  sectionHeader: {
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
  refreshButton: {
    padding: 8,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '50%',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  rowValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorContent: {
    flex: 1,
    marginLeft: 12,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    opacity: 0.9,
  },
  errorHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  // Success Banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.success,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '500',
  },
  // Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  actionButtonTextDisabled: {
    color: colors.textMuted,
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  footerSubtext: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});
