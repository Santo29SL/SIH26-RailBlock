import { apiClient } from './client';
import { TokenResponse, User } from '../types/auth';

export const authApi = {
  login: async (username: string, password: string): Promise<TokenResponse> => {
    // FastAPI OAuth2 expects form-encoded credentials
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post<TokenResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  seedUsers: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/seed-users');
    return response.data;
  },
};
