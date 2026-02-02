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
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error = await response.json();
      // Construire un message d'erreur détaillé
      errorMessage = error.error || error.message || errorMessage;
      
      // Ajouter les détails si disponibles
      if (error.details) {
        errorMessage += `: ${error.details}`;
      }
      if (error.code) {
        errorMessage += ` (Code: ${error.code})`;
      }
      
      console.error('API Error:', { status: response.status, error, endpoint });
    } catch (e) {
      const text = await response.text().catch(() => 'Erreur inconnue');
      errorMessage = text || errorMessage;
      console.error('API Error (text):', { status: response.status, text, endpoint });
    }
    throw new Error(errorMessage);
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

  register: async (email: string, password: string, name?: string, secretCode?: string): Promise<RegisterResponse> => {
    return request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, secretCode }),
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

  deleteApiKey: async (token: string, id: string) => {
    return request(`/auth/api-keys/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
