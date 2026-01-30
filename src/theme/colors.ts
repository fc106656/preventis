// Palette de couleurs Preventis - Thème sécurité moderne

export const colors = {
  // Couleurs de base
  background: '#0D1117',
  backgroundSecondary: '#161B22',
  backgroundTertiary: '#21262D',
  
  // Surfaces et cartes
  cardBackground: '#161B22',
  cardBorder: '#30363D',
  
  // Texte
  textPrimary: '#F0F6FC',
  textSecondary: '#8B949E',
  textMuted: '#6E7681',
  
  // Couleurs d'accent
  primary: '#58A6FF',
  primaryDark: '#1F6FEB',
  
  // États - Sécurité
  success: '#3FB950',
  successDark: '#238636',
  successBg: 'rgba(63, 185, 80, 0.15)',
  
  warning: '#D29922',
  warningDark: '#9E6A03',
  warningBg: 'rgba(210, 153, 34, 0.15)',
  
  danger: '#F85149',
  dangerDark: '#DA3633',
  dangerBg: 'rgba(248, 81, 73, 0.15)',
  
  info: '#58A6FF',
  infoBg: 'rgba(88, 166, 255, 0.15)',
  
  // Status des capteurs
  online: '#3FB950',
  offline: '#6E7681',
  alert: '#F85149',
  
  // Gradients
  gradientFire: ['#F85149', '#FF6B35'],
  gradientSecurity: ['#58A6FF', '#A371F7'],
  gradientSuccess: ['#3FB950', '#56D364'],
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Bordures actives
  borderActive: '#58A6FF',
  borderDefault: '#30363D',
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    shadowColor: '#58A6FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
};
