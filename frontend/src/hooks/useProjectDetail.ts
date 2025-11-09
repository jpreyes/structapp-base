import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import { Project } from "./useProjects";
import { Task } from "./useTasks";
import { Payment } from "./usePayments";

export interface ProjectDetail {
  project: Project;
  tasks: Task[];
  payments: Payment[];
  metrics: {
    total_tasks: number;
    completed_tasks: number;
    budget: number;
    payments: {
      facturado: number;
      pagado: number;
      saldo: number;
    };
  };
  important_dates: {
    start_date?: string | null;
    end_date?: string | null;
    next_task_start?: string | null;
    next_task_due?: string | null;
  };
}

export const useProjectDetail = (projectId?: string) =>
  useQuery<ProjectDetail>({
    queryKey: ["project-detail", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectDetail>(`/projects/${projectId}`);
      return data;
    },
  });
