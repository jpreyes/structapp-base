import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
export const useProjectDetail = (projectId) => useQuery({
    queryKey: ["project-detail", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
        const { data } = await apiClient.get(`/projects/${projectId}`);
        return data;
    },
});
