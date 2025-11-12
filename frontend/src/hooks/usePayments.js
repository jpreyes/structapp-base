import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
export const usePayments = (projectId) => useQuery({
    queryKey: ["payments", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
        const { data } = await apiClient.get(`/payments/${projectId}`);
        return data;
    },
});
