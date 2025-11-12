import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
export const useCalculationRuns = (projectId) => useQuery({
    queryKey: ["calculation-runs", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
        if (!projectId) {
            return [];
        }
        const { data } = await apiClient.get(`/calculations/runs/${projectId}`);
        return data;
    },
});
