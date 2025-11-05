import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

export interface CalculationRun {
  id: string;
  project_id: string;
  element_type: string;
  created_at?: string;
  input_json: Record<string, unknown>;
  result_json: Record<string, unknown>;
}

export const useCalculationRuns = (projectId?: string) =>
  useQuery<CalculationRun[]>({
    queryKey: ["calculation-runs", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      if (!projectId) {
        return [];
      }
      const { data } = await apiClient.get<CalculationRun[]>(`/calculations/runs/${projectId}`);
      return data;
    },
  });
