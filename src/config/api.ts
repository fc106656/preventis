// Configuration API Preventis

const isDev = process.env.NODE_ENV === 'development' || __DEV__;

export const API_CONFIG = {
  // En dev: localhost, en prod: ton API
  baseUrl: isDev 
    ? 'http://localhost:3001/api'
    : 'https://api-preventis.clementfaux.fr/api',
  
  // Timeout des requêtes (ms)
  timeout: 10000,
};

// Helper pour les appels API
export const apiUrl = (endpoint: string) => `${API_CONFIG.baseUrl}${endpoint}`;

export default API_CONFIG;
