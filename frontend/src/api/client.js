import axios from "axios";
import { useSession } from "../store/useSession";
const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const apiClient = axios.create({
    baseURL,
    withCredentials: false,
});
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("structapp_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
apiClient.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        const { setToken, setUser } = useSession.getState();
        setToken(null);
        setUser(undefined);
        if (window.location.pathname !== "/login") {
            window.location.replace("/login");
        }
    }
    return Promise.reject(error);
});
export default apiClient;
