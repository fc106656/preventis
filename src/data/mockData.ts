import { Sensor, Alert, Zone, AlarmState, SystemStats } from '../types';

// Capteurs fictifs
export const mockSensors: Sensor[] = [
  {
    id: 'co2-001',
    name: 'Capteur CO2 - Salon',
    type: 'co2',
    location: 'Salon',
    status: 'online',
    value: 420,
    unit: 'ppm',
    threshold: 1000,
    lastUpdate: new Date(),
    batteryLevel: 85,
  },
  {
    id: 'co2-002',
    name: 'Capteur CO2 - Cuisine',
    type: 'co2',
    location: 'Cuisine',
    status: 'warning',
    value: 850,
    unit: 'ppm',
    threshold: 1000,
    lastUpdate: new Date(),
    batteryLevel: 72,
  },
  {
    id: 'co2-003',
    name: 'Capteur CO2 - Chambre',
    type: 'co2',
    location: 'Chambre',
    status: 'online',
    value: 380,
    unit: 'ppm',
    threshold: 1000,
    lastUpdate: new Date(),
    batteryLevel: 90,
  },
  {
    id: 'ir-001',
    name: 'Détecteur IR - Entrée',
    type: 'infrared',
    location: 'Entrée',
    status: 'online',
    value: 0,
    unit: '',
    threshold: 1,
    lastUpdate: new Date(),
    batteryLevel: 95,
  },
  {
    id: 'ir-002',
    name: 'Détecteur IR - Couloir',
    type: 'infrared',
    location: 'Couloir',
    status: 'online',
    value: 0,
    unit: '',
    threshold: 1,
    lastUpdate: new Date(),
    batteryLevel: 88,
  },
  {
    id: 'ir-003',
    name: 'Détecteur IR - Garage',
    type: 'infrared',
    location: 'Garage',
    status: 'offline',
    value: 0,
    unit: '',
    threshold: 1,
    lastUpdate: new Date(Date.now() - 3600000),
    batteryLevel: 15,
  },
  {
    id: 'smoke-001',
    name: 'Détecteur Fumée - Salon',
    type: 'smoke',
    location: 'Salon',
    status: 'online',
    value: 0,
    unit: '%',
    threshold: 5,
    lastUpdate: new Date(),
    batteryLevel: 78,
  },
  {
    id: 'temp-001',
    name: 'Capteur Temp - Cuisine',
    type: 'temperature',
    location: 'Cuisine',
    status: 'online',
    value: 22.5,
    unit: '°C',
    threshold: 45,
    lastUpdate: new Date(),
    batteryLevel: 82,
  },
];

// Alertes fictives
export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    type: 'fire',
    level: 'warning',
    title: 'Niveau CO2 élevé',
    message: 'Le niveau de CO2 dans la cuisine approche le seuil critique.',
    sensorId: 'co2-002',
    location: 'Cuisine',
    timestamp: new Date(Date.now() - 300000),
    acknowledged: false,
  },
  {
    id: 'alert-002',
    type: 'system',
    level: 'warning',
    title: 'Capteur hors ligne',
    message: 'Le détecteur IR du garage ne répond plus depuis 1 heure.',
    sensorId: 'ir-003',
    location: 'Garage',
    timestamp: new Date(Date.now() - 3600000),
    acknowledged: false,
  },
  {
    id: 'alert-003',
    type: 'intrusion',
    level: 'info',
    title: 'Mouvement détecté',
    message: 'Mouvement détecté à l\'entrée principale.',
    sensorId: 'ir-001',
    location: 'Entrée',
    timestamp: new Date(Date.now() - 7200000),
    acknowledged: true,
  },
  {
    id: 'alert-004',
    type: 'fire',
    level: 'critical',
    title: 'Fumée détectée',
    message: 'Alerte fumée déclenchée - Vérification requise immédiatement.',
    sensorId: 'smoke-001',
    location: 'Salon',
    timestamp: new Date(Date.now() - 86400000),
    acknowledged: true,
  },
];

// Zones de surveillance
export const mockZones: Zone[] = [
  {
    id: 'zone-1',
    name: 'Rez-de-chaussée',
    sensors: ['co2-001', 'ir-001', 'smoke-001'],
    status: 'online',
    isArmed: true,
  },
  {
    id: 'zone-2',
    name: 'Étage',
    sensors: ['co2-003', 'ir-002'],
    status: 'online',
    isArmed: true,
  },
  {
    id: 'zone-3',
    name: 'Cuisine',
    sensors: ['co2-002', 'temp-001'],
    status: 'warning',
    isArmed: true,
  },
  {
    id: 'zone-4',
    name: 'Garage',
    sensors: ['ir-003'],
    status: 'offline',
    isArmed: false,
  },
];

// État de l'alarme
export const mockAlarmState: AlarmState = {
  isArmed: true,
  mode: 'home',
  sirenActive: false,
  lastArmedAt: new Date(Date.now() - 28800000),
};

// Statistiques système
export const mockSystemStats: SystemStats = {
  totalSensors: mockSensors.length,
  onlineSensors: mockSensors.filter((s) => s.status === 'online').length,
  activeAlerts: mockAlerts.filter((a) => !a.acknowledged).length,
  lastIncident: new Date(Date.now() - 86400000),
};

// Historique des événements (pour le graphique)
export const mockEventHistory = [
  { date: '10/01', alerts: 2, intrusions: 0 },
  { date: '11/01', alerts: 1, intrusions: 1 },
  { date: '12/01', alerts: 0, intrusions: 0 },
  { date: '13/01', alerts: 3, intrusions: 0 },
  { date: '14/01', alerts: 1, intrusions: 2 },
  { date: '15/01', alerts: 2, intrusions: 0 },
  { date: '16/01', alerts: 2, intrusions: 0 },
];
