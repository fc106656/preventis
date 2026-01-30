import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG, apiUrl } from '../config/api';
import { useDataMode } from '../context/DataModeContext';

export interface ApiStatus {
  isConnected: boolean;
  isChecking: boolean;
  latency: number | null;
  error: string | null;
  lastCheck: Date | null;
}

export function useApiStatus() {
  const { isReal } = useDataMode();
  const [status, setStatus] = useState<ApiStatus>({
    isConnected: false,
    isChecking: false,
    latency: null,
    error: null,
    lastCheck: null,
  });

  const checkConnection = useCallback(async () => {
    // En mode démo, pas de vérification
    if (!isReal) {
      setStatus({
        isConnected: false,
        isChecking: false,
        latency: null,
        error: null,
        lastCheck: null,
      });
      return;
    }

    setStatus((prev) => ({ ...prev, isChecking: true, error: null }));

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      const response = await fetch(apiUrl('/health'), {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error('API status not OK');
      }

      setStatus({
        isConnected: true,
        isChecking: false,
        latency,
        error: null,
        lastCheck: new Date(),
      });
    } catch (err: any) {
      let errorMessage = 'Connexion impossible';

      if (err.name === 'AbortError') {
        errorMessage = 'Timeout - API ne répond pas';
      } else if (err.message.includes('fetch')) {
        errorMessage = 'API inaccessible';
      } else if (err.message.includes('HTTP')) {
        errorMessage = `Erreur serveur (${err.message})`;
      } else {
        errorMessage = err.message || 'Erreur inconnue';
      }

      setStatus({
        isConnected: false,
        isChecking: false,
        latency: null,
        error: errorMessage,
        lastCheck: new Date(),
      });
    }
  }, [isReal]);

  // Vérifier au montage et quand le mode change
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Vérifier périodiquement en mode réel (toutes les 30s)
  useEffect(() => {
    if (!isReal) return;

    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [isReal, checkConnection]);

  return { ...status, refresh: checkConnection };
}
