import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
export const useTasks = (projectId) => useQuery({
    queryKey: ["tasks", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
        const { data } = await apiClient.get(`/tasks/${projectId}`);
        return data;
    },
});
