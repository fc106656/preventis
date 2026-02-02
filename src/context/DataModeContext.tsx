import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

type DataMode = 'demo' | 'real';

interface DataModeContextType {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
  isDemo: boolean;
  isReal: boolean;
  toggleMode: () => void;
  isInitialized: boolean;
}

const DataModeContext = createContext<DataModeContextType | undefined>(undefined);

const STORAGE_KEY = '@preventis_data_mode';

export function DataModeProvider({ children }: { children: React.ReactNode }) {
  console.log('🟠 DataModeProvider: Rendering');
  
  let isAuthenticated = false;
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    console.log('🟠 DataModeProvider: Got auth context, isAuthenticated:', isAuthenticated);
  } catch (error) {
    console.error('❌ DataModeProvider: Error getting auth context:', error);
    // Continue anyway, isAuthenticated will be false
  }
  
  const [mode, setModeState] = useState<DataMode>('demo');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser le mode au démarrage
  useEffect(() => {
    console.log('🟠 DataModeProvider: useEffect triggered, initializing mode...');
    const initializeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        console.log('🟠 DataModeProvider: Loaded mode from storage:', savedMode);
        
        if (savedMode === 'demo' || savedMode === 'real') {
          // Utiliser le mode sauvegardé
          setModeState(savedMode);
          console.log('🟠 DataModeProvider: Using saved mode:', savedMode);
        } else {
          // Pas de mode sauvegardé : mode démo par défaut
          setModeState('demo');
          await AsyncStorage.setItem(STORAGE_KEY, 'demo');
          console.log('🟠 DataModeProvider: No saved mode, defaulting to demo');
        }
        
        setIsInitialized(true);
        console.log('🟠 DataModeProvider: Initialization complete');
      } catch (error) {
        console.error('❌ DataModeProvider: Error initializing mode:', error);
        setModeState('demo');
        setIsInitialized(true);
      }
    };
    
    initializeMode();
  }, []);

  // Réagir aux changements d'authentification : si on se déconnecte en mode réel, passer en démo
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('🟠 DataModeContext: Auth effect triggered, isAuthenticated:', isAuthenticated, 'current mode:', mode);
    
    // Utiliser une fonction pour lire le mode actuel sans dépendre de mode dans les dépendances
    setModeState((currentMode) => {
      // Seulement forcer le passage en démo si on se déconnecte ET qu'on est en mode réel
      // Ne pas toucher au mode si on est authentifié
      if (!isAuthenticated && currentMode === 'real') {
        console.log('🟠 DataModeContext: User logged out, switching to demo mode');
        AsyncStorage.setItem(STORAGE_KEY, 'demo').catch(err => {
          console.error('❌ DataModeContext: Error saving mode on logout:', err);
        });
        return 'demo';
      }
      // Si on est authentifié et en mode réel, garder le mode réel
      // Si on est en mode démo, garder le mode démo (même si authentifié)
      console.log('🟠 DataModeContext: Keeping current mode:', currentMode);
      return currentMode;
    });
    // On ne force PAS le passage en mode réel lors de la connexion
    // L'utilisateur peut rester en mode démo même connecté s'il le souhaite
  }, [isAuthenticated, isInitialized]);

  // Sauvegarder le mode quand il change
  const setMode = (newMode: DataMode) => {
    console.log('🟠 DataModeContext: setMode called with:', newMode);
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(err => {
      console.error('❌ DataModeContext: Error saving mode:', err);
    });
  };

  const toggleMode = () => {
    const newMode = mode === 'demo' ? 'real' : 'demo';
    console.log('🟠 DataModeContext: toggleMode called, switching from', mode, 'to', newMode);
    setMode(newMode);
  };

  return (
    <DataModeContext.Provider
      value={{
        mode,
        setMode,
        isDemo: mode === 'demo',
        isReal: mode === 'real',
        toggleMode,
        isInitialized,
      }}
    >
      {children}
    </DataModeContext.Provider>
  );
}

export function useDataMode() {
  const context = useContext(DataModeContext);
  if (!context) {
    throw new Error('useDataMode must be used within DataModeProvider');
  }
  return context;
}

export default DataModeContext;
