import { useState, useEffect, useCallback, useRef } from 'react';
import { useDataMode } from '../context/DataModeContext';
import { api } from '../services/api';
import {
  mockSensors,
  mockAlerts,
  mockZones,
  mockAlarmState,
  mockSystemStats,
} from '../data/mockData';

// Hook pour les capteurs
export function useSensors() {
  const { isDemo, mode } = useDataMode();
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastMode = useRef(mode);

  const fetchSensors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Mode démo : données fictives
    if (isDemo) {
      setSensors(mockSensors);
      setLoading(false);
      return;
    }

    // Mode réel : appel API (utiliser devices au lieu de sensors)
    try {
      const data = await api.devices.getAll();
      setSensors(data);
    } catch (err: any) {
      console.error('API Error (sensors):', err.message);
      setError(err.message);
      setSensors([]); // PAS de fallback, données vides
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  // Fetch initial + refetch quand le mode change
  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  // Force refetch quand le mode change
  useEffect(() => {
    if (lastMode.current !== mode) {
      lastMode.current = mode;
      fetchSensors();
    }
  }, [mode, fetchSensors]);

  return { sensors, loading, error, refresh: fetchSensors };
}

// Hook pour les alertes
export function useAlerts() {
  const { isDemo, mode } = useDataMode();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastMode = useRef(mode);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Mode démo : données fictives
    if (isDemo) {
      setAlerts(mockAlerts);
      setLoading(false);
      return;
    }

    // Mode réel : appel API
    try {
      const data = await api.alerts.getAll();
      setAlerts(data);
    } catch (err: any) {
      console.error('API Error (alerts):', err.message);
      setError(err.message);
      setAlerts([]); // PAS de fallback, données vides
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  const acknowledgeAlert = useCallback(async (id: string) => {
    if (isDemo) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
      );
      return;
    }

    try {
      await api.alerts.acknowledge(id);
      fetchAlerts();
    } catch (err: any) {
      setError(err.message);
    }
  }, [isDemo, fetchAlerts]);

  const acknowledgeAll = useCallback(async () => {
    if (isDemo) {
      setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
      return;
    }

    try {
      await api.alerts.acknowledgeAll();
      fetchAlerts();
    } catch (err: any) {
      setError(err.message);
    }
  }, [isDemo, fetchAlerts]);

  // Fetch initial
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Force refetch quand le mode change
  useEffect(() => {
    if (lastMode.current !== mode) {
      lastMode.current = mode;
      fetchAlerts();
    }
  }, [mode, fetchAlerts]);

  return { alerts, loading, error, refresh: fetchAlerts, acknowledgeAlert, acknowledgeAll };
}

// Hook pour les zones
export function useZones() {
  const { isDemo, mode } = useDataMode();
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastMode = useRef(mode);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Mode démo : données fictives
    if (isDemo) {
      setZones(mockZones);
      setLoading(false);
      return;
    }

    // Mode réel : appel API
    try {
      const data = await api.zones.getAll();
      setZones(data);
    } catch (err: any) {
      console.error('API Error (zones):', err.message);
      setError(err.message);
      setZones([]); // PAS de fallback, données vides
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  const toggleZoneArm = useCallback(async (id: string, isArmed: boolean) => {
    if (isDemo) {
      setZones((prev) =>
        prev.map((z) => (z.id === id ? { ...z, isArmed } : z))
      );
      return;
    }

    try {
      await api.zones.setArmed(id, isArmed);
      fetchZones();
    } catch (err: any) {
      setError(err.message);
    }
  }, [isDemo, fetchZones]);

  // Fetch initial
  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Force refetch quand le mode change
  useEffect(() => {
    if (lastMode.current !== mode) {
      lastMode.current = mode;
      fetchZones();
    }
  }, [mode, fetchZones]);

  return { zones, loading, error, refresh: fetchZones, toggleZoneArm };
}

// Hook pour l'alarme
export function useAlarm() {
  const { isDemo, mode } = useDataMode();
  const [alarmState, setAlarmState] = useState({
    isArmed: false,
    mode: 'off' as 'off' | 'home' | 'away' | 'night',
    sirenActive: false,
    lastArmedAt: undefined as Date | undefined,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastMode = useRef(mode);

  const fetchAlarm = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Mode démo : données fictives
    if (isDemo) {
      setAlarmState(mockAlarmState);
      setLoading(false);
      return;
    }

    // Mode réel : appel API
    try {
      const data = await api.alarm.getState();
      setAlarmState({
        isArmed: data.isArmed,
        mode: data.mode?.toLowerCase() as any,
        sirenActive: data.sirenActive,
        lastArmedAt: data.lastArmedAt ? new Date(data.lastArmedAt) : undefined,
      });
    } catch (err: any) {
      console.error('API Error (alarm):', err.message);
      setError(err.message);
      // État par défaut si API échoue (désarmé)
      setAlarmState({
        isArmed: false,
        mode: 'off',
        sirenActive: false,
        lastArmedAt: undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  const setMode = useCallback(async (newMode: 'off' | 'home' | 'away' | 'night') => {
    if (isDemo) {
      setAlarmState((prev) => ({
        ...prev,
        mode: newMode,
        isArmed: newMode !== 'off',
        lastArmedAt: newMode !== 'off' ? new Date() : prev.lastArmedAt,
      }));
      return;
    }

    try {
      await api.alarm.setMode(newMode.toUpperCase() as any);
      fetchAlarm();
    } catch (err: any) {
      setError(err.message);
    }
  }, [isDemo, fetchAlarm]);

  const toggleSiren = useCallback(async (active: boolean) => {
    if (isDemo) {
      setAlarmState((prev) => ({ ...prev, sirenActive: active }));
      return;
    }

    try {
      await api.alarm.setSiren(active);
      fetchAlarm();
    } catch (err: any) {
      setError(err.message);
    }
  }, [isDemo, fetchAlarm]);

  // Fetch initial
  useEffect(() => {
    fetchAlarm();
  }, [fetchAlarm]);

  // Force refetch quand le mode change
  useEffect(() => {
    if (lastMode.current !== mode) {
      lastMode.current = mode;
      fetchAlarm();
    }
  }, [mode, fetchAlarm]);

  return { alarmState, loading, error, refresh: fetchAlarm, setMode, toggleSiren };
}

// Hook pour les stats
export function useStats() {
  const { isDemo, mode } = useDataMode();
  const [stats, setStats] = useState({
    totalSensors: 0,
    onlineSensors: 0,
    activeAlerts: 0,
    lastIncident: undefined as Date | undefined,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastMode = useRef(mode);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Mode démo : données fictives
    if (isDemo) {
      setStats(mockSystemStats);
      setLoading(false);
      return;
    }

    // Mode réel : appel API
    try {
      const data = await api.stats.getAll();
      setStats({
        totalSensors: data.sensors?.total || 0,
        onlineSensors: data.sensors?.online || 0,
        activeAlerts: data.alerts?.active || 0,
        lastIncident: data.lastIncident ? new Date(data.lastIncident) : undefined,
      });
    } catch (err: any) {
      console.error('API Error (stats):', err.message);
      setError(err.message);
      // Stats vides si API échoue
      setStats({
        totalSensors: 0,
        onlineSensors: 0,
        activeAlerts: 0,
        lastIncident: undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  // Fetch initial
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Force refetch quand le mode change
  useEffect(() => {
    if (lastMode.current !== mode) {
      lastMode.current = mode;
      fetchStats();
    }
  }, [mode, fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
