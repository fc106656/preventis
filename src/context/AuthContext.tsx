// Contexte d'authentification
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/authApi';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface ApiKey {
  id: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
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
  // Gestion des clés API
  getApiKeys: () => Promise<ApiKey[]>;
  createApiKey: (name?: string) => Promise<{ apiKey: string; message: string }>;
  deleteApiKey: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOKEN: '@preventis:token',
  USER: '@preventis:user',
  API_KEY: '@preventis:apiKey',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('🟡 AuthProvider: Rendering');
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les données depuis le stockage au démarrage
  useEffect(() => {
    console.log('🟡 AuthProvider: useEffect triggered, loading auth...');
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      console.log('🟡 AuthProvider: Loading from AsyncStorage...');
      const [storedToken, storedUser, storedApiKey] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
      ]);

      console.log('🟡 AuthProvider: Loaded from storage:', {
        hasToken: !!storedToken,
        hasUser: !!storedUser,
        hasApiKey: !!storedApiKey,
      });

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedApiKey) {
          setApiKey(storedApiKey);
        }
        console.log('🟡 AuthProvider: Auth data restored');
      } else {
        console.log('🟡 AuthProvider: No stored auth data');
      }
    } catch (error) {
      console.error('❌ AuthProvider: Error loading stored auth:', error);
    } finally {
      console.log('🟡 AuthProvider: Setting loading to false');
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

  async function getApiKeys(): Promise<ApiKey[]> {
    if (!token) throw new Error('Non authentifié');
    try {
      const response = await authApi.getApiKeys(token);
      return response.apiKeys || [];
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la récupération des clés API');
    }
  }

  async function createApiKey(name?: string): Promise<{ apiKey: string; message: string }> {
    if (!token) throw new Error('Non authentifié');
    try {
      const response = await authApi.createApiKey(token, name);
      // Mettre à jour la clé API stockée si c'est la première
      if (!apiKey && response.apiKey?.key) {
        setApiKey(response.apiKey.key);
        await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, response.apiKey.key);
      }
      return {
        apiKey: response.apiKey?.key || '',
        message: response.message || 'Clé API créée',
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la création de la clé API');
    }
  }

  async function deleteApiKey(id: string): Promise<void> {
    if (!token) throw new Error('Non authentifié');
    try {
      await authApi.deleteApiKey(token, id);
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la suppression de la clé API');
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
    getApiKeys,
    createApiKey,
    deleteApiKey,
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
