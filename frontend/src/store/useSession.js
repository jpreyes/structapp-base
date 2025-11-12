import { create } from "zustand";
export const useSession = create((set) => ({
    token: localStorage.getItem("structapp_token"),
    user: (() => {
        const raw = localStorage.getItem("structapp_user");
        if (!raw) {
            return undefined;
        }
        try {
            return JSON.parse(raw);
        }
        catch {
            localStorage.removeItem("structapp_user");
            return undefined;
        }
    })(),
    projectId: undefined,
    setToken: (token) => {
        if (token) {
            localStorage.setItem("structapp_token", token);
        }
        else {
            localStorage.removeItem("structapp_token");
        }
        set({ token });
    },
    setUser: (user) => {
        if (user) {
            localStorage.setItem("structapp_user", JSON.stringify(user));
        }
        else {
            localStorage.removeItem("structapp_user");
        }
        set({ user });
    },
    setProject: (projectId) => set({ projectId }),
}));
