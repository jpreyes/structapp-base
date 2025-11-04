import { create } from "zustand";

interface SessionState {
  token: string | null;
  user?: { id: string; email: string; plan: string };
  projectId?: string;
  setToken: (token: string | null) => void;
  setUser: (user: SessionState["user"]) => void;
  setProject: (projectId: string | undefined) => void;
}

export const useSession = create<SessionState>((set) => ({
  token: localStorage.getItem("structapp_token"),
  user: undefined,
  projectId: undefined,
  setToken: (token) => {
    if (token) {
      localStorage.setItem("structapp_token", token);
    } else {
      localStorage.removeItem("structapp_token");
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  setProject: (projectId) => set({ projectId }),
}));
