// Axios клиент с автоматическим retry для холодного старта Render

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 сек — Render может просыпаться до 30 сек
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Retry interceptor
// Повторяет запрос если Render ещё спит (ERR_NETWORK / 503)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Только для сетевых ошибок или 503 (сервер спит)
    const isRetryable =
      !error.response || error.response.status === 503;

    if (isRetryable && !config._retryCount) {
      config._retryCount = 0;
    }

    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 3000; // 3 сек между попытками

    if (isRetryable && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      console.warn(
        `API недоступен, повтор ${config._retryCount}/${MAX_RETRIES}...`
      );
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

// Typed helpers
export async function fetchStreamers() {
  try {
    const { data } = await apiClient.get('/api/streamers');
    return data;
  } catch (err) {
    console.error('Error fetching streamers:', err);
    return []; // Возвращаем пустой массив — компонент покажет placeholder
  }
}

export async function fetchNews() {
  try {
    const { data } = await apiClient.get('/api/news');
    return data;
  } catch (err) {
    console.error('Error fetching news:', err);
    return [];
  }
}

export async function fetchTeam() {
  try {
    const { data } = await apiClient.get('/api/team');
    return data;
  } catch (err) {
    console.error('Error fetching team:', err);
    return [];
  }
}

export async function fetchMerch() {
  try {
    const { data } = await apiClient.get('/api/merch');
    return data;
  } catch (err) {
    console.error('Error fetching merch:', err);
    return [];
  }
}

export default apiClient;
