// Configuration API Preventis

// Détection de l'environnement : production si NODE_ENV=production ou si on est sur le web en production
const isDev = 
  process.env.NODE_ENV === 'development' || 
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost');

export const API_CONFIG = {
  // En dev: localhost, en prod: ton API
  baseUrl: isDev 
    ? 'http://localhost:3001/api'
    : 'https://api-preventis.stark-server.fr/api',
  
  // Timeout des requêtes (ms)
  timeout: 10000,
};

// Helper pour les appels API
export const apiUrl = (endpoint: string) => `${API_CONFIG.baseUrl}${endpoint}`;

export default API_CONFIG;
