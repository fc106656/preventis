import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { useDataMode } from '../../src/context/DataModeContext';
import { api } from '../../src/services/api';

interface LogEntry {
  id: string;
  type: string;
  message: string;
  data: string | null;
  createdAt: string;
}

type FilterType = 'all' | 'COAP_INFO' | 'COAP_ERROR';

export default function LogsScreen() {
  const { isDemo } = useDataMode();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});

  const fetchLogs = async () => {
    try {
      setError(null);
      // Ne pas inclure le paramètre type si on veut tous les logs
      const params: { limit: number; type?: string } = { limit: 100 };
      if (filter !== 'all') {
        params.type = filter;
      }
      // @ts-ignore - logs API is available at runtime
      const response = await api.logs.getAll(params);
      
      setLogs(response.logs);
      setStats(response.stats.byType);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
  };

  const filteredLogs = logs;

  const getLogTypeIcon = (type: string) => {
    if (type.includes('ERROR')) return 'alert-circle';
    if (type.includes('INFO')) return 'information-circle';
    return 'document-text';
  };

  const getLogTypeColor = (type: string) => {
    if (type.includes('ERROR')) return colors.danger;
    if (type.includes('INFO')) return colors.info;
    return colors.textSecondary;
  };

  const getLogTypeLabel = (type: string) => {
    if (type.startsWith('COAP_')) {
      return type.replace('COAP_', '');
    }
    return type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseLogData = (data: string | null) => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  };

  const totalLogs = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const infoCount = stats['COAP_INFO'] || 0;
  const errorCount = stats['COAP_ERROR'] || 0;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Ionicons name="document-text" size={24} color={colors.info} />
            <Text style={styles.summaryValue}>{totalLogs}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.summaryValue}>{infoCount}</Text>
            <Text style={styles.summaryLabel}>Info</Text>
          </View>
          <View style={[styles.summaryCard, errorCount > 0 && styles.summaryCardError]}>
            <Ionicons name="alert-circle" size={24} color={errorCount > 0 ? colors.danger : colors.textMuted} />
            <Text style={styles.summaryValue}>{errorCount}</Text>
            <Text style={styles.summaryLabel}>Erreurs</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Pressable
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Tous
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, filter === 'COAP_INFO' && styles.filterButtonActive]}
            onPress={() => setFilter('COAP_INFO')}
          >
            <Text style={[styles.filterText, filter === 'COAP_INFO' && styles.filterTextActive]}>
              Info
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, filter === 'COAP_ERROR' && styles.filterButtonActive]}
            onPress={() => setFilter('COAP_ERROR')}
          >
            <Text style={[styles.filterText, filter === 'COAP_ERROR' && styles.filterTextActive]}>
              Erreurs
            </Text>
          </Pressable>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun log trouvé</Text>
          </View>
        ) : (
          <View style={styles.logsContainer}>
            {filteredLogs.map((log) => {
              const logData = parseLogData(log.data);
              const hasData = logData !== null;

              return (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={styles.logHeaderLeft}>
                      <Ionicons
                        name={getLogTypeIcon(log.type)}
                        size={20}
                        color={getLogTypeColor(log.type)}
                      />
                      <View style={styles.logTypeContainer}>
                        <Text style={[styles.logType, { color: getLogTypeColor(log.type) }]}>
                          {getLogTypeLabel(log.type)}
                        </Text>
                        <Text style={styles.logTime}>{formatDate(log.createdAt)}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.logMessage}>{log.message}</Text>
                  
                  {hasData && (
                    <View style={styles.logDataContainer}>
                      <Text style={styles.logDataLabel}>Données:</Text>
                      <Text style={styles.logData} numberOfLines={3}>
                        {typeof logData === 'string' 
                          ? logData 
                          : JSON.stringify(logData, null, 2)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  summaryCardError: {
    borderColor: colors.danger,
    backgroundColor: colors.cardBackground,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textPrimary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.danger + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 16,
  },
  logsContainer: {
    gap: 12,
  },
  logCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logTypeContainer: {
    flex: 1,
  },
  logType: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  logTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  logMessage: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  logDataContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  logDataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  logData: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: colors.backgroundTertiary,
    padding: 8,
    borderRadius: 6,
  },
});
