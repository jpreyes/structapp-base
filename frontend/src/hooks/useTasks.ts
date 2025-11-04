import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  assignee?: string | null;
  notes?: string | null;
}

export const useTasks = (projectId?: string) =>
  useQuery<Task[]>({
    queryKey: ["tasks", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<Task[]>(`/tasks/${projectId}`);
      return data;
    },
  });
