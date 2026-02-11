import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../src/theme/colors';
import { SensorCard, StatusBadge, useAlert, DeviceHistoryChart } from '../../src/components';
import { useSensors } from '../../src/hooks/useData';
import { useDataMode } from '../../src/context/DataModeContext';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { Sensor } from '../../src/types';

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
  const { isDemo, isReal } = useDataMode();
  const { isAuthenticated } = useAuth();
  const { sensors, loading, error, refresh } = useSensors();
  const { showConfirm, showInfo, showAlert } = useAlert();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedSensor, setSelectedSensor] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [historyPeriod, setHistoryPeriod] = useState<'15m' | '1h' | '6h' | '24h' | '7d'>('1h');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    type: 'SENSOR_CO2' as 'SENSOR_CO2' | 'SENSOR_TEMPERATURE' | 'SENSOR_INFRARED' | 'SENSOR_SMOKE' | 'MODULE_ALARM',
    location: '',
    temperatureUnit: 'C' as 'C' | 'F', // Pour la température uniquement
  });

  // Configuration des seuils et unités par type de capteur
  const getDeviceDefaults = (type: string, tempUnit: 'C' | 'F' = 'C') => {
    switch (type) {
      case 'SENSOR_CO2':
        return { threshold: 1000, unit: 'ppm' }; // Seuil CO2 standard: 1000 ppm
      case 'SENSOR_TEMPERATURE':
        // Température: 60°C (140°F) pour alerte feu
        return { 
          threshold: tempUnit === 'C' ? 60 : 140, 
          unit: `°${tempUnit}` 
        };
      case 'SENSOR_INFRARED':
        return { threshold: 1, unit: '' }; // Binaire: 0 ou 1
      case 'SENSOR_SMOKE':
        return { threshold: 0.5, unit: '%/m' }; // Détecteur de fumée: 0.5%/m
      case 'MODULE_ALARM':
        return { threshold: 0, unit: '' }; // Module alarme: pas de seuil
      default:
        return { threshold: 0, unit: '' };
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Rafraîchissement automatique de la liste des capteurs toutes les 5 secondes
  useEffect(() => {
    if (!isReal || !isAuthenticated) {
      return;
    }

    // Rafraîchir immédiatement
    refresh();

    // Puis rafraîchir automatiquement toutes les 5 secondes
    const intervalId = setInterval(() => {
      refresh();
    }, 5000); // 5 secondes

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReal, isAuthenticated]);

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

  const getSensorIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'SENSOR_CO2':
      case 'CO2':
        return 'cloud-outline';
      case 'SENSOR_INFRARED':
      case 'INFRARED':
        return 'eye-outline';
      case 'SENSOR_SMOKE':
      case 'SMOKE':
        return 'flame-outline';
      case 'SENSOR_TEMPERATURE':
      case 'TEMPERATURE':
        return 'thermometer-outline';
      case 'MODULE_ALARM':
      case 'ALARM':
        return 'shield-checkmark-outline';
      default:
        return 'hardware-chip-outline';
    }
  };

  const getSensorTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'co2': return 'Capteur CO₂';
      case 'infrared': return 'Détecteur infrarouge';
      case 'smoke': return 'Détecteur de fumée';
      case 'temperature': return 'Capteur de température';
      default: return 'Capteur';
    }
  };

  const getDeviceTypeLabel = (type: string) => {
    switch (type) {
      case 'SENSOR_CO2':
        return 'Capteur CO₂';
      case 'SENSOR_TEMPERATURE':
        return 'Capteur Température';
      case 'SENSOR_INFRARED':
        return 'Détecteur IR';
      case 'SENSOR_SMOKE':
        return 'Détecteur Fumée';
      case 'MODULE_ALARM':
        return 'Module Alarme';
      default:
        return type;
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (typeof window !== 'undefined' && window.navigator?.clipboard) {
        await window.navigator.clipboard.writeText(text);
      } else if (typeof window !== 'undefined') {
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
      showInfo('Copié', `${label} copié dans le presse-papiers`);
    } catch (error) {
      showInfo('Erreur', 'Impossible de copier');
    }
  };

  const handleCreateDevice = async () => {
    if (!isAuthenticated) return;
    if (!deviceForm.name || !deviceForm.location) {
      showInfo('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const defaults = getDeviceDefaults(deviceForm.type, deviceForm.temperatureUnit);

    try {
      const device = await api.devices.create({
        name: deviceForm.name,
        type: deviceForm.type,
        location: deviceForm.location,
        threshold: defaults.threshold,
        unit: defaults.unit,
      });
      
      // Fermer la modale d'ajout immédiatement
      setShowAddDevice(false);
      
      // Réinitialiser le formulaire
      setDeviceForm({
        name: '',
        type: 'SENSOR_CO2',
        location: '',
        temperatureUnit: 'C',
      });
      
      // Rafraîchir la liste
      await refresh();
      
      // Afficher l'alerte de succès avec l'ID
      showAlert({
        title: 'Device créé',
        message: `ID du device: ${device.id}\n\nCopiez cet ID pour le configurer dans votre centrale.`,
        buttons: [
          {
            text: 'Copier l\'ID',
            onPress: () => {
              copyToClipboard(device.id, 'ID du device');
            },
          },
          { 
            text: 'OK',
          },
        ],
      });
    } catch (error: any) {
      showInfo('Erreur', error.message || 'Impossible de créer le device');
    }
  };

  const handleDeleteDevice = async (deviceId: string, deviceName: string) => {
    showConfirm(
      'Supprimer le capteur',
      `Êtes-vous sûr de vouloir supprimer "${deviceName}" ?\n\nCette action est irréversible.`,
      async () => {
        try {
          await api.devices.delete(deviceId);
          setSelectedSensor(null);
          await refresh();
          showInfo('Succès', 'Capteur supprimé avec succès');
        } catch (error: any) {
          console.error('❌ Erreur lors de la suppression:', error);
          showInfo('Erreur', error.message || 'Impossible de supprimer le capteur');
        }
      },
      'Supprimer',
      true
    );
  };

  // Charger l'historique quand un capteur est sélectionné ou que la période change
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedSensor || !isReal || !isAuthenticated) {
        setHistoryData([]);
        return;
      }

      // Ne pas afficher le loader si c'est un rafraîchissement automatique
      // pour éviter le clignotement constant
      setLoadingHistory(false);
      try {
        console.log('📊 Chargement historique pour device:', selectedSensor.id, 'période:', historyPeriod);
        const data = await api.devices.getHistory(selectedSensor.id, historyPeriod);
        console.log('📊 Données historiques reçues:', data?.length || 0, 'points');
        setHistoryData(data || []);
      } catch (error: any) {
        console.error('❌ Erreur lors du chargement de l\'historique:', error);
        console.error('❌ Détails de l\'erreur:', {
          message: error?.message,
          stack: error?.stack,
          deviceId: selectedSensor.id,
          period: historyPeriod,
        });
        // Ne pas vider les données en cas d'erreur pour garder l'affichage précédent
        // setHistoryData([]);
        // Afficher un message d'erreur à l'utilisateur si nécessaire
        if (error?.message && !error.message.includes('404')) {
          // Ne pas afficher l'erreur à chaque rafraîchissement automatique
          // showInfo('Erreur', `Impossible de charger l'historique: ${error.message}`);
        }
      } finally {
        setLoadingHistory(false);
      }
    };

    // Charger immédiatement
    setLoadingHistory(true);
    loadHistory();

    // Rafraîchir automatiquement toutes les 5 secondes
    const intervalId = setInterval(() => {
      loadHistory();
    }, 5000); // 5 secondes

    // Nettoyer l'intervalle quand le composant est démonté ou les dépendances changent
    return () => {
      clearInterval(intervalId);
    };
  }, [selectedSensor?.id, historyPeriod, isReal, isAuthenticated]);

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
          <View style={styles.headerActions}>
            {isDemo && (
              <Text style={styles.demoLabel}>Données démo</Text>
            )}
            {isReal && (
              <Pressable
                onPress={() => {
                  if (!isAuthenticated) {
                    showInfo('Authentification requise', 'Vous devez être connecté pour ajouter un capteur.');
                    return;
                  }
                  setShowAddDevice(true);
                }}
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={styles.addButtonText}>Ajouter</Text>
              </Pressable>
            )}
          </View>
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
              {Platform.OS === 'web' && (
                <style>{`
                  .preventis-scroll-view {
                    padding-right: 8px;
                  }
                  .preventis-scroll-view::-webkit-scrollbar {
                    width: 8px;
                  }
                  .preventis-scroll-view::-webkit-scrollbar-track {
                    background: transparent;
                    margin: 4px 0;
                  }
                  .preventis-scroll-view::-webkit-scrollbar-thumb {
                    background: ${colors.primary}66;
                    border-radius: 4px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                  }
                  .preventis-scroll-view::-webkit-scrollbar-thumb:hover {
                    background: ${colors.primary}99;
                    background-clip: padding-box;
                  }
                `}</style>
              )}
            <Pressable
              style={styles.detailBackdrop}
              onPress={() => setSelectedSensor(null)}
            />
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={styles.detailHeaderLeft}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons 
                      name={getSensorIcon(selectedSensor.type)} 
                      size={28} 
                      color={colors.primary} 
                    />
                  </View>
                  <View style={styles.detailTitleContainer}>
                    <Text style={styles.detailTitle}>{selectedSensor.name}</Text>
                    <Text style={styles.detailSubtitle}>{getSensorTypeLabel(selectedSensor.type)}</Text>
                  </View>
                </View>
                <Pressable 
                  onPress={() => setSelectedSensor(null)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                </Pressable>
              </View>

              <ScrollView 
                style={styles.detailScrollView}
                contentContainerStyle={styles.detailScrollContent}
                showsVerticalScrollIndicator={true}
                indicatorStyle="white"
                {...(Platform.OS === 'web' && { className: 'preventis-scroll-view' })}
              >
                {/* Carte principale - Valeur actuelle */}
                <View style={styles.mainValueCard}>
                  <View style={styles.mainValueContent}>
                    <Text style={styles.mainValueLabel}>Valeur actuelle</Text>
                    <View style={styles.mainValueRow}>
                      <Text style={styles.mainValue}>
                        {selectedSensor.value}
                        <Text style={styles.mainValueUnit}> {selectedSensor.unit || ''}</Text>
                      </Text>
                      <StatusBadge status={selectedSensor.status?.toLowerCase() as any} />
                    </View>
                  </View>
                  {selectedSensor.batteryLevel !== undefined && (
                    <View style={styles.batteryIndicator}>
                      <Ionicons 
                        name={selectedSensor.batteryLevel > 20 ? "battery-full" : "battery-dead"} 
                        size={20} 
                        color={selectedSensor.batteryLevel > 20 ? colors.success : colors.danger} 
                      />
                      <Text style={styles.batteryText}>{selectedSensor.batteryLevel}%</Text>
                    </View>
                  )}
                </View>

                {/* Informations détaillées en grille */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoCard}>
                    <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.infoCardLabel}>Localisation</Text>
                    <Text style={styles.infoCardValue}>{selectedSensor.location}</Text>
                  </View>
                  
                  <View style={styles.infoCard}>
                    <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
                    <Text style={styles.infoCardLabel}>Seuil d'alerte</Text>
                    <Text style={styles.infoCardValue}>
                      {selectedSensor.threshold} {selectedSensor.unit || ''}
                    </Text>
                  </View>
                </View>

                {/* ID du device - copiable */}
                <View style={styles.deviceIdCard}>
                  <View style={styles.deviceIdHeader}>
                    <Ionicons name="finger-print-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.deviceIdLabel}>ID du device</Text>
                  </View>
                  <Pressable
                    onPress={() => copyToClipboard(selectedSensor.id, 'ID du device')}
                    style={styles.deviceIdRow}
                  >
                    <Text style={styles.deviceId} selectable>
                      {selectedSensor.id}
                    </Text>
                    <Ionicons name="copy-outline" size={18} color={colors.primary} />
                  </Pressable>
                </View>

                {/* Graphique historique */}
                {isReal && isAuthenticated && (
                  <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyTitleContainer}>
                        <Ionicons name="analytics-outline" size={20} color={colors.primary} />
                        <Text style={styles.historyTitle}>Historique des valeurs</Text>
                      </View>
                      <View style={styles.periodSelector}>
                        {(['15m', '1h', '6h', '24h', '7d'] as const).map((period) => (
                          <Pressable
                            key={period}
                            onPress={() => setHistoryPeriod(period)}
                            style={[
                              styles.periodButton,
                              historyPeriod === period && styles.periodButtonActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.periodButtonText,
                                historyPeriod === period && styles.periodButtonTextActive,
                              ]}
                            >
                              {period === '15m' ? '15m' : period === '1h' ? '1h' : period === '6h' ? '6h' : period === '24h' ? '24h' : '7j'}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    {loadingHistory ? (
                      <View style={styles.historyLoading}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.historyLoadingText}>Chargement de l'historique...</Text>
                      </View>
                    ) : (
                      <View style={styles.chartWrapper}>
                        <DeviceHistoryChart
                          data={historyData}
                          unit={selectedSensor.unit || ''}
                          threshold={selectedSensor.threshold}
                          period={historyPeriod}
                        />
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>

              <View style={styles.detailActions}>
                <Pressable style={styles.actionButton} onPress={refresh}>
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Rafraîchir</Text>
                </Pressable>
                {isReal && isAuthenticated && (
                  <Pressable
                    style={[styles.actionButton, styles.deleteActionButton]}
                    onPress={() => {
                      if (!selectedSensor || !selectedSensor.id) {
                        showInfo('Erreur', 'Capteur invalide');
                        return;
                      }
                      handleDeleteDevice(selectedSensor.id, selectedSensor.name);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    <Text style={[styles.actionButtonText, styles.deleteActionButtonText]}>
                      Supprimer
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>

      {/* Modal: Ajouter un device */}
      <Modal
        visible={showAddDevice}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddDevice(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un capteur/module</Text>
              <Pressable onPress={() => setShowAddDevice(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Nom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Capteur CO2 Salon"
                placeholderTextColor={colors.textMuted}
                value={deviceForm.name}
                onChangeText={(text) => setDeviceForm({ ...deviceForm, name: text })}
              />

              <Text style={styles.inputLabel}>Type *</Text>
              <View style={styles.typeSelector}>
                {[
                  { value: 'SENSOR_CO2', label: 'Capteur CO₂', icon: 'cloud-outline' },
                  { value: 'SENSOR_TEMPERATURE', label: 'Température', icon: 'thermometer-outline' },
                  { value: 'SENSOR_INFRARED', label: 'Détecteur IR', icon: 'eye-outline' },
                  { value: 'SENSOR_SMOKE', label: 'Détecteur Fumée', icon: 'flame-outline' },
                  { value: 'MODULE_ALARM', label: 'Module Alarme', icon: 'shield-checkmark' },
                ].map((type) => (
                  <Pressable
                    key={type.value}
                    onPress={() =>
                      setDeviceForm({ ...deviceForm, type: type.value as any })
                    }
                    style={[
                      styles.typeOption,
                      deviceForm.type === type.value && styles.typeOptionActive,
                    ]}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={
                        deviceForm.type === type.value
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        deviceForm.type === type.value && styles.typeOptionTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Localisation *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Salon, Cuisine, Chambre..."
                placeholderTextColor={colors.textMuted}
                value={deviceForm.location}
                onChangeText={(text) =>
                  setDeviceForm({ ...deviceForm, location: text })
                }
              />

              {/* Configuration spécifique selon le type */}
              {deviceForm.type === 'SENSOR_TEMPERATURE' && (
                <>
                  <Text style={styles.inputLabel}>Unité de température *</Text>
                  <View style={styles.unitSelector}>
                    <Pressable
                      onPress={() => setDeviceForm({ ...deviceForm, temperatureUnit: 'C' })}
                      style={[
                        styles.unitOption,
                        deviceForm.temperatureUnit === 'C' && styles.unitOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitOptionText,
                          deviceForm.temperatureUnit === 'C' && styles.unitOptionTextActive,
                        ]}
                      >
                        Celsius (°C)
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setDeviceForm({ ...deviceForm, temperatureUnit: 'F' })}
                      style={[
                        styles.unitOption,
                        deviceForm.temperatureUnit === 'F' && styles.unitOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitOptionText,
                          deviceForm.temperatureUnit === 'F' && styles.unitOptionTextActive,
                        ]}
                      >
                        Fahrenheit (°F)
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* Affichage des paramètres prédéfinis */}
              <View style={styles.presetInfo}>
                <Ionicons name="information-circle" size={16} color={colors.info} />
                <View style={styles.presetInfoContent}>
                  <Text style={styles.presetInfoTitle}>Configuration prédéfinie</Text>
                  <Text style={styles.presetInfoText}>
                    {deviceForm.type === 'SENSOR_CO2' && 'Seuil d\'alerte: 1000 ppm (concentration CO₂ standard)'}
                    {deviceForm.type === 'SENSOR_TEMPERATURE' && 
                      `Seuil d'alerte: ${getDeviceDefaults(deviceForm.type, deviceForm.temperatureUnit).threshold}${getDeviceDefaults(deviceForm.type, deviceForm.temperatureUnit).unit} (température critique)`}
                    {deviceForm.type === 'SENSOR_INFRARED' && 'Détection binaire: mouvement détecté (1) ou non (0)'}
                    {deviceForm.type === 'SENSOR_SMOKE' && 'Seuil d\'alerte: 0.5 %/m (densité de fumée)'}
                    {deviceForm.type === 'MODULE_ALARM' && 'Module de contrôle de l\'alarme (pas de seuil)'}
                  </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowAddDevice(false)}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                    Annuler
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleCreateDevice}
                >
                  <Text style={styles.modalButtonText}>Créer</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
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
  // Add Device Modal
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
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: colors.backgroundTertiary,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: colors.textPrimary,
  },
  // Unit selector
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  unitOptionActive: {
    backgroundColor: colors.infoBg,
    borderColor: colors.primary,
  },
  unitOptionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  unitOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Preset info
  presetInfo: {
    flexDirection: 'row',
    backgroundColor: colors.infoBg,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  presetInfoContent: {
    flex: 1,
  },
  presetInfoTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  presetInfoText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
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
    borderRadius: 24,
    padding: 0,
    width: '94%',
    maxWidth: 600,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    flexDirection: 'column',
    ...shadows.card,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.backgroundSecondary,
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  detailIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  detailTitleContainer: {
    flex: 1,
  },
  detailTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  detailScrollView: {
    flex: 1,
    maxHeight: '100%',
  },
  detailScrollViewWeb: Platform.select({
    web: {
      // Style personnalisé pour la barre de défilement sur web
      // Note: Ces propriétés CSS ne sont pas typées dans React Native
      // mais fonctionnent sur web via react-native-web
    } as any,
    default: {},
  }),
  detailScrollContent: {
    paddingBottom: 20,
    paddingRight: Platform.OS === 'web' ? 8 : 0, // Espace pour la barre de défilement sur web
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  detailContent: {
    padding: 24,
    paddingTop: 20,
  },
  // Main value card
  mainValueCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainValueContent: {
    flex: 1,
  },
  mainValueLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainValue: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  mainValueUnit: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  batteryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  batteryText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  infoCardLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  infoCardValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Device ID card
  deviceIdCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  deviceIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  deviceIdLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  deviceIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  deviceId: {
    flex: 1,
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginRight: 8,
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
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailId: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
    maxWidth: 200,
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
  // History section
  historySection: {
    marginTop: 0,
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.backgroundSecondary,
  },
  historyHeader: {
    marginBottom: 20,
  },
  historyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  historyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  chartWrapper: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  periodButtonActive: {
    backgroundColor: colors.infoBg,
    borderColor: colors.primary,
  },
  periodButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  historyLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  historyLoadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  deleteActionButton: {
    backgroundColor: colors.dangerBg,
  },
  deleteActionButtonText: {
    color: colors.danger,
  },
  debugInfo: {
    padding: 8,
    backgroundColor: colors.warningBg,
    borderRadius: 4,
    flex: 1,
  },
  debugText: {
    color: colors.warning,
    fontSize: 10,
  },
});
