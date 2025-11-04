import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("structapp_token");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export default apiClient;
