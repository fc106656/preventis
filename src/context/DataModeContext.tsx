import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [mode, setModeState] = useState<DataMode>('demo');
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le mode sauvegardé au démarrage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'demo' || saved === 'real') {
        setModeState(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  // Sauvegarder le mode quand il change
  const setMode = (newMode: DataMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  const toggleMode = () => {
    setMode(mode === 'demo' ? 'real' : 'demo');
  };

  // Toujours rendre le provider, même pendant le chargement
  // Le mode par défaut est 'demo' donc c'est safe
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
