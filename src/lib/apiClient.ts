import { axiosInstance } from './axios';

export const apiClient = async <T>(
  endpoint: string,
  options: { method?: string; data?: unknown; headers?: Record<string, string> } = {}
): Promise<T> => {
  const res = await axiosInstance({
    url: endpoint,
    method: options.method || 'GET',
    data: options.data,
    headers: options.headers,
  });
  return res as T;
};
