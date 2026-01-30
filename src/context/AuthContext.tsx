// Contexte d'authentification
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/authApi';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  apiKey: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, secretCode?: string) => Promise<{ apiKey: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOKEN: '@preventis:token',
  USER: '@preventis:user',
  API_KEY: '@preventis:apiKey',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les données depuis le stockage au démarrage
  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const [storedToken, storedUser, storedApiKey] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedApiKey) {
          setApiKey(storedApiKey);
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await authApi.login(email, password);
      setToken(response.token);
      setUser(response.user);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user)),
      ]);
    } catch (error: any) {
      throw new Error(error.message || 'Erreur de connexion');
    }
  }

  async function register(email: string, password: string, name?: string, secretCode?: string) {
    try {
      const response = await authApi.register(email, password, name, secretCode);
      setToken(response.token);
      setUser(response.user);
      setApiKey(response.apiKey);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user)),
        AsyncStorage.setItem(STORAGE_KEYS.API_KEY, response.apiKey),
      ]);

      return { apiKey: response.apiKey };
    } catch (error: any) {
      throw new Error(error.message || 'Erreur d\'inscription');
    }
  }

  async function logout() {
    try {
      setUser(null);
      setToken(null);
      setApiKey(null);

      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.API_KEY),
      ]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  const value: AuthContextType = {
    user,
    token,
    apiKey,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
