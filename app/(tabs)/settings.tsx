import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { DataModeCard } from '../../src/components/DataModeToggle';
import { useDataMode } from '../../src/context/DataModeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useApiStatus } from '../../src/hooks/useApiStatus';
import { API_CONFIG } from '../../src/config/api';
import { api } from '../../src/services/api';
import { useAlert } from '../../src/components/AlertModal';
// Utiliser l'API Clipboard native du navigateur pour le web
const copyToClipboardNative = async (text: string): Promise<void> => {
  if (typeof window !== 'undefined' && window.navigator?.clipboard) {
    await window.navigator.clipboard.writeText(text);
  } else if (typeof window !== 'undefined') {
    // Fallback pour les navigateurs plus anciens
    const textArea = (window as any).document?.createElement('textarea');
    if (textArea) {
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      (window as any).document?.body?.appendChild(textArea);
      textArea.select();
      (window as any).document?.execCommand('copy');
      (window as any).document?.body?.removeChild(textArea);
    }
  }
};

export default function SettingsScreen() {
  const { isDemo, isReal } = useDataMode();
  const { getApiKeys, createApiKey, deleteApiKey, isAuthenticated, apiKey: storedApiKey, logout, user } = useAuth();
  const apiStatus = useApiStatus();
  const router = useRouter();
  const { showConfirm, showInfo } = useAlert();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showStoredApiKey, setShowStoredApiKey] = useState(false);

  // Extraire l'URL de base de l'API (sans /api)
  const getApiBaseUrl = () => {
    if (isDemo) return '-';
    const url = API_CONFIG.baseUrl;
    // Enlever /api à la fin si présent
    return url.endsWith('/api') ? url.slice(0, -4) : url;
  };

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

  // Charger les clés API au démarrage (mode réel uniquement)
  useEffect(() => {
    if (isReal && isAuthenticated) {
      loadApiKeys();
    }
  }, [isReal, isAuthenticated]);

  const loadApiKeys = async () => {
    if (isDemo || !isAuthenticated) return;
    setLoadingApiKeys(true);
    try {
      const keys = await getApiKeys();
      setApiKeys(keys);
    } catch (error: any) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoadingApiKeys(false);
    }
  };


  const handleCreateApiKey = async () => {
    if (!isAuthenticated) return;
    try {
      const result = await createApiKey(newApiKeyName || undefined);
      setNewApiKey(result.apiKey);
      setNewApiKeyName('');
      setShowCreateApiKey(false);
      await loadApiKeys();
      showInfo('Clé API créée', result.message);
    } catch (error: any) {
      showInfo('Erreur', error.message || 'Impossible de créer la clé API');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    showConfirm(
      'Supprimer la clé API',
      'Êtes-vous sûr de vouloir supprimer cette clé ? Elle ne pourra plus être utilisée.',
      async () => {
        try {
          await deleteApiKey(id);
          await loadApiKeys();
          showInfo('Succès', 'Clé API supprimée');
        } catch (error: any) {
          showInfo('Erreur', error.message || 'Impossible de supprimer la clé API');
        }
      },
      'Supprimer',
      true
    );
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await copyToClipboardNative(text);
      showInfo('Copié', `${label} copié dans le presse-papiers`);
    } catch (error) {
      showInfo('Erreur', 'Impossible de copier');
    }
  };

  const handleLogout = async () => {
    showConfirm(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      async () => {
        try {
          await logout();
          router.replace('/login');
        } catch (error: any) {
          showInfo('Erreur', error.message || 'Impossible de se déconnecter');
        }
      },
      'Déconnexion',
      true
    );
  };


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
              value={getApiBaseUrl()}
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

        {/* Account Section - Only show if authenticated */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compte</Text>
            <View style={styles.card}>
              {user && (
                <InfoRow 
                  icon="person-circle" 
                  label="Utilisateur" 
                  value={user.email || user.name || 'Utilisateur'} 
                />
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.logoutButtonPressed,
                ]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                <Text style={styles.logoutButtonText}>Se déconnecter</Text>
              </Pressable>
            </View>
          </View>
        )}

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

        {/* Gestion des clés API - Mode réel uniquement */}
        {isReal && isAuthenticated && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Clés API</Text>
              <Pressable
                onPress={() => setShowCreateApiKey(true)}
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={styles.addButtonText}>Nouvelle clé</Text>
              </Pressable>
            </View>

            {loadingApiKeys ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : apiKeys.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="key-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>Aucune clé API</Text>
                <Text style={styles.emptySubtext}>
                  Créez une clé API pour connecter votre centrale
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                {/* Clé API stockée (si disponible) */}
                {storedApiKey && (
                  <View style={[styles.row, styles.apiKeyRow]}>
                    <View style={styles.rowLeft}>
                      <Ionicons
                        name="key"
                        size={18}
                        color={colors.primary}
                        style={styles.rowIcon}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLabel}>Clé API stockée</Text>
                        <Text style={styles.rowSubtext}>
                          Clé API enregistrée localement
                        </Text>
                        {showStoredApiKey && (
                          <Pressable
                            style={styles.apiKeyDisplayBox}
                            onPress={() => copyToClipboard(storedApiKey, 'Clé API')}
                          >
                            <Text style={styles.apiKeyDisplayText} selectable>
                              {storedApiKey}
                            </Text>
                            <Ionicons name="copy" size={16} color={colors.primary} />
                          </Pressable>
                        )}
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        setShowStoredApiKey(!showStoredApiKey);
                        if (!showStoredApiKey) {
                          copyToClipboard(storedApiKey, 'Clé API');
                        }
                      }}
                      style={styles.viewButton}
                    >
                      <Ionicons
                        name={showStoredApiKey ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.primary}
                      />
                    </Pressable>
                  </View>
                )}
                
                {apiKeys.map((key, index) => (
                  <View
                    key={key.id}
                    style={[
                      styles.row,
                      index === apiKeys.length - 1 && storedApiKey && { borderBottomWidth: 0 },
                      !storedApiKey && index === apiKeys.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <Ionicons
                        name="key"
                        size={18}
                        color={colors.primary}
                        style={styles.rowIcon}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLabel}>{key.name}</Text>
                        <Text style={styles.rowSubtext}>
                          Créée le {new Date(key.createdAt).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteApiKey(key.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color={colors.info} />
              <Text style={styles.infoText}>
                Les clés API permettent à votre centrale de communiquer avec l'API. 
                Donnez la clé à votre système edge pour l'authentification.
              </Text>
            </View>
          </View>
        )}

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
                const url = getApiBaseUrl();
                if (url !== '-') {
                  Linking.openURL(url);
                }
              }}
              disabled={isDemo}
            />
            <ActionButton
              icon="document-text-outline"
              label="Documentation"
              onPress={() => {
                Linking.openURL('https://preventis.stark-server.fr/documentation/');
              }}
            />
            <ActionButton
              icon="help-circle-outline"
              label="Aide"
              onPress={() => {
                Linking.openURL('https://preventis.stark-server.fr/documentation/');
              }}
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

      {/* Modal: Créer une clé API */}
      <Modal
        visible={showCreateApiKey}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateApiKey(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle clé API</Text>
              <Pressable onPress={() => setShowCreateApiKey(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {newApiKey ? (
              <View style={styles.apiKeyDisplay}>
                <Ionicons name="key" size={48} color={colors.primary} />
                <Text style={styles.apiKeyWarning}>
                  ⚠️ Copiez cette clé maintenant, elle ne sera plus affichée !
                </Text>
                <Pressable
                  style={styles.apiKeyBox}
                  onPress={() => copyToClipboard(newApiKey, 'Clé API')}
                >
                  <Text style={styles.apiKeyText} selectable>
                    {newApiKey}
                  </Text>
                  <Ionicons name="copy" size={20} color={colors.primary} />
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={() => {
                    setNewApiKey(null);
                    setShowCreateApiKey(false);
                  }}
                >
                  <Text style={styles.buttonText}>Fermer</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nom de la clé (optionnel)"
                  placeholderTextColor={colors.textMuted}
                  value={newApiKeyName}
                  onChangeText={setNewApiKeyName}
                />
                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={() => setShowCreateApiKey(false)}
                  >
                    <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                      Annuler
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.buttonPrimary]}
                    onPress={handleCreateApiKey}
                  >
                    <Text style={styles.buttonText}>Créer</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

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
  // API Keys & Devices
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.infoBg,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  rowSubtext: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  viewButton: {
    padding: 8,
  },
  apiKeyRow: {
    backgroundColor: colors.infoBg,
  },
  apiKeyDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  apiKeyDisplayText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.infoBg,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalScroll: {
    maxHeight: 500,
  },
  apiKeyDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  apiKeyWarning: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  apiKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 20,
    gap: 8,
  },
  apiKeyText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  inputLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 8,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  typeOptionActive: {
    backgroundColor: colors.infoBg,
    borderColor: colors.primary,
  },
  typeOptionText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.backgroundTertiary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.textPrimary,
  },
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: 8,
  },
  logoutButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  logoutButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
});

