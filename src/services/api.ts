// Service API pour Preventis
import { API_CONFIG, apiUrl } from '../config/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
}

// Fonction générique pour les appels API
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
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
    return request<any[]>(`/sensors${query}`);
  },
  
  getById: (id: string) => request<any>(`/sensors/${id}`),
  
  create: (data: any) => request<any>('/sensors', { method: 'POST', body: data }),
  
  update: (id: string, data: any) => request<any>(`/sensors/${id}`, { method: 'PUT', body: data }),
  
  updateValue: (id: string, value: number, batteryLevel?: number) => 
    request<any>(`/sensors/${id}/value`, { method: 'PUT', body: { value, batteryLevel } }),
  
  delete: (id: string) => request<any>(`/sensors/${id}`, { method: 'DELETE' }),
};

// ============ ALERTS ============

export const alertsApi = {
  getAll: (params?: { type?: string; level?: string; acknowledged?: boolean }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<any[]>(`/alerts${query}`);
  },
  
  getActive: () => request<any[]>('/alerts/active'),
  
  getById: (id: string) => request<any>(`/alerts/${id}`),
  
  create: (data: any) => request<any>('/alerts', { method: 'POST', body: data }),
  
  acknowledge: (id: string) => request<any>(`/alerts/${id}/acknowledge`, { method: 'PUT' }),
  
  acknowledgeAll: () => request<any>('/alerts/acknowledge-all', { method: 'PUT' }),
  
  delete: (id: string) => request<any>(`/alerts/${id}`, { method: 'DELETE' }),
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
  getState: () => request<any>('/alarm'),
  
  setMode: (mode: 'OFF' | 'HOME' | 'AWAY' | 'NIGHT') => 
    request<any>('/alarm/mode', { method: 'PUT', body: { mode } }),
  
  setSiren: (active: boolean) => 
    request<any>('/alarm/siren', { method: 'PUT', body: { active } }),
  
  trigger: (reason?: string, sensorId?: string) => 
    request<any>('/alarm/trigger', { method: 'POST', body: { reason, sensorId } }),
  
  reset: () => request<any>('/alarm/reset', { method: 'POST' }),
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
