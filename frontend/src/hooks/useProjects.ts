import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

export interface Project {
  id: string;
  name: string;
  status: string;
  mandante?: string | null;
  budget?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

export const useProjects = () =>
  useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await apiClient.get<Project[]>("/projects");
      return data;
    },
  });
