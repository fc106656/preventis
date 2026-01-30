// Service API pour Preventis
import { API_CONFIG, apiUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean; // Si true, ajoute le token JWT
}

// Fonction générique pour les appels API
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, requireAuth = false } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Ajouter le token si nécessaire
  if (requireAuth) {
    const token = await AsyncStorage.getItem('@preventis:token');
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(apiUrl(endpoint), config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============ SENSORS ============

export const sensorsApi = {
  getAll: (params?: { type?: string; status?: string; zoneId?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<any[]>(`/sensors${query}`, { requireAuth: true });
  },
  
  getById: (id: string) => request<any>(`/sensors/${id}`, { requireAuth: true }),
  
  create: (data: any) => request<any>('/sensors', { method: 'POST', body: data, requireAuth: true }),
  
  update: (id: string, data: any) => request<any>(`/sensors/${id}`, { method: 'PUT', body: data, requireAuth: true }),
  
  updateValue: (id: string, value: number, batteryLevel?: number) => 
    request<any>(`/sensors/${id}/value`, { method: 'PUT', body: { value, batteryLevel }, requireAuth: true }),
  
  delete: (id: string) => request<any>(`/sensors/${id}`, { method: 'DELETE', requireAuth: true }),
};

// ============ ALERTS ============

export const alertsApi = {
  getAll: (params?: { type?: string; level?: string; acknowledged?: boolean }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<any[]>(`/alerts${query}`, { requireAuth: true });
  },
  
  getActive: () => request<any[]>('/alerts/active', { requireAuth: true }),
  
  getById: (id: string) => request<any>(`/alerts/${id}`, { requireAuth: true }),
  
  create: (data: any) => request<any>('/alerts', { method: 'POST', body: data, requireAuth: true }),
  
  acknowledge: (id: string) => request<any>(`/alerts/${id}/acknowledge`, { method: 'PUT', requireAuth: true }),
  
  acknowledgeAll: () => request<any>('/alerts/acknowledge-all', { method: 'PUT', requireAuth: true }),
  
  delete: (id: string) => request<any>(`/alerts/${id}`, { method: 'DELETE', requireAuth: true }),
};

// ============ ZONES ============

export const zonesApi = {
  getAll: () => request<any[]>('/zones'),
  
  getById: (id: string) => request<any>(`/zones/${id}`),
  
  create: (data: any) => request<any>('/zones', { method: 'POST', body: data }),
  
  update: (id: string, data: any) => request<any>(`/zones/${id}`, { method: 'PUT', body: data }),
  
  setArmed: (id: string, isArmed: boolean) => 
    request<any>(`/zones/${id}/arm`, { method: 'PUT', body: { isArmed } }),
  
  delete: (id: string) => request<any>(`/zones/${id}`, { method: 'DELETE' }),
};

// ============ ALARM ============

export const alarmApi = {
  getState: () => request<any>('/alarm', { requireAuth: true }),
  
  setMode: (mode: 'OFF' | 'HOME' | 'AWAY' | 'NIGHT') => 
    request<any>('/alarm/mode', { method: 'PUT', body: { mode }, requireAuth: true }),
  
  setSiren: (active: boolean) => 
    request<any>('/alarm/siren', { method: 'PUT', body: { active }, requireAuth: true }),
  
  trigger: (reason?: string, sensorId?: string) => 
    request<any>('/alarm/trigger', { method: 'POST', body: { reason, sensorId }, requireAuth: true }),
  
  reset: () => request<any>('/alarm/reset', { method: 'POST', requireAuth: true }),
};

// ============ STATS ============

export const statsApi = {
  getAll: () => request<any>('/stats'),
  
  getHistory: (days?: number) => {
    const query = days ? `?days=${days}` : '';
    return request<any[]>(`/stats/history${query}`);
  },
};

// Export groupé
export const api = {
  sensors: sensorsApi,
  alerts: alertsApi,
  zones: zonesApi,
  alarm: alarmApi,
  stats: statsApi,
};

export default api;
