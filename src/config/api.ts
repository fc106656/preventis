// Configuration API Preventis

// Toujours utiliser l'API de production
export const API_CONFIG = {
  baseUrl: 'https://api-preventis.stark-server.fr/api',
  
  // Timeout des requêtes (ms)
  timeout: 10000,
};

// Log pour debug
if (typeof window !== 'undefined') {
  console.log('🔧 API Config:', {
    hostname: window.location.hostname,
    baseUrl: API_CONFIG.baseUrl,
  });
}

// Helper pour les appels API
export const apiUrl = (endpoint: string) => `${API_CONFIG.baseUrl}${endpoint}`;

export default API_CONFIG;
