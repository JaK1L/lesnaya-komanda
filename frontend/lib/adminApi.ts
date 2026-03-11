// Admin API клиент с автоматической вставкой токена

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const adminApiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - автоматически добавляет токен
adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - обработка ошибок авторизации
adminApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Если 401 - токен невалидный, удаляем и редиректим на логин
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/admin';
      }
    }

    // Retry логика для холодного старта Render
    const config = error.config;
    const isRetryable = !error.response || error.response.status === 503;

    if (isRetryable && !config._retryCount) {
      config._retryCount = 0;
    }

    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 3000;

    if (isRetryable && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      console.warn(
        `Admin API недоступен, повтор ${config._retryCount}/${MAX_RETRIES}...`
      );
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return adminApiClient(config);
    }

    return Promise.reject(error);
  }
);

// Typed helpers для админки
export async function fetchAdminTeam() {
  const { data } = await adminApiClient.get('/api/admin/team');
  return data;
}

export async function updateTeamMember(discord_id: number, memberData: any) {
  const { data } = await adminApiClient.put(`/api/admin/team/${discord_id}`, memberData);
  return data;
}

export async function removeTeamMember(discord_id: number) {
  const { data } = await adminApiClient.delete(`/api/admin/team/${discord_id}`);
  return data;
}

export async function searchUsers(query: string) {
  const { data } = await adminApiClient.get(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
  return data;
}

export async function fetchAdminMerch() {
  const { data } = await adminApiClient.get('/api/admin/merch');
  return data;
}

export async function createMerchItem(itemData: any) {
  const { data } = await adminApiClient.post('/api/admin/merch', itemData);
  return data;
}

export async function updateMerchItem(id: number, itemData: any) {
  const { data } = await adminApiClient.put(`/api/admin/merch/${id}`, itemData);
  return data;
}

export async function deleteMerchItem(id: number) {
  const { data } = await adminApiClient.delete(`/api/admin/merch/${id}`);
  return data;
}

export default adminApiClient;
