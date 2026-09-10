import axios from 'axios';
import { ApiResponse } from '@recruitment-platform/shared';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically if available in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchApi<T>(url: string, options?: Parameters<typeof apiClient.get>[1]): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, options);
  if (response.data.error) {
    throw new Error(response.data.error.message || 'API request failed');
  }
  return response.data.data;
}
