// Types pour le système de sécurité Preventis

export type SensorStatus = 'online' | 'offline' | 'warning' | 'alert';
export type AlertLevel = 'info' | 'warning' | 'critical';
export type AlertType = 'fire' | 'intrusion' | 'system';

export interface Sensor {
  id: string;
  name: string;
  type: 'co2' | 'infrared' | 'smoke' | 'temperature';
  location: string;
  status: SensorStatus;
  value: number;
  unit: string;
  threshold: number;
  lastUpdate: Date;
  batteryLevel?: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  sensorId?: string;
  location: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface Zone {
  id: string;
  name: string;
  sensors: string[];
  status: SensorStatus;
  isArmed: boolean;
}

export interface AlarmState {
  isArmed: boolean;
  mode: 'off' | 'home' | 'away' | 'night';
  sirenActive: boolean;
  lastArmedAt?: Date;
}

export interface SystemStats {
  totalSensors: number;
  onlineSensors: number;
  activeAlerts: number;
  lastIncident?: Date;
}
