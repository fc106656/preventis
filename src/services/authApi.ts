// Service API pour l'authentification
import { API_CONFIG, apiUrl } from '../config/api';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  token: string;
}

interface RegisterResponse extends LoginResponse {
  apiKey: string;
  message: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (email: string, password: string, name?: string): Promise<RegisterResponse> => {
    return request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  getMe: async (token: string) => {
    return request('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getApiKeys: async (token: string) => {
    return request('/auth/api-keys', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  createApiKey: async (token: string, name?: string) => {
    return request('/auth/api-keys', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
  },
};
