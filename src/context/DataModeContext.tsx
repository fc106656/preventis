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
}

const DataModeContext = createContext<DataModeContextType | undefined>(undefined);

const STORAGE_KEY = '@preventis_data_mode';

export function DataModeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [mode, setModeState] = useState<DataMode>('demo');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser le mode au démarrage
  useEffect(() => {
    const initializeMode = async () => {
      const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (savedMode === 'demo' || savedMode === 'real') {
        // Utiliser le mode sauvegardé
        setModeState(savedMode);
      } else {
        // Pas de mode sauvegardé : mode démo par défaut
        setModeState('demo');
        await AsyncStorage.setItem(STORAGE_KEY, 'demo');
      }
      
      setIsInitialized(true);
    };
    
    initializeMode();
  }, []);

  // Réagir aux changements d'authentification : si on se déconnecte en mode réel, passer en démo
  useEffect(() => {
    if (!isInitialized) return;
    
    if (!isAuthenticated && mode === 'real') {
      // Si on se déconnecte et qu'on est en mode réel, passer en mode démo
      setModeState('demo');
      AsyncStorage.setItem(STORAGE_KEY, 'demo');
    }
    // On ne force PAS le passage en mode réel lors de la connexion
    // L'utilisateur peut rester en mode démo même connecté s'il le souhaite
  }, [isAuthenticated, isInitialized, mode]);

  // Sauvegarder le mode quand il change
  const setMode = (newMode: DataMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  const toggleMode = () => {
    setMode(mode === 'demo' ? 'real' : 'demo');
  };

  return (
    <DataModeContext.Provider
      value={{
        mode,
        setMode,
        isDemo: mode === 'demo',
        isReal: mode === 'real',
        toggleMode,
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
