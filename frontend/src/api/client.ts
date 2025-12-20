import axios from "axios";
import { useSession } from "../store/useSession";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const apiClient = axios.create({
  baseURL,
  // Usar cookies de sesión cuando el backend las envía (por ejemplo, CSRF + auth por cookie).
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("structapp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // Token inválido/expirado: limpiar sesión y redirigir a login.
      const { setToken, setUser } = useSession.getState();
      setToken(null);
      setUser(undefined);
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
